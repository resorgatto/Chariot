import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { DataTable } from "@/features/fleet/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/Badge"
import { useTheme } from "@/components/ThemeProvider"
import {
  DashboardSummary,
  fetchDashboardSummary,
  fetchDeliveries,
  fetchGarages,
  fetchVehicles,
  Garage,
  Vehicle,
} from "@/lib/api"

type DeliveryRow = {
  id: number
  client_name: string
  status: string
  deadline: string
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_transit: "Em rota",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const statusVariant: Record<string, "warning" | "success" | "danger" | "secondary"> = {
  pending: "warning",
  in_transit: "secondary",
  delivered: "success",
  cancelled: "danger",
}

const pinSvg = (fill: string, inner: string) => `
  <svg width="36" height="36" viewBox="0 0 36 36">
    <path d="M18 2C11.373 2 6 7.373 6 14c0 7.774 12 20 12 20s12-12.226 12-20C30 7.373 24.627 2 18 2z" fill="${fill}"/>
    ${inner}
  </svg>
`

const vehicleIcon = L.divIcon({
  html: pinSvg(
    "#F97316",
    `<path d="M11 17.5c0-.552.448-1 1-1h12c.552 0 1 .448 1 1v2.5h-1c0 1.105-.895 2-2 2s-2-.895-2-2h-4c0 1.105-.895 2-2 2s-2-.895-2-2h-1v-2.5zm2.5-4.5 1.2-2.4c.17-.34.52-.55.9-.55h6.8c.38 0 .73.21.9.55L25.5 13H13.5z" fill="white"/>`
  ),
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
})

const garageIcon = L.divIcon({
  html: pinSvg(
    "#EA580C",
    `<path d="M12 17.5V14l6-4 6 4v3.5h-2V22h-8v-4.5z" fill="white"/><path d="M14.5 21.5h7" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
})

const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [garages, setGarages] = useState<Garage[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState("")
  const { theme } = useTheme()

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, deliveriesData, garagesData, vehiclesData] =
          await Promise.all([
            fetchDashboardSummary(),
            fetchDeliveries(),
            fetchGarages(),
            fetchVehicles(),
          ])

        setSummary(summaryData)
        setDeliveries(
          (deliveriesData.results as DeliveryOrder[] | undefined)?.map(
            (d) =>
              ({
                id: d.id,
                client_name: d.client_name,
                status: d.status,
                deadline: d.deadline,
              } as DeliveryRow)
          ) || []
        )
        setGarages(garagesData.results || [])
        setVehicles(vehiclesData.results || [])
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar dashboard."
        setError(message)
      }
    }

    load()
  }, [])

  const deliveryColumns: ColumnDef<DeliveryRow>[] = useMemo(
    () => [
      {
        accessorKey: "client_name",
        header: "Cliente",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge variant={statusVariant[status] || "secondary"}>
              {statusLabels[status] || status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "deadline",
        header: "Prazo",
        cell: ({ row }) => {
          const value = row.getValue("deadline") as string
          const date = value ? new Date(value) : null
          return (
            <span className="text-sm text-muted-foreground">
              {date ? date.toLocaleString("pt-BR") : "-"}
            </span>
          )
        },
      },
    ],
    []
  )

  const vehiclePositions = garages
    .filter(
      (garage) =>
        typeof garage.latitude === "number" && typeof garage.longitude === "number"
    )
    .map((garage) => ({
      id: garage.id,
      position: [garage.latitude as number, garage.longitude as number] as [
        number,
        number
      ],
      name: garage.name,
      address: `${garage.address}, ${garage.street_number} (CEP: ${garage.postal_code || "-"})`,
    }))

  const vehicleMarkers = vehicles
    .filter(
      (v) =>
        typeof v.last_latitude === "number" &&
        typeof v.last_longitude === "number"
    )
    .map((v) => ({
      id: v.id,
      position: [v.last_latitude as number, v.last_longitude as number] as [
        number,
        number
      ],
      label: `${v.model} (${v.plate})`,
      status: v.status,
    }))

  const mapCenter =
    vehicleMarkers.length > 0
      ? vehicleMarkers[0].position
      : vehiclePositions.length > 0
      ? vehiclePositions[0].position
      : [-23.5505, -46.6333]

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? summary.vehicles : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Garagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? summary.garages : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? summary.delivery_orders : "-"}
            </div>
            <p className="text-sm text-muted-foreground">
              Em rota: {summary ? summary.in_transit_orders : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Motoristas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? summary.drivers : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Mapa de garagens e veículos</CardTitle>
          </CardHeader>
          <CardContent>
            {vehiclePositions.length === 0 && vehicleMarkers.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma garagem ou veículo com coordenadas. Defina posição (CEP) ou marque veículos em trânsito.
              </p>
            ) : (
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: "400px", width: "100%" }}
          className="bg-white dashboard-map"
        >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {vehiclePositions.map((item) => (
                  <Marker key={item.id} position={item.position} icon={garageIcon}>
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.address}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {vehicleMarkers.map((item) => (
                  <Marker key={`v-${item.id}`} position={item.position} icon={vehicleIcon}>
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {item.status}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ultimas entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={deliveryColumns} data={deliveries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Veiculos cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum veiculo cadastrado.
              </p>
            ) : (
              vehicles.slice(0, 5).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between border-b pb-2 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{vehicle.model}</p>
                    <p className="text-sm text-muted-foreground">
                      Placa: {vehicle.plate}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {vehicle.type}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
