import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  createVehicle,
  fetchGarages,
  fetchVehicles,
  updateVehicle,
  lookupCep,
  Garage,
  Vehicle,
} from "@/lib/api"

const vehicleTypes = [
  { value: "truck", label: "Caminhao" },
  { value: "van", label: "Van" },
  { value: "car", label: "Carro" },
  { value: "motorcycle", label: "Moto" },
]

const FleetPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    plate: "",
    model: "",
    capacity_kg: "",
    type: "truck",
    garage: "",
  })
  const [statusForm, setStatusForm] = useState<
    Record<number, { status: string; lat: string; lon: string; cep?: string }>
  >({})
  const [statusCepLoading, setStatusCepLoading] =
    useState<Record<number, boolean>>({})
  const [garageForm, setGarageForm] = useState<Record<number, string>>({})
  const [garageSaving, setGarageSaving] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [vehiclesData, garagesData] = await Promise.all([
        fetchVehicles(),
        fetchGarages(),
      ])
      const fetchedVehicles = vehiclesData.results || []
      setVehicles(fetchedVehicles)
      setGarages(garagesData.results || [])
      setGarageForm(
        fetchedVehicles.reduce<Record<number, string>>((acc, v) => {
          acc[v.id] = v.garage ? String(v.garage) : ""
          return acc
        }, {})
      )
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados."
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
        plate: form.plate.trim(),
        model: form.model.trim(),
        capacity_kg: Number(form.capacity_kg) || 0,
        type: form.type,
        garage: form.garage ? Number(form.garage) : undefined,
        image_file: imageFile,
      }
      const created = await createVehicle(payload)
      setVehicles((prev) => [created, ...prev])
      setForm({
        plate: "",
        model: "",
        capacity_kg: "",
        type: "truck",
        garage: "",
      })
      setImageFile(null)
      setShowModal(false)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar veiculo."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (vehicle: Vehicle) => {
    const current = statusForm[vehicle.id] || {
      status: vehicle.status || "available",
      lat: vehicle.last_latitude ? String(vehicle.last_latitude) : "",
      lon: vehicle.last_longitude ? String(vehicle.last_longitude) : "",
      cep: "",
    }
    try {
      const payload: any = {
        status: current.status,
      }
      if (current.lat && current.lon) {
        payload.set_latitude = Number(current.lat)
        payload.set_longitude = Number(current.lon)
      }
      const updated = await updateVehicle(vehicle.id, payload)
      setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? updated : v)))
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar veiculo."
      setError(message)
    }
  }

  const handleStatusCepLookup = async (vehicle: Vehicle) => {
    const current = statusForm[vehicle.id] || {
      status: vehicle.status || "available",
      lat: vehicle.last_latitude ? String(vehicle.last_latitude) : "",
      lon: vehicle.last_longitude ? String(vehicle.last_longitude) : "",
      cep: "",
    }
    const cep = current.cep?.replace(/\D/g, "") || ""
    if (!cep) {
      setError("Informe um CEP para preencher a posicao.")
      return
    }
    setStatusCepLoading((prev) => ({ ...prev, [vehicle.id]: true }))
    try {
      const data = await lookupCep(cep)
      setStatusForm((prev) => ({
        ...prev,
        [vehicle.id]: {
          status: current.status,
          lat: data.latitude ? String(data.latitude) : current.lat,
          lon: data.longitude ? String(data.longitude) : current.lon,
          cep: data.cep || current.cep,
        },
      }))
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao buscar CEP."
      setError(message)
    } finally {
      setStatusCepLoading((prev) => ({ ...prev, [vehicle.id]: false }))
    }
  }

  const handleUpdateGarage = async (vehicle: Vehicle) => {
    const value = garageForm[vehicle.id] || ""
    const garageId = value ? Number(value) : null
    setGarageSaving(vehicle.id)
    try {
      const updated = await updateVehicle(vehicle.id, {
        garage: garageId || undefined,
      })
      setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? updated : v)))
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar garagem."
      setError(message)
    } finally {
      setGarageSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestao de Frota</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um veiculo e associe a uma garagem.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>Novo Veiculo</Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p>Carregando dados...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.length === 0 && (
            <p className="text-muted-foreground">Nenhum veiculo cadastrado.</p>
          )}
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              {vehicle.image && (
                <img
                  src={vehicle.image}
                  alt={vehicle.model}
                  className="rounded-t-lg h-48 w-full object-cover"
                />
              )}
              <CardHeader>
                <CardTitle>{vehicle.model}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">Placa: {vehicle.plate}</p>
                <p className="text-muted-foreground">
                  Capacidade: {vehicle.capacity_kg} kg
                </p>
                <Badge variant="secondary" className="capitalize">
                  {vehicle.type}
                </Badge>
                {vehicle.garage && (
                  <p className="text-sm text-muted-foreground">
                    Garagem:{" "}
                    {garages.find((g) => g.id === vehicle.garage)?.name ||
                      vehicle.garage}
                  </p>
                )}
                <div className="space-y-2">
                  <Label className="text-xs">Trocar garagem</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={garageForm[vehicle.id] ?? ""}
                    onChange={(e) =>
                      setGarageForm((prev) => ({
                        ...prev,
                        [vehicle.id]: e.target.value,
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateGarage(vehicle)}
                    disabled={garageSaving === vehicle.id}
                  >
                    {garageSaving === vehicle.id ? "Salvando..." : "Atualizar garagem"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Status e posicao</p>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={
                      statusForm[vehicle.id]?.status || vehicle.status || "available"
                    }
                    onChange={(e) =>
                      setStatusForm((prev) => ({
                        ...prev,
                        [vehicle.id]: {
                          status: e.target.value,
                          lat:
                            prev[vehicle.id]?.lat ??
                            (vehicle.last_latitude ? String(vehicle.last_latitude) : ""),
                          lon:
                            prev[vehicle.id]?.lon ??
                            (vehicle.last_longitude
                              ? String(vehicle.last_longitude)
                              : ""),
                        },
                      }))
                    }
                  >
                    <option value="available">Disponivel</option>
                    <option value="in_transit">Em transito</option>
                    <option value="maintenance">Manutencao</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Lat"
                      value={
                        statusForm[vehicle.id]?.lat ??
                        (vehicle.last_latitude ? String(vehicle.last_latitude) : "")
                      }
                      onChange={(e) =>
                        setStatusForm((prev) => ({
                          ...prev,
                          [vehicle.id]: {
                            status:
                              prev[vehicle.id]?.status ||
                              vehicle.status ||
                              "available",
                            lat: e.target.value,
                            lon:
                              prev[vehicle.id]?.lon ??
                              (vehicle.last_longitude
                                ? String(vehicle.last_longitude)
                                : ""),
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="Lon"
                      value={
                        statusForm[vehicle.id]?.lon ??
                        (vehicle.last_longitude ? String(vehicle.last_longitude) : "")
                      }
                      onChange={(e) =>
                        setStatusForm((prev) => ({
                          ...prev,
                          [vehicle.id]: {
                            status:
                              prev[vehicle.id]?.status ||
                              vehicle.status ||
                              "available",
                            lat:
                              prev[vehicle.id]?.lat ??
                              (vehicle.last_latitude
                                ? String(vehicle.last_latitude)
                                : ""),
                            lon: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="CEP"
                      value={statusForm[vehicle.id]?.cep ?? ""}
                      onChange={(e) =>
                        setStatusForm((prev) => ({
                          ...prev,
                          [vehicle.id]: {
                            status:
                              prev[vehicle.id]?.status ||
                              vehicle.status ||
                              "available",
                            lat:
                              prev[vehicle.id]?.lat ??
                              (vehicle.last_latitude
                                ? String(vehicle.last_latitude)
                                : ""),
                            lon:
                              prev[vehicle.id]?.lon ??
                              (vehicle.last_longitude
                                ? String(vehicle.last_longitude)
                                : ""),
                            cep: e.target.value,
                          },
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={statusCepLoading[vehicle.id]}
                      onClick={() => handleStatusCepLookup(vehicle)}
                    >
                      {statusCepLoading[vehicle.id] ? "CEP..." : "Buscar CEP"}
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus(vehicle)}
                  >
                    Atualizar status/posicao
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Novo Veiculo</h2>
              <button
                className="text-sm text-muted-foreground"
                onClick={() => setShowModal(false)}
              >
                Fechar
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Dica: use placa no formato ABC-1234, selecione a garagem e envie uma
              foto (opcional).
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  value={form.plate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, plate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ex: Volvo FH 540"
                  value={form.model}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, model: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade (kg)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Ex: 5000"
                  value={form.capacity_kg}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      capacity_kg: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  {vehicleTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="garage">Garagem</Label>
                <select
                  id="garage"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.garage}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, garage: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {garages.map((garage) => (
                    <option key={garage.id} value={garage.id}>
                      {garage.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  As garagens podem ser criadas na aba Garagens.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Imagem do veiculo</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImageFile(e.target.files ? e.target.files[0] : null)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Formatos comuns (jpg, png). Tamanho recomendado {"<"} 2MB.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FleetPage
