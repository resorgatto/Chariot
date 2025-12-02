import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  createUser,
  fetchUsers,
  AppUser,
  fetchDeliveryOrders,
  fetchVehicles,
  fetchGarages,
  fetchDrivers,
  updateDeliveryOrder,
  updateVehicle,
  DeliveryOrder,
  Vehicle,
  Garage,
  Driver,
} from "@/lib/api"

const UsersPage = () => {
  const [users, setUsers] = useState<AppUser[]>([])
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [garages, setGarages] = useState<Garage[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [assignForm, setAssignForm] = useState({
    order: "",
    vehicle: "",
    garage: "",
  })
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "",
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, ordersData, vehiclesData, garagesData, driversData] =
        await Promise.all([
          fetchUsers(),
          fetchDeliveryOrders(),
          fetchVehicles(),
          fetchGarages(),
          fetchDrivers(),
        ])
      setUsers(usersData.results || [])
      setOrders(ordersData.results || [])
      setVehicles(vehiclesData.results || [])
      setGarages(garagesData.results || [])
      setDrivers(driversData.results || [])
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar usuários."
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
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim() || undefined,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        role: form.role || undefined,
      }
      const created = await createUser(payload)
      setUsers((prev) => [created, ...prev])
      setForm({
        username: "",
        password: "",
        email: "",
        first_name: "",
        last_name: "",
        role: "",
      })
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar usuário."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUser) return
    const orderId = assignForm.order ? Number(assignForm.order) : null
    const vehicleId = assignForm.vehicle ? Number(assignForm.vehicle) : null
    const garageId = assignForm.garage ? Number(assignForm.garage) : null

    if (!orderId || !vehicleId) {
      setError("Selecione ordem e veículo para atribuir.")
      return
    }

    const driverEntry = drivers.find((d) => d.user === selectedUser.id)
    if (!driverEntry) {
      setError("Crie um motorista para este usuário antes de atribuir uma ordem.")
      return
    }

    setAssigning(true)
    try {
      if (garageId) {
        await updateVehicle(vehicleId, { garage: garageId })
      }
      await updateDeliveryOrder(orderId, {
        vehicle: vehicleId,
        driver: driverEntry.id,
      })

      setError("")
      setAssignForm({ order: "", vehicle: "", garage: "" })
      setSelectedUser(null)
      loadData()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao atribuir ordem."
      setError(message)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Somente administradores podem cadastrar. Crie logins para novos membros.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                required
                placeholder="novousuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                placeholder="mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@dominio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <select
                id="role"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                <option value="">Usuário padrão</option>
                <option value="driver">Motorista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {selectedUser ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Atribuir ordem/veículo/garagem para {selectedUser.username}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="assign_order">Ordem</Label>
                <select
                  id="assign_order"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={assignForm.order}
                  onChange={(e) =>
                    setAssignForm((prev) => ({ ...prev, order: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.client_name} ({o.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign_vehicle">Veículo</Label>
                <select
                  id="assign_vehicle"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={assignForm.vehicle}
                  onChange={(e) =>
                    setAssignForm((prev) => ({ ...prev, vehicle: e.target.value }))
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
                <Label htmlFor="assign_garage">Garagem (opcional)</Label>
                <select
                  id="assign_garage"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={assignForm.garage}
                  onChange={(e) =>
                    setAssignForm((prev) => ({ ...prev, garage: e.target.value }))
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
                onClick={handleAssign}
                disabled={assigning || !selectedUser}
              >
                {assigning ? "Atribuindo..." : "Atribuir ao usuário"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Selecione um usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clique em um usuário na lista para atribuir ordem, veículo e garagem.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de usuários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p>Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum usuário encontrado.
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between border-b pb-2 last:border-b-0 ${selectedUser?.id === user.id ? "bg-slate-50" : ""}`}
                onClick={() => setSelectedUser(user)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email || "Sem e-mail"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UsersPage
