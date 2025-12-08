import { useEffect, useMemo, useState } from "react"
import { Pencil, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  createDeliveryOrder,
  fetchDeliveryOrders,
  fetchDrivers,
  fetchVehicles,
  fetchGarages,
  fetchUsers,
  updateDeliveryOrder,
  updateVehicle,
  DeliveryOrder,
  Driver,
  Vehicle,
  Garage,
  AppUser,
  lookupCep,
} from "@/lib/api"

type OrderAssignForm = Record<
  number,
  { driver: string; vehicle: string; garage: string }
>

type EditOrderForm = {
  id: number
  client_name: string
  status: string
  deadline: string
  driver: string
  vehicle: string
  garage: string
  pickup_latitude: string
  pickup_longitude: string
  dropoff_latitude: string
  dropoff_longitude: string
}

const DeliveryOrdersPage = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [garages, setGarages] = useState<Garage[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
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
    driver: "",
    vehicle: "",
    garage: "",
  })
  const [cepLoading, setCepLoading] = useState({ pickup: false, dropoff: false })

  const [editingOrder, setEditingOrder] = useState<EditOrderForm | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editCepLoading, setEditCepLoading] = useState({
    pickup: false,
    dropoff: false,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersData, driversData, vehiclesData, garagesData, usersData] =
        await Promise.all([
          fetchDeliveryOrders(),
          fetchDrivers(),
          fetchVehicles(),
          fetchGarages(),
          fetchUsers(),
        ])
      setOrders(ordersData.results || [])
      setDrivers(driversData.results || [])
      setVehicles(vehiclesData.results || [])
      setGarages(garagesData.results || [])
      setUsers(usersData.results || [])
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
        driver: form.driver ? Number(form.driver) : null,
        vehicle: form.vehicle ? Number(form.vehicle) : null,
        garage: form.garage ? Number(form.garage) : null,
      }
      await createDeliveryOrder(payload)
      if (form.vehicle && form.garage) {
        await updateVehicle(Number(form.vehicle), { garage: Number(form.garage) })
      }

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
        driver: "",
        vehicle: "",
        garage: "",
      })
      setError("")
      await loadData()
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

  const handleEditCepLookup = async (
    kind: "pickup" | "dropoff",
    latField: keyof EditOrderForm,
    lonField: keyof EditOrderForm
  ) => {
    if (!editingOrder) return
    const cepValue = kind === "pickup" ? editingOrder.pickup_latitude : editingOrder.dropoff_latitude
    const cleanCep = cepValue.replace(/\D/g, "")
    if (!cleanCep) {
      setError("Informe um CEP.")
      return
    }
    setEditCepLoading((prev) => ({ ...prev, [kind]: true }))
    try {
      const data = await lookupCep(cleanCep)
      const lat = data.latitude ? String(data.latitude) : editingOrder[latField]
      const lon = data.longitude ? String(data.longitude) : editingOrder[lonField]
      setEditingOrder((prev) =>
        prev
          ? {
              ...prev,
              [latField]: lat,
              [lonField]: lon,
            }
          : prev
      )
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao buscar CEP."
      setError(message)
    } finally {
      setEditCepLoading((prev) => ({ ...prev, [kind]: false }))
    }
  }

  const openEdit = (order: DeliveryOrder) => {
    setEditingOrder({
      id: order.id,
      client_name: order.client_name || "",
      status: order.status || "pending",
      deadline: order.deadline
        ? (() => {
            const d = new Date(order.deadline)
            const tz = d.getTime() - d.getTimezoneOffset() * 60000
            return new Date(tz).toISOString().slice(0, 16)
          })()
        : "",
      driver: order.driver ? String(order.driver) : "",
      vehicle: order.vehicle ? String(order.vehicle) : "",
      garage: order.garage ? String(order.garage) : "",
      pickup_latitude: order.pickup_location?.coordinates?.[1]
        ? String(order.pickup_location.coordinates[1])
        : "",
      pickup_longitude: order.pickup_location?.coordinates?.[0]
        ? String(order.pickup_location.coordinates[0])
        : "",
      dropoff_latitude: order.dropoff_location?.coordinates?.[1]
        ? String(order.dropoff_location.coordinates[1])
        : "",
      dropoff_longitude: order.dropoff_location?.coordinates?.[0]
        ? String(order.dropoff_location.coordinates[0])
        : "",
    })
  }

  const handleSaveEdit = async () => {
    if (!editingOrder) return
    setEditSaving(true)
    try {
      const payload = {
        client_name: editingOrder.client_name.trim(),
        status: editingOrder.status,
        deadline: editingOrder.deadline
          ? new Date(editingOrder.deadline).toISOString()
          : undefined,
        driver: editingOrder.driver ? Number(editingOrder.driver) : null,
        vehicle: editingOrder.vehicle ? Number(editingOrder.vehicle) : null,
        garage: editingOrder.garage ? Number(editingOrder.garage) : null,
      } as any

      await updateDeliveryOrder(editingOrder.id, payload)
      if (editingOrder.vehicle && editingOrder.garage) {
        await updateVehicle(Number(editingOrder.vehicle), {
          garage: Number(editingOrder.garage),
        })
      }
      setEditingOrder(null)
      setError("")
      await loadData()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao salvar ordem."
      setError(message)
    } finally {
      setEditSaving(false)
    }
  }

  const getDriverLabel = useMemo(
    () => (driverId: number | null | undefined) => {
      if (!driverId) return "Sem motorista"
      const driver = drivers.find((d) => d.id === driverId)
      if (!driver) return `Motorista ${driverId}`
      const user = users.find((u) => u.id === driver.user)
      return user?.username || `Motorista ${driverId}`
    },
    [drivers, users]
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Entrega</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre coletas e edite as ordens cadastradas.
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
            <div className="space-y-2">
              <Label htmlFor="driver">Motorista</Label>
              <select
                id="driver"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.driver}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, driver: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {users.find((u) => u.id === d.user)?.username || `Motorista ${d.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veiculo</Label>
              <select
                id="vehicle"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.vehicle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, vehicle: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model} ({v.plate})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="garage">Garagem (opcional)</Label>
              <select
                id="garage"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.garage}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, garage: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {garages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Selecione uma garagem para atualizar o veiculo escolhido.
              </p>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar ordem"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] justify-items-stretch">
        {loading ? (
          <p>Carregando...</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma ordem cadastrada.
          </p>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="flex flex-col h-full shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.client_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      #{order.id} • {order.status}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(order)}
                    aria-label="Editar ordem"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Prazo:{" "}
                    {order.deadline
                      ? new Date(order.deadline).toLocaleString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Origem:{" "}
                    {order.pickup_location?.coordinates
                      ? `${order.pickup_location.coordinates[1]?.toFixed(4)}, ${order.pickup_location.coordinates[0]?.toFixed(4)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Destino:{" "}
                    {order.dropoff_location?.coordinates
                      ? `${order.dropoff_location.coordinates[1]?.toFixed(4)}, ${order.dropoff_location.coordinates[0]?.toFixed(4)}`
                      : "—"}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Motorista: {getDriverLabel(order.driver)}
                </p>
                <p className="text-muted-foreground">
                  Veículo: {order.vehicle_plate || "n/d"}
                </p>
                <div className="mt-auto text-xs text-muted-foreground">
                  Criada em:{" "}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString("pt-BR")
                    : "—"}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Editar ordem #{editingOrder.id}</h2>
                <p className="text-sm text-muted-foreground">
                  Atualize os dados e salve.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setEditingOrder(null)}
                aria-label="Fechar"
              >
                Fechar
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input
                  value={editingOrder.client_name}
                  onChange={(e) =>
                    setEditingOrder((prev) =>
                      prev ? { ...prev, client_name: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editingOrder.status}
                  onChange={(e) =>
                    setEditingOrder((prev) =>
                      prev ? { ...prev, status: e.target.value } : prev
                    )
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="in_transit">Em rota</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="datetime-local"
                  value={editingOrder.deadline}
                  onChange={(e) =>
                    setEditingOrder((prev) =>
                      prev ? { ...prev, deadline: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Motorista</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editingOrder.driver}
                  onChange={(e) =>
                    setEditingOrder((prev) =>
                      prev ? { ...prev, driver: e.target.value } : prev
                    )
                  }
                >
                  <option value="">Selecione</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {users.find((u) => u.id === d.user)?.username || `Motorista ${d.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Veículo</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editingOrder.vehicle}
                  onChange={(e) =>
                    setEditingOrder((prev) =>
                      prev ? { ...prev, vehicle: e.target.value } : prev
                    )
                  }
                >
                  <option value="">Selecione</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Garagem (opcional)</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editingOrder.garage}
                  onChange={(e) =>
                    setEditingOrder((prev) =>
                      prev ? { ...prev, garage: e.target.value } : prev
                    )
                  }
                >
                  <option value="">Selecione</option>
                  {garages.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Origem (lat/lon)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Lat"
                    value={editingOrder.pickup_latitude}
                    onChange={(e) =>
                      setEditingOrder((prev) =>
                        prev ? { ...prev, pickup_latitude: e.target.value } : prev
                      )
                    }
                  />
                  <Input
                    placeholder="Lon"
                    value={editingOrder.pickup_longitude}
                    onChange={(e) =>
                      setEditingOrder((prev) =>
                        prev ? { ...prev, pickup_longitude: e.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Destino (lat/lon)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Lat"
                    value={editingOrder.dropoff_latitude}
                    onChange={(e) =>
                      setEditingOrder((prev) =>
                        prev ? { ...prev, dropoff_latitude: e.target.value } : prev
                      )
                    }
                  />
                  <Input
                    placeholder="Lon"
                    value={editingOrder.dropoff_longitude}
                    onChange={(e) =>
                      setEditingOrder((prev) =>
                        prev ? { ...prev, dropoff_longitude: e.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingOrder(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryOrdersPage
