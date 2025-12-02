import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  createDeliveryOrder,
  fetchDeliveryOrders,
  DeliveryOrder,
  lookupCep,
} from "@/lib/api"

const DeliveryOrdersPage = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    client_name: "",
    status: "pending",
    deadline: "",
    pickup_cep: "",
    pickup_latitude: "",
    pickup_longitude: "",
    dropoff_cep: "",
    dropoff_latitude: "",
    dropoff_longitude: "",
  })
  const [cepLoading, setCepLoading] = useState({ pickup: false, dropoff: false })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchDeliveryOrders()
      setOrders(data.results || [])
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar ordens."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        client_name: form.client_name.trim(),
        status: form.status,
        deadline: form.deadline,
        pickup_latitude: Number(form.pickup_latitude),
        pickup_longitude: Number(form.pickup_longitude),
        dropoff_latitude: Number(form.dropoff_latitude),
        dropoff_longitude: Number(form.dropoff_longitude),
      }
      const created = await createDeliveryOrder(payload)
      setOrders((prev) => [created, ...prev])
      setForm({
        client_name: "",
        status: "pending",
        deadline: "",
        pickup_cep: "",
        pickup_latitude: "",
        pickup_longitude: "",
        dropoff_cep: "",
        dropoff_latitude: "",
        dropoff_longitude: "",
      })
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar ordem."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCepLookup = async (kind: "pickup" | "dropoff") => {
    const cep = kind === "pickup" ? form.pickup_cep : form.dropoff_cep
    const cleanCep = cep.replace(/\D/g, "")
    if (!cleanCep) {
      setError("Informe um CEP.")
      return
    }
    setCepLoading((prev) => ({ ...prev, [kind]: true }))
    try {
      const data = await lookupCep(cleanCep)
      const lat = data.latitude ? String(data.latitude) : ""
      const lon = data.longitude ? String(data.longitude) : ""
      if (kind === "pickup") {
        setForm((prev) => ({
          ...prev,
          pickup_cep: data.cep || prev.pickup_cep,
          pickup_latitude: lat,
          pickup_longitude: lon,
        }))
      } else {
        setForm((prev) => ({
          ...prev,
          dropoff_cep: data.cep || prev.dropoff_cep,
          dropoff_latitude: lat,
          dropoff_longitude: lon,
        }))
      }
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao buscar CEP."
      setError(message)
    } finally {
      setCepLoading((prev) => ({ ...prev, [kind]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Entrega</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre coletas e entregas informando coordenadas.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Nova ordem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_name">Cliente</Label>
              <Input
                id="client_name"
                value={form.client_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, client_name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="pending">Pendente</option>
                <option value="in_transit">Em rota</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadline: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Origem (lat/lon)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="CEP"
                  value={form.pickup_cep}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, pickup_cep: e.target.value }))
                  }
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={cepLoading.pickup}
                  onClick={() => handleCepLookup("pickup")}
                >
                  {cepLoading.pickup ? "Buscando..." : "Buscar CEP"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Lat"
                  type="number"
                  step="any"
                  value={form.pickup_latitude}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pickup_latitude: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Lon"
                  type="number"
                  step="any"
                  value={form.pickup_longitude}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pickup_longitude: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Destino (lat/lon)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="CEP"
                  value={form.dropoff_cep}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dropoff_cep: e.target.value }))
                  }
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={cepLoading.dropoff}
                  onClick={() => handleCepLookup("dropoff")}
                >
                  {cepLoading.dropoff ? "Buscando..." : "Buscar CEP"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Lat"
                  type="number"
                  step="any"
                  value={form.dropoff_latitude}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dropoff_latitude: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Lon"
                  type="number"
                  step="any"
                  value={form.dropoff_longitude}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dropoff_longitude: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar ordem"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ordens cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p>Carregando...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma ordem cadastrada.
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b pb-2 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{order.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {order.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prazo: {order.deadline}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DeliveryOrdersPage
