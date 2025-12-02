import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { checkCoverage, lookupCep } from "@/lib/api"

const CoverageCheckPage = () => {
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [cep, setCep] = useState("")
  const [result, setResult] = useState<{ covered: boolean; areas: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await checkCoverage({
        latitude: Number(lat),
        longitude: Number(lon),
      })
      setResult(data)
      setError("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao checar cobertura."
      setError(message)
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
    setCepLoading(true)
    try {
      const data = await lookupCep(cleanCep)
      setLat(data.latitude ? String(data.latitude) : "")
      setLon(data.longitude ? String(data.longitude) : "")
      setCep(data.cep || cep)
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
          <h1 className="text-3xl font-bold">Cobertura</h1>
          <p className="text-sm text-muted-foreground">
            Verifique se um ponto (lat/lon) está coberto por alguma área de entrega.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

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

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Coberto? {result.covered ? "Sim" : "Não"}
            </p>
            {result.areas && result.areas.length > 0 && (
              <ul className="list-disc pl-4 text-sm text-muted-foreground">
                {result.areas.map((area) => (
                  <li key={area.id}>{area.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CoverageCheckPage
