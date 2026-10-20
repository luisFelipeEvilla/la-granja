"use client";
import InvoiceForm from "@/components/clients/InvoiceForm";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { InvoiceWithClient } from "@/types/Client";
import { useEffect, useState } from "react";
import { HiOutlineCheckBadge, HiOutlineNoSymbol } from "react-icons/hi2";
import toast from "react-hot-toast";

type Params = { params: { id: string, invoiceId: string } };

export default function EditInvoice({ params }: Params) {
    const [invoice, setInvoice] = useState<InvoiceWithClient>();

    useEffect(() => {
        fetch(`/api/client-invoices/${params.invoiceId}`).then(async (res) => {
            if (res.ok) setInvoice(await res.json());
            else toast.error('Factura no encontrada');
        });
    }, [params.invoiceId]);

    if (!invoice) return <PageSkeleton stats={0} rows={4} />;

    if (invoice.status !== 'ACTIVA') {
        return (
            <Panel>
                <EmptyState
                    icon={<HiOutlineNoSymbol />}
                    title="Las facturas anuladas no se pueden editar"
                    action={<ButtonLink href={`/dashboard/clients/${params.id}/invoices/${invoice.id}`} variant="secondary">Volver a la factura</ButtonLink>}
                />
            </Panel>
        );
    }

    if (invoice.signedAt) {
        return (
            <Panel>
                <EmptyState
                    icon={<HiOutlineCheckBadge />}
                    title="Esta factura ya fue firmada"
                    description="El cliente firmó la factura, así que sus productos y montos no se pueden cambiar. Si hay un error, anúlala y crea una nueva."
                    action={<ButtonLink href={`/dashboard/clients/${params.id}/invoices/${invoice.id}`} variant="secondary">Volver a la factura</ButtonLink>}
                />
            </Panel>
        );
    }

    return <InvoiceForm clientId={params.id} client={invoice.client} invoice={invoice} />;
}
