from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import (
    DeliveryArea,
    DeliveryOrder,
    Driver,
    Garage,
    Notification,
    PushSubscription,
    Vehicle,
    Route,
)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate", "model", "capacity_kg", "type", "garage")
    list_filter = ("type", "garage")
    search_fields = ("plate", "model")
    autocomplete_fields = ("garage",)


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ("user", "license_number", "current_status")
    list_filter = ("current_status",)
    search_fields = ("user__username", "user__email", "license_number")
    autocomplete_fields = ("user",)


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(GISModelAdmin):
    list_display = ("client_name", "status", "deadline", "created_at")
    list_filter = ("status",)
    search_fields = ("client_name",)
    default_lat = 0
    default_lon = 0
    default_zoom = 2


@admin.register(DeliveryArea)
class DeliveryAreaAdmin(GISModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    default_lat = 0
    default_lon = 0
    default_zoom = 2


@admin.register(Garage)
class GarageAdmin(admin.ModelAdmin):
    list_display = ("name", "capacity", "address", "postal_code", "street_number")
    search_fields = ("name", "address", "postal_code")


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("name", "vehicle", "status", "distance_km", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "vehicle__plate", "vehicle__model")
    autocomplete_fields = ("vehicle",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "order", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("title", "body", "user__username", "user__email")


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "endpoint", "created_at")
    search_fields = ("endpoint", "user__username", "user__email")
