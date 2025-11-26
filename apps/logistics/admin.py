from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import DeliveryArea, DeliveryOrder, Driver, Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate", "model", "capacity_kg", "type")
    list_filter = ("type",)
    search_fields = ("plate", "model")


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
