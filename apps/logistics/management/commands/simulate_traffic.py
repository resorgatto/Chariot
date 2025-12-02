import random
import time

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from apps.logistics.models import Vehicle, VehicleStatus


class Command(BaseCommand):
    help = "Simula movimento de veiculos em transito atualizando last_location."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Iniciando simulacao de trafego..."))

        # Ponto base (Sao Paulo) para veiculos sem posicao inicial
        base_point = Point(-46.6333, -23.5505, srid=4326)

        while True:
            vehicles = Vehicle.objects.all()
            if not vehicles.exists():
                self.stdout.write(self.style.WARNING("Nenhum veiculo cadastrado."))
            for vehicle in vehicles:
                # Garanta que participe da simulacao
                if vehicle.status != VehicleStatus.IN_TRANSIT:
                    vehicle.status = VehicleStatus.IN_TRANSIT
                current_point = vehicle.last_location or base_point

                # Deslocamento aleatorio pequeno
                delta_lat = random.uniform(-0.0005, 0.0005)
                delta_lon = random.uniform(-0.0005, 0.0005)

                new_lat = current_point.y + delta_lat
                new_lon = current_point.x + delta_lon

                vehicle.last_location = Point(new_lon, new_lat, srid=4326)
                vehicle.save(update_fields=["last_location", "updated_at", "status"])

                msg = f"{vehicle.plate} -> lat: {new_lat:.6f}, lon: {new_lon:.6f}"
                self.stdout.write(self.style.SUCCESS(msg))

            time.sleep(3)
