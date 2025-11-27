"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/Badge"

export type Delivery = {
  id: string
  status: "pending" | "processing" | "success" | "failed"
  driver: string
  plate: string
  amount: number
}

export const columns: ColumnDef<Delivery>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant =
        status === "success"
          ? "success"
          : status === "failed"
          ? "danger"
          : status === "pending"
          ? "warning"
          : "default"

      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "driver",
    header: "Motorista",
  },
  {
    accessorKey: "plate",
    header: "Placa",
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount)

      return <div className="font-medium">{formatted}</div>
    },
  },
]