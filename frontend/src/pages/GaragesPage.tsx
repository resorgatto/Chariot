import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { createGarage, fetchGarages, Garage, lookupCep } from "@/lib/api"

const GaragesPage = () => {
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    address: "",
    postal_code: "",
    street_number: "",
    capacity: "",
    latitude: "",
    longitude: "",
  })
  const [cepLoading, setCepLoading] = useState(false)

  const loadGarages = async () => {
    setLoading(true)
    try {
      const data = await fetchGarages()
      setGarages(data.results || [])
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar garagens."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGarages()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
        street_number: form.street_number.trim(),
        capacity: Number(form.capacity) || 0,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }
      const created = await createGarage(payload)
      setGarages((prev) => [created, ...prev])
      setForm({
        name: "",
        address: "",
        postal_code: "",
        street_number: "",
        capacity: "",
        latitude: "",
        longitude: "",
      })
      setShowModal(false)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar garagem."
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCepLookup = async () => {
    const cep = form.postal_code.replace(/\D/g, "")
    if (!cep) {
      setError("Informe um CEP.")
      return
    }
    setCepLoading(true)
    try {
      const data = await lookupCep(cep)
      const addressLine =
        data.address ||
        `${data.street}${data.neighborhood ? `, ${data.neighborhood}` : ""} ${data.city ? `- ${data.city}` : ""}${data.state ? `/${data.state}` : ""}`

      setForm((prev) => ({
        ...prev,
        address: addressLine,
        postal_code: data.cep || prev.postal_code,
        latitude: data.latitude ? String(data.latitude) : prev.latitude,
        longitude: data.longitude ? String(data.longitude) : prev.longitude,
      }))
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao buscar CEP."
      setError(message)
    } finally {
      setCepLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Garagens</h1>
          <p className="text-sm text-muted-foreground">
            Informe o CEP e clique em “Buscar CEP” para preencher endereço e coordenadas automaticamente.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>Nova Garagem</Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p>Carregando garagens...</p>
      ) : garages.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma garagem cadastrada.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {garages.map((garage) => (
            <Card key={garage.id}>
              <CardHeader>
                <CardTitle>{garage.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  {garage.address}, {garage.street_number}
                </p>
                <p className="text-muted-foreground">CEP: {garage.postal_code}</p>
                <Badge variant="secondary">
                  Capacidade: {garage.capacity} vagas
                </Badge>
                {(garage.latitude !== null && garage.latitude !== undefined) && (
                  <p className="text-muted-foreground text-sm">
                    Lat/Lng: {garage.latitude}, {garage.longitude}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nova Garagem</h2>
              <button
                className="text-sm text-muted-foreground"
                onClick={() => setShowModal(false)}
              >
                Fechar
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereco</Label>
                <Input
                  id="address"
                  placeholder="Rua, bairro, cidade/UF"
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  O endereço é preenchido pelo CEP; ajuste se necessário.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="postal_code"
                      value={form.postal_code}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, postal_code: e.target.value }))
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCepLookup}
                      disabled={cepLoading}
                    >
                      {cepLoading ? "Buscando..." : "Buscar CEP"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street_number">Numero</Label>
                  <Input
                    id="street_number"
                    value={form.street_number}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        street_number: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade (vagas)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, capacity: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, latitude: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, longitude: e.target.value }))
                    }
                  />
                </div>
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

export default GaragesPage
