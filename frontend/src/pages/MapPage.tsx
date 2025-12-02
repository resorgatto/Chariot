import { useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useQuery } from "@tanstack/react-query"
import { fetchVehicles, fetchGarages } from "@/lib/api"

const MapPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vehicles-map"],
    queryFn: fetchVehicles,
    refetchInterval: 3000,
  })

  const { data: garagesData } = useQuery({
    queryKey: ["garages-map"],
    queryFn: fetchGarages,
  })

  const vehicleMarkers = useMemo(() => {
    const vehicles = data?.results || []
    return vehicles.filter(
      (v) =>
        typeof v.last_latitude === "number" &&
        typeof v.last_longitude === "number"
    )
  }, [data])

  const garageMarkers = useMemo(() => {
    const garages = garagesData?.results || []
    return garages.filter(
      (g) => typeof g.latitude === "number" && typeof g.longitude === "number"
    )
  }, [garagesData])

  const defaultCenter =
    vehicleMarkers.length > 0
      ? [vehicleMarkers[0].last_latitude as number, vehicleMarkers[0].last_longitude as number]
      : garageMarkers.length > 0
      ? [garageMarkers[0].latitude as number, garageMarkers[0].longitude as number]
      : [-23.5505, -46.6333]

  return (
    <div className="h-[calc(100vh-112px)] w-full space-y-4">
      {error && (
        <p className="text-red-500 text-sm">
          Erro ao carregar veiculos: {error instanceof Error ? error.message : "erro"}
        </p>
      )}
      {isLoading ? (
        <p>Carregando mapa...</p>
      ) : vehicleMarkers.length === 0 && garageMarkers.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum veiculo ou garagem com coordenadas. Marque veiculos como em transito ou cadastre coordenadas.
        </p>
      ) : (
        <MapContainer
          center={defaultCenter as [number, number]}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {vehicleMarkers.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[
                vehicle.last_latitude as number,
                vehicle.last_longitude as number,
              ]}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{vehicle.model}</p>
                  <p className="text-sm text-muted-foreground">
                    Placa: {vehicle.plate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {vehicle.status}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
          {garageMarkers.map((garage) => (
            <Marker
              key={`g-${garage.id}`}
              position={[garage.latitude as number, garage.longitude as number]}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{garage.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {garage.address}, {garage.street_number} (CEP: {garage.postal_code})
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  )
}

export default MapPage
