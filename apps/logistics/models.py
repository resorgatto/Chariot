from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models


class VehicleType(models.TextChoices):
    TRUCK = "truck", "Caminhao"
    VAN = "van", "Van"
    CAR = "car", "Carro"
    MOTORCYCLE = "motorcycle", "Moto"


class Vehicle(models.Model):
    plate = models.CharField("Placa", max_length=10, unique=True)
    model = models.CharField("Modelo", max_length=100)
    capacity_kg = models.PositiveIntegerField("Capacidade (kg)")
    type = models.CharField(
        "Tipo",
        max_length=20,
        choices=VehicleType.choices,
    )

    class Meta:
        ordering = ["plate"]
        verbose_name = "Veiculo"
        verbose_name_plural = "Veiculos"

    def __str__(self) -> str:
        return f"{self.plate} - {self.model}"


class DriverStatus(models.TextChoices):
    AVAILABLE = "available", "Disponivel"
    ON_ROUTE = "on_route", "Em rota"
    UNAVAILABLE = "unavailable", "Indisponivel"


class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="driver_profile",
    )
    license_number = models.CharField("CNH", max_length=20, unique=True)
    current_status = models.CharField(
        "Status",
        max_length=20,
        choices=DriverStatus.choices,
        default=DriverStatus.AVAILABLE,
    )

    class Meta:
        ordering = ["user__username"]
        verbose_name = "Motorista"
        verbose_name_plural = "Motoristas"

    def __str__(self) -> str:
        return f"{self.user.get_full_name() or self.user.username} ({self.license_number})"


class DeliveryStatus(models.TextChoices):
    PENDING = "pending", "Pendente"
    IN_TRANSIT = "in_transit", "Em transito"
    DELIVERED = "delivered", "Entregue"
    CANCELLED = "cancelled", "Cancelado"


class DeliveryArea(models.Model):
    name = models.CharField("Nome", max_length=100)
    area = gis_models.PolygonField("Area de cobertura", geography=True)
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Area de Entrega"
        verbose_name_plural = "Areas de Entrega"

    def __str__(self) -> str:
        return self.name


class DeliveryOrder(models.Model):
    client_name = models.CharField("Cliente", max_length=255)
    pickup_location = gis_models.PointField(
        "Endereco de Coleta",
        geography=True,
    )
    dropoff_location = gis_models.PointField(
        "Endereco de Entrega",
        geography=True,
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
    )
    deadline = models.DateTimeField("Prazo")
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Ordem de Entrega"
        verbose_name_plural = "Ordens de Entrega"

    def __str__(self) -> str:
        return f"{self.client_name} - {self.get_status_display()}"
