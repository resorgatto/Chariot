import { Delivery } from "./components/columns";

export const deliveries: Delivery[] = [
  {
    id: "1",
    status: "success",
    driver: "João Silva",
    plate: "ABC-1234",
    amount: 150.75,
  },
  {
    id: "2",
    status: "pending",
    driver: "Maria Santos",
    plate: "XYZ-5678",
    amount: 200.0,
  },
  {
    id: "3",
    status: "processing",
    driver: "Carlos Oliveira",
    plate: "QWE-9876",
    amount: 75.5,
  },
  {
    id: "4",
    status: "failed",
    driver: "Ana Pereira",
    plate: "RTY-5432",
    amount: 300.25,
  },
  {
    id: "5",
    status: "success",
    driver: "Pedro Costa",
    plate: "UIO-1098",
    amount: 50.0,
  },
];
