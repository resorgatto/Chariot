import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
  const vehiclePositions = [
    { id: 1, position: [-23.5505, -46.6333], name: "Veículo 1" },
    { id: 2, position: [-23.5605, -46.6433], name: "Veículo 2" },
    { id: 3, position: [-23.5405, -46.6233], name: "Veículo 3" },
    { id: 4, position: [-23.5555, -46.6383], name: "Veículo 4" },
    { id: 5, position: [-23.5455, -46.6283], name: "Veículo 5" },
  ];

  return (
    <div className="h-[calc(100vh-112px)] w-full">
      <MapContainer center={[-23.5505, -46.6333]} zoom={13} className="h-full w-full">
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
    </div>
  );
};

export default MapPage;
