import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Building2, ClipboardList, Truck } from "lucide-react"
import { fetchMe, updateDeliveryOrder, MeResponse } from "@/lib/api"

type DriverOrder = MeResponse["assigned_orders"][number]
type TabKey = "orders" | "garage" | "vehicle"

const tabs = [
  { id: "orders", label: "Ordem de servico", icon: ClipboardList },
  { id: "garage", label: "Garagem", icon: Building2 },
  { id: "vehicle", label: "Automovel", icon: Truck },
] as const

const uniqueBy = (
  items: DriverOrder[],
  keyFn: (item: DriverOrder) => string | null
) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFn(item)
    if (!key) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const DriverOrdersPage = () => {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("orders")

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchMe()
      setMe(data)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao carregar dados do motorista."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleStart = async (orderId: number) => {
    try {
      await updateDeliveryOrder(orderId, { status: "in_transit" })
      setMe((prev) =>
        prev
          ? {
              ...prev,
              assigned_orders: prev.assigned_orders.map((o) =>
                o.id === orderId ? { ...o, status: "in_transit" } : o
              ),
            }
          : prev
      )
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao atualizar ordem."
      setError(message)
    }
  }

  const assignedOrders = me?.assigned_orders ?? []
  const garageAssignments = uniqueBy(assignedOrders, (order) => {
    if (order.garage) return `garage-${order.garage}`
    if (order.garage_name) return `garage-name-${order.garage_name}`
    return null
  })
  const vehicleAssignments = uniqueBy(assignedOrders, (order) => {
    if (order.vehicle) return `vehicle-${order.vehicle}`
    if (order.vehicle_plate) return `vehicle-plate-${order.vehicle_plate}`
    if (order.vehicle_model) return `vehicle-model-${order.vehicle_model}`
    return null
  })

  const renderOrdersTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Ordens atribuidas</CardTitle>
        <CardDescription>Acompanhe e inicie seu roteiro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p>Carregando...</p>
        ) : assignedOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma ordem atribuida.</p>
        ) : (
          assignedOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-start justify-between rounded-lg border bg-white/80 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="font-semibold">{order.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {order.status}
                </p>
                {order.vehicle_model && (
                  <p className="text-xs text-muted-foreground">
                    Veiculo: {order.vehicle_model} ({order.vehicle_plate})
                  </p>
                )}
                {order.garage_name && (
                  <p className="text-xs text-muted-foreground">
                    Garagem: {order.garage_name}
                  </p>
                )}
              </div>
              {order.status === "planned" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleStart(order.id)}
                >
                  Marcar em rota
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )

  const renderGarageTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Garagem</CardTitle>
        <CardDescription>
          Garagem atribuida para estacionar ao fim do expediente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p>Carregando...</p>
        ) : garageAssignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma garagem associada as suas ordens no momento.
          </p>
        ) : (
          garageAssignments.map((order) => (
            <div
              key={`garage-${order.garage ?? order.garage_name ?? order.id}`}
              className="rounded-lg border bg-white/80 px-4 py-3"
            >
              <p className="font-semibold">
                {order.garage_name || "Garagem nao informada"}
              </p>
              <p className="text-sm text-muted-foreground">
                Relacionada a ordem #{order.id}
                {order.client_name ? ` para ${order.client_name}` : ""}
              </p>
              {order.vehicle_plate && (
                <p className="text-xs text-muted-foreground">
                  Veiculo alocado: {order.vehicle_model || "Veiculo"} (
                  {order.vehicle_plate})
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )

  const renderVehicleTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Automovel</CardTitle>
        <CardDescription>
          Veiculo vinculado as suas ordens ativas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p>Carregando...</p>
        ) : vehicleAssignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum veiculo atribuido a voce no momento.
          </p>
        ) : (
          vehicleAssignments.map((order) => (
            <div
              key={`vehicle-${order.vehicle ?? order.vehicle_plate ?? order.id}`}
              className="flex items-start justify-between rounded-lg border bg-white/80 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="font-semibold">
                  {order.vehicle_model || "Veiculo designado"}
                </p>
                {order.vehicle_plate && (
                  <p className="text-sm text-muted-foreground">
                    Placa: {order.vehicle_plate}
                  </p>
                )}
                {order.garage_name && (
                  <p className="text-xs text-muted-foreground">
                    Garagem de apoio: {order.garage_name}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Ordem #{order.id}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Area do motorista</h1>
        <p className="text-sm text-muted-foreground">
          Visualize suas ordens, a garagem de retorno e o veiculo designado.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setActiveTab(id)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {activeTab === "orders" && renderOrdersTab()}
      {activeTab === "garage" && renderGarageTab()}
      {activeTab === "vehicle" && renderVehicleTab()}
    </div>
  )
}

export default DriverOrdersPage
