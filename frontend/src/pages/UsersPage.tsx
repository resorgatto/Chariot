import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  createUser,
  fetchUsers,
  updateUser,
  deleteUser,
  AppUser,
} from "@/lib/api"

const UsersPage = () => {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [editForm, setEditForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "",
    password: "",
    is_active: true,
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
      const usersData = await fetchUsers()
      setUsers(usersData.results || [])
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar usuarios."
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
        err instanceof Error ? err.message : "Erro ao criar usuario."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (user: AppUser) => {
    setEditingUser(user)
    setEditForm({
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: "",
      password: "",
      is_active: user.is_active,
    })
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    setUpdating(true)
    try {
      const payload: any = {
        email: editForm.email.trim() || undefined,
        first_name: editForm.first_name.trim() || undefined,
        last_name: editForm.last_name.trim() || undefined,
        is_active: editForm.is_active,
      }
      if (editForm.role) payload.role = editForm.role
      if (editForm.password) payload.password = editForm.password

      const updated = await updateUser(editingUser.id, payload)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditingUser(null)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar usuario."
      setError(message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (userId: number) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este usuario?")
    if (!confirmed) return
    setDeletingId(userId)
    try {
      await deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir usuario."
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Somente administradores podem cadastrar logins e perfis.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Novo usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
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
                placeholder="minimo 6 caracteres"
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
                <option value="">Usuario padrao</option>
                <option value="driver">Motorista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar usuario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de usuarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p>Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum usuario encontrado.
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border-b pb-2 last:border-b-0 gap-3"
              >
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email || "Sem e-mail"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {user.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(user)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                  >
                    {deletingId === user.id ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Usuario #{editingUser.id}
                </p>
                <h2 className="text-lg font-semibold">{editingUser.username}</h2>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@dominio.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Cargo</Label>
                <select
                  id="edit-role"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="">Manter atual</option>
                  <option value="driver">Motorista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-first">Nome</Label>
                <Input
                  id="edit-first"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last">Sobrenome</Label>
                <Input
                  id="edit-last"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-password">Senha (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Deixe em branco para manter"
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-active" className="text-sm">
                  Usuario ativo
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
