import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  checkCoverage,
  createCoverageArea,
  fetchCoverageAreas,
  lookupCep,
  type CoverageArea,
} from "@/lib/api"
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"

const MapClickHandler = ({ onSelect }: { onSelect: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const CoverageCheckPage = () => {
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [cep, setCep] = useState("")
  const [result, setResult] = useState<{ covered: boolean; areas: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [areas, setAreas] = useState<CoverageArea[]>([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [savingArea, setSavingArea] = useState(false)
  const [areaName, setAreaName] = useState("")
  const [areaLat, setAreaLat] = useState("")
  const [areaLon, setAreaLon] = useState("")
  const [radiusKm, setRadiusKm] = useState("")
  const [resultModalOpen, setResultModalOpen] = useState(false)

  const normalizeError = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback

  const parsedAreaLat = Number(areaLat)
  const parsedAreaLon = Number(areaLon)
  const parsedRadiusKm = Number(radiusKm)
  const hasSelectedCenter =
    areaLat.trim() !== "" &&
    areaLon.trim() !== "" &&
    !Number.isNaN(parsedAreaLat) &&
    !Number.isNaN(parsedAreaLon)

  const fallbackCenter = (() => {
    const firstAreaWithCenter = areas.find(
      (area) =>
        typeof area.centroid_latitude === "number" &&
        typeof area.centroid_longitude === "number"
    )
    if (firstAreaWithCenter) {
      return [
        firstAreaWithCenter.centroid_latitude as number,
        firstAreaWithCenter.centroid_longitude as number,
      ] as [number, number]
    }
    return [-23.5505, -46.6333] as [number, number]
  })()

  const mapCenter =
    hasSelectedCenter ? [parsedAreaLat, parsedAreaLon] : fallbackCenter

  const loadAreas = async () => {
    setAreasLoading(true)
    try {
      const data = await fetchCoverageAreas()
      setAreas(data.results || [])
      setError("")
    } catch (err) {
      setError(normalizeError(err, "Erro ao carregar areas de cobertura."))
    } finally {
      setAreasLoading(false)
    }
  }

  useEffect(() => {
    loadAreas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage("")
    try {
      const data = await checkCoverage({
        latitude: Number(lat),
        longitude: Number(lon),
      })
      setResult(data)
      setResultModalOpen(true)
      setError("")
    } catch (err) {
      setError(normalizeError(err, "Erro ao checar cobertura."))
    } finally {
      setLoading(false)
    }
  }

  const handleCepLookup = async () => {
    const cleanCep = cep.replace(/\D/g, "")
    if (!cleanCep) {
      setError("Informe um CEP.")
      return
    }
    setSuccessMessage("")
    setCepLoading(true)
    try {
      const data = await lookupCep(cleanCep)
      setLat(data.latitude ? String(data.latitude) : "")
      setLon(data.longitude ? String(data.longitude) : "")
      setCep(data.cep || cep)
      setError("")
    } catch (err) {
      setError(normalizeError(err, "Falha ao buscar CEP."))
    } finally {
      setCepLoading(false)
    }
  }

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("")
    if (!areaName.trim() || !areaLat || !areaLon || !radiusKm) {
      setError("Preencha nome, raio e coordenadas da area.")
      return
    }
    const parsedRadius = Number(radiusKm)
    if (Number.isNaN(parsedRadius) || parsedRadius <= 0) {
      setError("Use um raio maior que zero.")
      return
    }
    setSavingArea(true)
    try {
      await createCoverageArea({
        name: areaName.trim(),
        center_latitude: Number(areaLat),
        center_longitude: Number(areaLon),
        radius_km: parsedRadius,
      })
      setAreaName("")
      setAreaLat("")
      setAreaLon("")
      setRadiusKm("")
      setError("")
      setSuccessMessage("Area de cobertura criada com sucesso.")
      await loadAreas()
    } catch (err) {
      setError(normalizeError(err, "Falha ao criar area de cobertura."))
    } finally {
      setSavingArea(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cobertura</h1>
          <p className="text-sm text-muted-foreground">
            Verifique se um ponto (lat/lon) esta coberto por alguma area de entrega.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {successMessage && <p className="text-emerald-600 text-sm">{successMessage}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checar cobertura</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="01000-000"
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
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lon">Longitude</Label>
                <Input
                  id="lon"
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Checando..." : "Checar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar raio de cobertura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                Clique no mapa para definir o centro do raio. Ajuste o valor do raio para visualizar.
              </p>
              <div className="h-72 rounded-md overflow-hidden border">
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler
                    onSelect={(latClick, lonClick) => {
                      const formattedLat = latClick.toFixed(6)
                      const formattedLon = lonClick.toFixed(6)
                      setAreaLat(formattedLat)
                      setAreaLon(formattedLon)
                      setLat(formattedLat)
                      setLon(formattedLon)
                    }}
                  />
                  {areas.map((area) => {
                    if (
                      typeof area.centroid_latitude !== "number" ||
                      typeof area.centroid_longitude !== "number"
                    ) {
                      return null
                    }
                    const radiusMeters =
                      typeof area.estimated_radius_km === "number"
                        ? area.estimated_radius_km * 1000
                        : 0
                    return (
                      <Circle
                        key={area.id}
                        center={[area.centroid_latitude, area.centroid_longitude]}
                        radius={radiusMeters}
                        pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08 }}
                      />
                    )
                  })}
                  {hasSelectedCenter && (
                    <>
                      <Marker position={[parsedAreaLat, parsedAreaLon]} />
                      <Circle
                        center={[parsedAreaLat, parsedAreaLon]}
                        radius={
                          !Number.isNaN(parsedRadiusKm) && parsedRadiusKm > 0 ? parsedRadiusKm * 1000 : 500
                        }
                        pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.1 }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
            <form onSubmit={handleCreateArea} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="areaName">Nome da area</Label>
                <Input
                  id="areaName"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="Centro, raio de 5 km"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaLat">Latitude</Label>
                <Input
                  id="areaLat"
                  type="number"
                  step="any"
                  value={areaLat}
                  onChange={(e) => setAreaLat(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaLon">Longitude</Label>
                <Input
                  id="areaLon"
                  type="number"
                  step="any"
                  value={areaLon}
                  onChange={(e) => setAreaLon(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radiusKm">Raio (km)</Label>
                <Input
                  id="radiusKm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end justify-end md:col-span-2">
                <Button type="submit" disabled={savingArea}>
                  {savingArea ? "Salvando..." : "Criar area"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Areas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {areasLoading ? (
            <p className="text-sm text-muted-foreground">Carregando areas...</p>
          ) : areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma area cadastrada. Adicione um raio para habilitar as checagens.
            </p>
          ) : (
            <ul className="space-y-3">
              {areas.map((area) => (
                <li key={area.id} className="border rounded-md p-3">
                  <div className="font-semibold text-slate-800">{area.name}</div>
                  <p className="text-xs text-muted-foreground">
                    Centro:{" "}
                    {area.centroid_latitude !== undefined && area.centroid_latitude !== null
                      ? area.centroid_latitude.toFixed(5)
                      : "-"}
                    ,{" "}
                    {area.centroid_longitude !== undefined && area.centroid_longitude !== null
                      ? area.centroid_longitude.toFixed(5)
                      : "-"}
                  </p>
                  {area.estimated_radius_km !== undefined &&
                    area.estimated_radius_km !== null && (
                      <p className="text-xs text-muted-foreground">
                        Raio aproximado: {area.estimated_radius_km} km
                      </p>
                    )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {resultModalOpen && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-start justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Resultado</h3>
                <p className="text-sm text-muted-foreground">Cobertura para o ponto informado.</p>
              </div>
              <button
                onClick={() => setResultModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 text-xl leading-none"
                aria-label="Fechar"
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm">
                Coberto?{" "}
                <span className="font-semibold">{result.covered ? "Sim" : "Nao"}</span>
              </p>
              {result.areas && result.areas.length > 0 ? (
                <ul className="list-disc pl-4 text-sm text-muted-foreground">
                  {result.areas.map((area) => (
                    <li key={area.id}>{area.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma area cadastrada cobre esse ponto.</p>
              )}
              <div className="flex justify-end pt-2">
                <Button onClick={() => setResultModalOpen(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoverageCheckPage
