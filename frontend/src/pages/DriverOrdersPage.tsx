import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
  Building2,
  ClipboardList,
  Truck,
  MapPin,
  Info,
  CheckCircle,
  XCircle,
  Archive,
} from "lucide-react"
import { fetchMe, updateDeliveryOrder, MeResponse } from "@/lib/api"

type DriverOrder = MeResponse["assigned_orders"][number]
type TabKey = "orders" | "closed" | "garage" | "vehicle"

const tabs = [
  { id: "orders", label: "Ordem de servico", icon: ClipboardList },
  { id: "closed", label: "Fechados", icon: Archive },
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
  const [selectedOrder, setSelectedOrder] = useState<DriverOrder | null>(null)
  const [note, setNote] = useState("")
  const [noteCache, setNoteCache] = useState<Record<number, string>>({})
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchMe()
      setMe(data)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados do motorista."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdating(true)
    try {
      await updateDeliveryOrder(orderId, { status })
      setMe((prev) =>
        prev
          ? {
              ...prev,
              assigned_orders: prev.assigned_orders.map((o) =>
                o.id === orderId ? { ...o, status } : o
              ),
            }
          : prev
      )
      setNoteCache((prev) => ({ ...prev, [orderId]: note }))
      setSelectedOrder((prev) => (prev ? { ...prev, status } : prev))
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao atualizar ordem."
      setError(message)
    } finally {
      setUpdating(false)
    }
  }

  const assignedOrders = me?.assigned_orders ?? []
  const activeOrders = assignedOrders.filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled"
  )
  const closedOrders = assignedOrders.filter(
    (order) => order.status === "delivered" || order.status === "cancelled"
  )
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
        ) : activeOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma ordem atribuida.</p>
        ) : (
          activeOrders.map((order) => (
            <button
              key={order.id}
              className="w-full flex items-start justify-between rounded-lg border bg-white/90 dark:bg-white/10 px-4 py-3 text-left shadow-sm hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedOrder(order)
                setNote(noteCache[order.id] || "")
              }}
            >
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {order.client_name}
                </p>
                <p className="text-sm text-muted-foreground">Status: {order.status}</p>
                {order.vehicle_model && (
                  <p className="text-xs text-muted-foreground">
                    Veiculo: {order.vehicle_model} ({order.vehicle_plate})
                  </p>
                )}
                {order.garage_name && (
                  <p className="text-xs text-muted-foreground">Garagem: {order.garage_name}</p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white px-3 py-1 text-xs font-medium">
                #{order.id}
              </span>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )

  const renderClosedTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Fechados</CardTitle>
        <CardDescription>Ordens entregues ou canceladas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p>Carregando...</p>
        ) : closedOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma ordem fechada.</p>
        ) : (
          closedOrders.map((order) => (
            <div
              key={`closed-${order.id}`}
              className="flex items-start justify-between rounded-lg border bg-white/90 dark:bg-white/10 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {order.client_name}
                </p>
                <p className="text-sm text-muted-foreground">Status: {order.status}</p>
                {order.vehicle_model && (
                  <p className="text-xs text-muted-foreground">
                    Veiculo: {order.vehicle_model} ({order.vehicle_plate})
                  </p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white px-3 py-1 text-xs font-medium">
                #{order.id}
              </span>
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
        <CardDescription>Garagem atribuida para estacionar ao fim do expediente.</CardDescription>
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
              <p className="font-semibold">{order.garage_name || "Garagem nao informada"}</p>
              <p className="text-sm text-muted-foreground">
                Relacionada a ordem #{order.id}
                {order.client_name ? ` para ${order.client_name}` : ""}
              </p>
              {order.vehicle_plate && (
                <p className="text-xs text-muted-foreground">
                  Veiculo alocado: {order.vehicle_model || "Veiculo"} ({order.vehicle_plate})
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
        <CardDescription>Veiculo vinculado as suas ordens ativas.</CardDescription>
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
                  <p className="text-sm text-muted-foreground">Placa: {order.vehicle_plate}</p>
                )}
                {order.garage_name && (
                  <p className="text-xs text-muted-foreground">Garagem de apoio: {order.garage_name}</p>
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
      {activeTab === "closed" && renderClosedTab()}
      {activeTab === "garage" && renderGarageTab()}
      {activeTab === "vehicle" && renderVehicleTab()}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-3 py-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl shadow-2xl">
            <div className="flex items-start justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm text-muted-foreground">Ordem #{selectedOrder.id}</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedOrder.client_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                aria-label="Fechar detalhe"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Destino nao informado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Status atual: {selectedOrder.status}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Observacao (fica salva localmente)
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm p-2"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Como foi a entrega, ocorrencias, contato com cliente..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleStatusChange(selectedOrder.id, "in_transit")}
                  disabled={updating}
                >
                  <CheckCircle className="h-4 w-4" />
                  Em progresso
                </Button>
                <Button
                  variant="default"
                  className="w-full gap-2"
                  onClick={() => handleStatusChange(selectedOrder.id, "delivered")}
                  disabled={updating}
                >
                  <CheckCircle className="h-4 w-4" />
                  Finalizar
                </Button>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                  disabled={updating}
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverOrdersPage
