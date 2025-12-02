import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { fetchMe, updateDeliveryOrder, MeResponse } from "@/lib/api"

const DriverOrdersPage = () => {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchMe()
      setMe(data)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar ordens do motorista."
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Ordens</h1>
        <p className="text-sm text-muted-foreground">
          Visualize as ordens e o veículo/garagem atribuídos a você.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Ordens atribuídas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p>Carregando...</p>
          ) : !me || !me.assigned_orders || me.assigned_orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma ordem atribuída.
            </p>
          ) : (
            me.assigned_orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b pb-2 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{order.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {order.status}
                  </p>
                  {order.vehicle_model && (
                    <p className="text-xs text-muted-foreground">
                      Veículo: {order.vehicle_model} ({order.vehicle_plate})
                    </p>
                  )}
                  {order.garage_name && (
                    <p className="text-xs text-muted-foreground">
                      Garagem: {order.garage_name}
                    </p>
                  )}
                </div>
                {order.status === "planned" && (
                  <Button size="sm" variant="secondary" onClick={() => handleStart(order.id)}>
                    Marcar em rota
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DriverOrdersPage
