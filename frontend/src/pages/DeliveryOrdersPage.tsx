import { useEffect, useState } from "react"
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

const DeliveryOrdersPage = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [garages, setGarages] = useState<Garage[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState<number | null>(null)
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
  const [assignForm, setAssignForm] = useState<OrderAssignForm>({})
  const [cepLoading, setCepLoading] = useState({ pickup: false, dropoff: false })

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
      const orderResults = ordersData.results || []
      setOrders(orderResults)
      setDrivers(driversData.results || [])
      setVehicles(vehiclesData.results || [])
      setGarages(garagesData.results || [])
      setUsers(usersData.results || [])
      setAssignForm(
        orderResults.reduce<OrderAssignForm>((acc, order) => {
          acc[order.id] = {
            driver: order.driver ? String(order.driver) : "",
            vehicle: order.vehicle ? String(order.vehicle) : "",
            garage: "",
          }
          return acc
        }, {})
      )
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

  const handleAssign = async (orderId: number) => {
    const formValues = assignForm[orderId] || {
      driver: "",
      vehicle: "",
      garage: "",
    }
    const driverId = formValues.driver ? Number(formValues.driver) : null
    const vehicleId = formValues.vehicle ? Number(formValues.vehicle) : null
    const garageId = formValues.garage ? Number(formValues.garage) : null

    setAssigning(orderId)
    try {
      await updateDeliveryOrder(orderId, {
        driver: driverId,
        vehicle: vehicleId,
      })
      if (vehicleId && garageId) {
        await updateVehicle(vehicleId, { garage: garageId })
      }
      setError("")
      await loadData()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao atualizar ordem."
      setError(message)
    } finally {
      setAssigning(null)
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

  const getDriverLabel = (driverId: number | null | undefined) => {
    if (!driverId) return "Sem motorista"
    const driver = drivers.find((d) => d.id === driverId)
    if (!driver) return `Motorista ${driverId}`
    const user = users.find((u) => u.id === driver.user)
    return user?.username || `Motorista ${driverId}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Entrega</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre coletas, escolha motorista/veiculo/garagem e edite atribuicoes na lista.
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
                className="space-y-3 rounded-lg border bg-white/70 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {order.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Prazo: {order.deadline}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    #{order.id}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Motorista</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={assignForm[order.id]?.driver || ""}
                      onChange={(e) =>
                        setAssignForm((prev) => ({
                          ...prev,
                          [order.id]: {
                            ...(prev[order.id] || {
                              driver: "",
                              vehicle: "",
                              garage: "",
                            }),
                            driver: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {users.find((u) => u.id === d.user)?.username ||
                            `Motorista ${d.id}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Atual: {order.driver_name || getDriverLabel(order.driver)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Veiculo</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={assignForm[order.id]?.vehicle || ""}
                      onChange={(e) =>
                        setAssignForm((prev) => ({
                          ...prev,
                          [order.id]: {
                            ...(prev[order.id] || {
                              driver: "",
                              vehicle: "",
                              garage: "",
                            }),
                            vehicle: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.model} ({v.plate})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Atual: {order.vehicle_plate || "n/d"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Garagem (opcional)</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={assignForm[order.id]?.garage || ""}
                      onChange={(e) =>
                        setAssignForm((prev) => ({
                          ...prev,
                          [order.id]: {
                            ...(prev[order.id] || {
                              driver: "",
                              vehicle: "",
                              garage: "",
                            }),
                            garage: e.target.value,
                          },
                        }))
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
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleAssign(order.id)}
                    disabled={assigning === order.id}
                  >
                    {assigning === order.id ? "Salvando..." : "Salvar atribuicao"}
                  </Button>
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
