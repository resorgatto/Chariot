from django.conf import settings
from django.contrib.gis.geos import Point
from rest_framework import permissions, viewsets, status as drf_status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
import requests

from .models import (
    DeliveryArea,
    DeliveryOrder,
    DeliveryStatus,
    Driver,
    Garage,
    Notification,
    PushSubscription,
    Vehicle,
    VehicleStatus,
)
from .serializers import (
    CoverageCheckSerializer,
    DeliveryAreaSerializer,
    DeliveryOrderSerializer,
    DriverSerializer,
    GarageSerializer,
    NotificationSerializer,
    PushSubscriptionSerializer,
    VehicleSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access for authenticated users and write access for admins.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAdminOrReadOnly]


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.select_related("user").all()
    serializer_class = DriverSerializer
    permission_classes = [IsAdminOrReadOnly]


class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.all()
    serializer_class = DeliveryOrderSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_permissions(self):
        # Admins can tudo, drivers podem alterar status apenas das ordens atribuídas
        if self.action in ["update", "partial_update"]:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def partial_update(self, request, *args, **kwargs):
        # Admin segue fluxo normal
        if request.user.is_staff:
            return super().partial_update(request, *args, **kwargs)

        driver_profile = getattr(request.user, "driver_profile", None)
        if not driver_profile:
            return Response({"detail": "Apenas motoristas podem atualizar ordens."}, status=drf_status.HTTP_403_FORBIDDEN)

        instance = self.get_object()
        if instance.driver_id != driver_profile.id:
            return Response({"detail": "Esta ordem não está atribuída a você."}, status=drf_status.HTTP_403_FORBIDDEN)

        # Restringe campos que o motorista pode alterar
        status_value = request.data.get("status")
        if status_value is None:
            return Response({"detail": "Informe o campo 'status'."}, status=drf_status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data={"status": status_value}, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class GarageViewSet(viewsets.ModelViewSet):
    queryset = Garage.objects.all()
    serializer_class = GarageSerializer
    permission_classes = [IsAdminOrReadOnly]


class DeliveryAreaViewSet(viewsets.ModelViewSet):
    queryset = DeliveryArea.objects.all()
    serializer_class = DeliveryAreaSerializer
    permission_classes = [IsAdminOrReadOnly]


class CoverageCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CoverageCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lat = serializer.validated_data['latitude']
        lon = serializer.validated_data['longitude']
        point = Point(lon, lat, srid=4326)

        matched_areas = []
        for area in DeliveryArea.objects.all():
            if area.area.contains(point) or area.area.covers(point):
                matched_areas.append(DeliveryAreaSerializer(area).data)

        return Response(
            {
                "covered": bool(matched_areas),
                "areas": matched_areas,
            }
        )


class NotificationViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"updated": updated})


class PushSubscriptionViewSet(
    mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = PushSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PushSubscription.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="public-key")
    def public_key(self, request):
        return Response({"public_key": getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", "")})


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "vehicles": Vehicle.objects.count(),
                "drivers": Driver.objects.count(),
                "delivery_orders": DeliveryOrder.objects.count(),
                "in_transit_orders": DeliveryOrder.objects.filter(
                    status=DeliveryStatus.IN_TRANSIT
                ).count(),
                "garages": Garage.objects.count(),
            }
        )


class CepLookupView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cep = (request.query_params.get("cep") or "").replace("-", "").strip()
        if not cep:
            return Response({"detail": "CEP nao informado."}, status=400)

        try:
            resp = requests.get(
                f"https://viacep.com.br/ws/{cep}/json/",
                timeout=5,
            )
            if resp.status_code != 200:
                return Response({"detail": "CEP invalido."}, status=400)
            data = resp.json()
            if data.get("erro"):
                return Response({"detail": "CEP invalido."}, status=400)
        except requests.RequestException:
            return Response(
                {"detail": "Falha ao consultar o CEP."}, status=502
            )

        address_line = ", ".join(
            filter(
                None,
                [
                    data.get("logradouro"),
                    data.get("bairro"),
                    f"{data.get('localidade')}-{data.get('uf')}",
                ],
            )
        )

        lat = lon = None
        try:
            geo_resp = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "format": "json",
                    "q": address_line,
                    "limit": 1,
                },
                headers={"User-Agent": "EcoFleet/1.0"},
                timeout=6,
            )
            if geo_resp.status_code == 200:
                results = geo_resp.json()
                if results:
                    lat = float(results[0]["lat"])
                    lon = float(results[0]["lon"])
        except requests.RequestException:
            pass

        return Response(
            {
                "cep": data.get("cep", cep),
                "street": data.get("logradouro", ""),
                "neighborhood": data.get("bairro", ""),
                "city": data.get("localidade", ""),
                "state": data.get("uf", ""),
                "address": address_line,
                "latitude": lat,
                "longitude": lon,
            }
        )
