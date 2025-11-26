from django.contrib.gis.geos import Point
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeliveryArea, DeliveryOrder, Driver, Vehicle
from .serializers import (
    CoverageCheckSerializer,
    DeliveryAreaSerializer,
    DeliveryOrderSerializer,
    DriverSerializer,
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
