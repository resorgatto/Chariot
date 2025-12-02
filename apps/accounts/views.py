from rest_framework import permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .serializers import UserSerializer


class IsAdminOnly(permissions.BasePermission):
    """
    Allow actions only for staff/admin users.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class UserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminOnly]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        driver_profile = getattr(user, "driver_profile", None)
        is_driver = bool(driver_profile)
        assigned_orders = []
        if driver_profile:
            from apps.logistics.models import DeliveryOrder

            qs = DeliveryOrder.objects.filter(driver=driver_profile).select_related(
                "vehicle", "vehicle__garage"
            )
            for order in qs:
                assigned_orders.append(
                    {
                        "id": order.id,
                        "client_name": order.client_name,
                        "status": order.status,
                        "vehicle": order.vehicle_id,
                        "vehicle_plate": order.vehicle.plate if order.vehicle else None,
                        "vehicle_model": order.vehicle.model if order.vehicle else None,
                        "garage": order.vehicle.garage_id if order.vehicle and order.vehicle.garage else None,
                        "garage_name": order.vehicle.garage.name if order.vehicle and order.vehicle.garage else None,
                    }
                )
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "is_driver": is_driver,
                "assigned_orders": assigned_orders,
            }
        )
