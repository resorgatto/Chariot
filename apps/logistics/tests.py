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
    Garage,
    Route,
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
        self.garage = Garage.objects.create(
            name="Base Central",
            address="Rua Principal",
            postal_code="01000-000",
            street_number="100",
            capacity=10,
        )
        self.vehicle_list_url = reverse("vehicle-list")
        self.coverage_url = reverse("coverage-check")
        self.garage_list_url = reverse("garage-list")
        self.dashboard_url = reverse("dashboard-summary")
        self.delivery_area_list_url = reverse("deliveryarea-list")
        self.user_list_url = reverse("user-list")
        self.route_list_url = reverse("route-list")

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
            "garage": self.garage.id,
        }
        resp = client.post(self.vehicle_list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_user_create_only_admin(self):
        # non-admin blocked
        client = APIClient()
        client.force_authenticate(user=self.driver_user)
        resp = client.post(
          self.user_list_url,
          {"username": "newuser", "password": "pass12345"},
          format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # admin allowed
        client.force_authenticate(user=self.admin)
        resp_admin = client.post(
          self.user_list_url,
          {
              "username": "newadminuser",
              "password": "pass12345",
              "email": "new@chariot.com",
          },
          format="json",
        )
        self.assertEqual(resp_admin.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp_admin.data["username"], "newadminuser")

    def test_route_create_only_admin(self):
        payload = {
            "name": "Rota Centro",
            "vehicle": None,
            "start_latitude": -23.55,
            "start_longitude": -46.63,
            "end_latitude": -23.56,
            "end_longitude": -46.62,
            "distance_km": 5.2,
        }
        # Non admin forbidden
        client = APIClient()
        client.force_authenticate(user=self.driver_user)
        resp = client.post(self.route_list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Admin allowed
        client.force_authenticate(user=self.admin)
        resp_admin = client.post(self.route_list_url, payload, format="json")
        self.assertEqual(resp_admin.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp_admin.data["name"], "Rota Centro")

    def test_route_list_authenticated(self):
        Route.objects.create(
            name="Rota 1",
            vehicle=None,
            start_location=Point(-46.63, -23.55, srid=4326),
            end_location=Point(-46.62, -23.56, srid=4326),
        )
        client = APIClient()
        client.force_authenticate(user=self.driver_user)
        resp = client.get(self.route_list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_delivery_order_create_accepts_geojson(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        payload = {
            "client_name": "BRAVEND",
            "pickup_location": {
                "type": "Point",
                "coordinates": [-46.5657155, -23.5414685],
            },
            "dropoff_location": {
                "type": "Point",
                "coordinates": [-46.5152317, -23.5346405],
            },
            "status": DeliveryStatus.PENDING,
            "deadline": (timezone.now() + timedelta(hours=2)).isoformat(),
        }
        resp = client.post(reverse("deliveryorder-list"), payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            resp.data["pickup_location"]["coordinates"],
            [-46.5657155, -23.5414685],
        )
        self.assertEqual(resp.data["status"], DeliveryStatus.PENDING)

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

    def test_delivery_area_create_via_api(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        payload = {
            "name": "Area raio 5km",
            "center_latitude": -23.55,
            "center_longitude": -46.63,
            "radius_km": 5,
        }
        resp = client.post(self.delivery_area_list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], payload["name"])
        self.assertIsNotNone(resp.data.get("centroid_latitude"))
        self.assertIsNotNone(resp.data.get("estimated_radius_km"))

    def test_garage_crud_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        payload = {
            "name": "Garagem Central",
            "address": "Av. Principal, 100",
            "postal_code": "01000-000",
            "street_number": "100",
            "capacity": 20,
        }
        resp = client.post(self.garage_list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        garage_id = resp.data["id"]
        resp_list = client.get(self.garage_list_url)
        self.assertEqual(resp_list.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_list.data["count"], 1)
        self.assertEqual(resp_list.data["results"][0]["id"], garage_id)

    def test_dashboard_summary_counts(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        Vehicle.objects.create(
            plate="AAA-0001",
            model="Truck",
            capacity_kg=1000,
            type=VehicleType.TRUCK,
        )
        Garage.objects.create(
            name="Base Norte",
            address="Rua X",
            capacity=10,
        )
        resp = client.get(self.dashboard_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(resp.data["vehicles"], 1)
        self.assertGreaterEqual(resp.data["garages"], 1)
