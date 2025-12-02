import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { createDriver, fetchDrivers, fetchUsers, Driver, AppUser } from "@/lib/api"

const DriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    user: "",
    license_number: "",
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [driversData, usersData] = await Promise.all([
        fetchDrivers(),
        fetchUsers(),
      ])
      setDrivers(driversData.results || [])
      setUsers(usersData.results || [])
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar motoristas."
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
        user: Number(form.user),
        license_number: form.license_number.trim(),
      }
      const created = await createDriver(payload)
      setDrivers((prev) => [created, ...prev])
      setForm({ user: "", license_number: "" })
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar motorista."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Motoristas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um usuário como motorista informando a CNH.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Novo motorista</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user">Usuário</Label>
              <select
                id="user"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.user}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, user: e.target.value }))
                }
                required
              >
                <option value="">Selecione</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_number">CNH</Label>
              <Input
                id="license_number"
                value={form.license_number}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, license_number: e.target.value }))
                }
                required
                placeholder="CNH123456"
              />
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar motorista"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motoristas cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p>Carregando...</p>
          ) : drivers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum motorista cadastrado.
            </p>
          ) : (
            drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex items-center justify-between border-b pb-2 last:border-b-0"
              >
                <div>
                  <p className="font-medium">
                    {users.find((u) => u.id === driver.user)?.username ||
                      driver.user}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CNH: {driver.license_number}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {driver.current_status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DriversPage
