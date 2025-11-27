import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const FleetPage = () => {
  const vehicles = [
    {
      id: 1,
      plate: "ABC-1234",
      model: "Volvo FH 540",
      status: "Disponível",
      imageUrl: "https://images.unsplash.com/photo-1599493356242-2cef42b7a998?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 2,
      plate: "XYZ-5678",
      model: "Scania R 450",
      status: "Em Manutenção",
      imageUrl: "https://images.unsplash.com/photo-1599493356242-2cef42b7a998?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 3,
      plate: "QWE-9876",
      model: "Mercedes-Benz Actros",
      status: "Disponível",
      imageUrl: "https://images.unsplash.com/photo-1599493356242-2cef42b7a998?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Frota</h1>
        <Button>Novo Veículo</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <img src={vehicle.imageUrl} alt={vehicle.model} className="rounded-t-lg h-48 w-full object-cover" />
            <CardHeader>
              <CardTitle>{vehicle.model}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">Placa: {vehicle.plate}</p>
              <Badge variant={vehicle.status === "Disponível" ? "success" : "warning"}>
                {vehicle.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FleetPage;
