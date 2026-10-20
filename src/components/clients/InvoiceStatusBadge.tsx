import Badge, { BadgeTone } from "@/components/ui/Badge";
import { PaymentStatus } from "@/types/Client";

const statusStyles: Record<PaymentStatus, { label: string, tone: BadgeTone }> = {
    PENDIENTE: { label: 'Pendiente', tone: 'amber' },
    PARCIAL: { label: 'Abonada', tone: 'blue' },
    PAGADA: { label: 'Pagada', tone: 'emerald' },
    ANULADA: { label: 'Anulada', tone: 'gray' }
};

export default function InvoiceStatusBadge({ status }: { status: PaymentStatus }) {
    const { label, tone } = statusStyles[status];
    return <Badge tone={tone}>{label}</Badge>;
}
