from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point, Polygon
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import (
    DeliveryArea,
    DeliveryOrder,
    DeliveryStatus,
    DriverStatus,
    Driver,
    Vehicle,
    VehicleType,
)


class LogisticsModelTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.admin = self.User.objects.create_user(
            username="admin",
            password="adminpass",
            is_staff=True,
            is_superuser=True,
        )
        self.driver_user = self.User.objects.create_user(
            username="driver",
            password="driverpass",
        )

    def test_vehicle_str(self):
        vehicle = Vehicle.objects.create(
            plate="ABC-1234",
            model="Furgao",
            capacity_kg=1000,
            type=VehicleType.VAN,
        )
        self.assertEqual(str(vehicle), "ABC-1234 - Furgao")

    def test_driver_default_status(self):
        driver = Driver.objects.create(
            user=self.driver_user,
            license_number="CNH123456",
        )
        self.assertEqual(driver.current_status, DriverStatus.AVAILABLE)

    def test_delivery_area_contains_point(self):
        polygon = Polygon(
            (
                (0, 0),
                (0, 1),
                (1, 1),
                (1, 0),
                (0, 0),
            ),
            srid=4326,
        )
        area = DeliveryArea.objects.create(name="Area 1", area=polygon)
        point_inside = Point(0.5, 0.5, srid=4326)
        point_outside = Point(2, 2, srid=4326)

        self.assertTrue(area.area.contains(point_inside) or area.area.covers(point_inside))
        self.assertFalse(area.area.contains(point_outside) or area.area.covers(point_outside))

    def test_status_change_triggers_notification_task(self):
        pickup = Point(-46.57421, -23.55052, srid=4326)
        dropoff = Point(-46.57421, -23.54052, srid=4326)
        order = DeliveryOrder.objects.create(
            client_name="Cliente X",
            pickup_location=pickup,
            dropoff_location=dropoff,
            status=DeliveryStatus.PENDING,
            deadline=timezone.now() + timedelta(days=1),
        )

        with patch("apps.logistics.signals.send_delivery_status_email.delay") as mocked_delay:
            order.status = DeliveryStatus.IN_TRANSIT
            order.save()
            mocked_delay.assert_called_once_with(order.id)


class LogisticsAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.admin = self.User.objects.create_user(
            username="admin",
            password="adminpass",
            is_staff=True,
            is_superuser=True,
        )
        self.driver_user = self.User.objects.create_user(
            username="driver",
            password="driverpass",
        )
        self.vehicle_list_url = reverse("vehicle-list")
        self.coverage_url = reverse("coverage-check")

    def test_vehicle_list_read_access(self):
        Vehicle.objects.create(
            plate="ABC-1234",
            model="Furgao",
            capacity_kg=1000,
            type=VehicleType.VAN,
        )
        client = APIClient()
        client.force_authenticate(user=self.driver_user)
        resp = client.get(self.vehicle_list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_vehicle_create_forbidden_for_non_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.driver_user)
        payload = {
            "plate": "XYZ-9999",
            "model": "Truck",
            "capacity_kg": 5000,
            "type": VehicleType.TRUCK,
        }
        resp = client.post(self.vehicle_list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_vehicle_create_allowed_for_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        payload = {
            "plate": "XYZ-9999",
            "model": "Truck",
            "capacity_kg": 5000,
            "type": VehicleType.TRUCK,
        }
        resp = client.post(self.vehicle_list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_coverage_check_endpoint(self):
        polygon = Polygon(
            (
                (-46.6, -23.6),
                (-46.6, -23.5),
                (-46.5, -23.5),
                (-46.5, -23.6),
                (-46.6, -23.6),
            ),
            srid=4326,
        )
        DeliveryArea.objects.create(name="SP Zona Central", area=polygon)
        client = APIClient()
        resp = client.post(
            self.coverage_url,
            {"latitude": -23.55, "longitude": -46.55},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["covered"])
        self.assertEqual(len(resp.data["areas"]), 1)
