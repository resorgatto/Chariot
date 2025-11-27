import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import { columns } from "@/features/fleet/components/columns";
import { deliveries } from "@/features/fleet/data";
import { DataTable } from "@/features/fleet/components/data-table";

const Dashboard = () => {
    const kpis = [
        { title: "Veículos em Rota", value: "12" },
        { title: "Entregas Pendentes", value: "8" },
        { title: "Faturamento do Dia", value: "R$ 12.500,00" },
    ]

    const vehiclePositions = [
        { id: 1, position: [-23.5505, -46.6333], name: "Veículo 1" },
        { id: 2, position: [-23.5605, -46.6433], name: "Veículo 2" },
        { id: 3, position: [-23.5405, -46.6233], name: "Veículo 3" },
    ]

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                {kpis.map((kpi) => (
                    <Card key={kpi.title}>
                        <CardHeader>
                            <CardTitle>{kpi.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Mapa de Veículos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MapContainer center={[-23.5505, -46.6333]} zoom={13} style={{ height: '400px', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {vehiclePositions.map((vehicle) => (
                                <Marker key={vehicle.id} position={vehicle.position}>
                                    <Popup>{vehicle.name}</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Últimas Entregas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={deliveries} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard
