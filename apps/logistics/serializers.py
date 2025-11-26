from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import DeliveryArea, DeliveryOrder, Driver, Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'plate', 'model', 'capacity_kg', 'type']


class DriverSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        read_only=False,
        queryset=get_user_model().objects.all(),
    )

    class Meta:
        model = Driver
        fields = ['id', 'user', 'license_number', 'current_status']


class DeliveryOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryOrder
        fields = [
            'id',
            'client_name',
            'pickup_location',
            'dropoff_location',
            'status',
            'deadline',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class CoverageCheckSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class DeliveryAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryArea
        fields = ['id', 'name']
