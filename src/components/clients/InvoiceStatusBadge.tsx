import { PaymentStatus } from "@/types/Client";
import { Badge } from "@tremor/react";

const statusStyles: Record<PaymentStatus, { label: string, color: "yellow" | "blue" | "green" | "gray" }> = {
    PENDIENTE: { label: 'Pendiente', color: 'yellow' },
    PARCIAL: { label: 'Abonada', color: 'blue' },
    PAGADA: { label: 'Pagada', color: 'green' },
    ANULADA: { label: 'Anulada', color: 'gray' }
};

export default function InvoiceStatusBadge({ status }: { status: PaymentStatus }) {
    const { label, color } = statusStyles[status];
    return <Badge color={color}>{label}</Badge>;
}
