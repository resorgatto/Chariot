import { useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useQuery } from "@tanstack/react-query"
import { fetchVehicles, fetchGarages } from "@/lib/api"

const pinSvg = (fill: string, inner: string) => `
  <svg width="36" height="36" viewBox="0 0 36 36">
    <path d="M18 2C11.373 2 6 7.373 6 14c0 7.774 12 20 12 20s12-12.226 12-20C30 7.373 24.627 2 18 2z" fill="${fill}"/>
    ${inner}
  </svg>
`

const vehicleIcon = L.divIcon({
  html: pinSvg(
    "#2563eb",
    `<path d="M11 17.5c0-.552.448-1 1-1h12c.552 0 1 .448 1 1v2.5h-1c0 1.105-.895 2-2 2s-2-.895-2-2h-4c0 1.105-.895 2-2 2s-2-.895-2-2h-1v-2.5zm2.5-4.5 1.2-2.4c.17-.34.52-.55.9-.55h6.8c.38 0 .73.21.9.55L25.5 13H13.5z" fill="white"/>`
  ),
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
})

const garageIcon = L.divIcon({
  html: pinSvg(
    "#0f766e",
    `<path d="M12 17.5V14l6-4 6 4v3.5h-2V22h-8v-4.5z" fill="white"/><path d="M14.5 21.5h7" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
})

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
              icon={vehicleIcon}
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
              icon={garageIcon}
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
