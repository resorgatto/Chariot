from django.contrib.auth import get_user_model
from rest_framework import serializers
import math
from django.contrib.gis.geos import Point
from .models import DeliveryArea, DeliveryOrder, Driver, Garage, Vehicle, Route

class VehicleSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    last_latitude = serializers.SerializerMethodField(read_only=True)
    last_longitude = serializers.SerializerMethodField(read_only=True)
    set_latitude = serializers.FloatField(write_only=True, required=False)
    set_longitude = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = Vehicle
        fields = [
            'id',
            'plate',
            'model',
            'capacity_kg',
            'type',
            'status',
            'garage',
            'image',
            'last_latitude',
            'last_longitude',
            'set_latitude',
            'set_longitude',
        ]

    def get_last_latitude(self, obj):
        if obj.last_location:
            return obj.last_location.y
        return None

    def get_last_longitude(self, obj):
        if obj.last_location:
            return obj.last_location.x
        return None

    def _apply_location(self, instance, validated_data):
        lat = validated_data.pop("set_latitude", None)
        lon = validated_data.pop("set_longitude", None)
        if lat is not None and lon is not None:
            instance.last_location = Point(lon, lat, srid=4326)
        return instance

    def create(self, validated_data):
        instance = super().create(validated_data)
        instance = self._apply_location(instance, validated_data)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance = self._apply_location(instance, validated_data)
        instance.save()
        return instance


class DriverSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        read_only=False,
        queryset=get_user_model().objects.all(),
    )

    class Meta:
        model = Driver
        fields = ['id', 'user', 'license_number', 'current_status']


class DeliveryOrderSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField(read_only=True)
    vehicle_plate = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliveryOrder
        fields = [
            'id',
            'client_name',
            'driver',
            'driver_name',
            'vehicle',
            'vehicle_plate',
            'pickup_location',
            'dropoff_location',
            'status',
            'deadline',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_driver_name(self, obj):
        if obj.driver and obj.driver.user:
            return obj.driver.user.get_full_name() or obj.driver.user.username
        return None

    def get_vehicle_plate(self, obj):
        if obj.vehicle:
            return obj.vehicle.plate
        return None

    def _to_point(self, lon, lat, field_name):
        try:
            return Point(float(lon), float(lat), srid=4326)
        except (TypeError, ValueError):
            raise serializers.ValidationError(
                {field_name: "Coordenadas invalidas. Use numeros em [lon, lat]."}
            )

    def _coerce_point(self, value, field_name):
        """
        Accept GeoJSON Point objects or [lon, lat] lists and convert to Point.
        Raises a validation error with a friendly message instead of letting
        the model blow up with a TypeError.
        """
        if isinstance(value, Point):
            return value
        if isinstance(value, (list, tuple)) and len(value) == 2:
            lon, lat = value
            return self._to_point(lon, lat, field_name)
        if isinstance(value, dict):
            coords = value.get("coordinates")
            if isinstance(coords, (list, tuple)) and len(coords) == 2:
                lon, lat = coords
                return self._to_point(lon, lat, field_name)
            lat = value.get("lat") or value.get("latitude")
            lon = value.get("lon") or value.get("lng") or value.get("longitude")
            if lat is not None and lon is not None:
                return self._to_point(lon, lat, field_name)
        raise serializers.ValidationError(
            {field_name: "Use GeoJSON {'type': 'Point', 'coordinates': [lon, lat]} ou [lon, lat]."}
        )

    def _apply_points(self, validated_data):
        for field in ("pickup_location", "dropoff_location"):
            if field in validated_data:
                validated_data[field] = self._coerce_point(validated_data[field], field)
        return validated_data

    def create(self, validated_data):
        validated_data = self._apply_points(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_points(validated_data)
        return super().update(instance, validated_data)

    def _point_to_geojson(self, geom):
        if not geom:
            return None
        return {"type": "Point", "coordinates": [geom.x, geom.y]}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["pickup_location"] = self._point_to_geojson(instance.pickup_location)
        data["dropoff_location"] = self._point_to_geojson(instance.dropoff_location)
        data["driver_name"] = self.get_driver_name(instance)
        data["vehicle_plate"] = self.get_vehicle_plate(instance)
        return data


class CoverageCheckSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class DeliveryAreaSerializer(serializers.ModelSerializer):
    radius_km = serializers.FloatField(write_only=True, required=False)
    center_latitude = serializers.FloatField(write_only=True, required=False)
    center_longitude = serializers.FloatField(write_only=True, required=False)
    centroid_latitude = serializers.SerializerMethodField(read_only=True)
    centroid_longitude = serializers.SerializerMethodField(read_only=True)
    estimated_radius_km = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliveryArea
        fields = [
            'id',
            'name',
            'radius_km',
            'center_latitude',
            'center_longitude',
            'centroid_latitude',
            'centroid_longitude',
            'estimated_radius_km',
        ]

    def _build_circle(self, lon: float, lat: float, radius_km: float):
        """
        Create an approximate circular polygon around the given point.
        Uses a projected SRID (3857) to buffer in meters, then transforms back.
        """
        center = Point(lon, lat, srid=4326)
        projected = center.transform(3857, clone=True)
        buffered = projected.buffer(radius_km * 1000)
        return buffered.transform(4326, clone=True)

    def validate(self, attrs):
        if self.instance is None:  # creation
            missing = [
                key
                for key in ("radius_km", "center_latitude", "center_longitude")
                if attrs.get(key) is None
            ]
            if missing:
                raise serializers.ValidationError(
                    "Informe latitude, longitude e radius_km para criar a área."
                )
            if attrs.get("radius_km", 0) <= 0:
                raise serializers.ValidationError(
                    {"radius_km": "Use um valor maior que zero."}
                )
        return attrs

    def create(self, validated_data):
        radius_km = validated_data.pop("radius_km", None)
        center_lat = validated_data.pop("center_latitude", None)
        center_lon = validated_data.pop("center_longitude", None)

        if radius_km is not None and center_lat is not None and center_lon is not None:
            validated_data["area"] = self._build_circle(center_lon, center_lat, radius_km)
        return super().create(validated_data)

    def get_centroid_latitude(self, obj):
        if obj.area:
            return obj.area.centroid.y
        return None

    def get_centroid_longitude(self, obj):
        if obj.area:
            return obj.area.centroid.x
        return None

    def get_estimated_radius_km(self, obj):
        if not obj.area:
            return None
        # Approximate a radius using area equivalence on projected meters
        projected = obj.area.transform(3857, clone=True)
        if projected.area <= 0:
            return None
        radius_m = math.sqrt(projected.area / math.pi)
        return round(radius_m / 1000, 3)


class GarageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garage
        fields = [
            'id',
            'name',
            'address',
            'postal_code',
            'street_number',
            'capacity',
            'latitude',
            'longitude',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_driver_name(self, obj):
        if obj.driver and obj.driver.user:
            return obj.driver.user.get_full_name() or obj.driver.user.username
        return None

    def get_vehicle_plate(self, obj):
        if obj.vehicle:
            return obj.vehicle.plate
        return None


class RouteSerializer(serializers.ModelSerializer):
    start_latitude = serializers.FloatField(write_only=True)
    start_longitude = serializers.FloatField(write_only=True)
    end_latitude = serializers.FloatField(write_only=True)
    end_longitude = serializers.FloatField(write_only=True)
    vehicle_name = serializers.CharField(source="vehicle.model", read_only=True)
    driver_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Route
        fields = [
            "id",
            "name",
            "vehicle",
            "vehicle_name",
            "driver",
            "driver_name",
            "start_latitude",
            "start_longitude",
            "end_latitude",
            "end_longitude",
            "distance_km",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        start_lat = validated_data.pop("start_latitude")
        start_lon = validated_data.pop("start_longitude")
        end_lat = validated_data.pop("end_latitude")
        end_lon = validated_data.pop("end_longitude")
        validated_data["start_location"] = Point(start_lon, start_lat, srid=4326)
        validated_data["end_location"] = Point(end_lon, end_lat, srid=4326)
        return super().create(validated_data)

    def get_driver_name(self, obj):
        if obj.driver and obj.driver.user:
            return obj.driver.user.get_full_name() or obj.driver.user.username
        return None
