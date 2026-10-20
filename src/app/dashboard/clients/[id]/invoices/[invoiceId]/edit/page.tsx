"use client";
import InvoiceForm from "@/components/clients/InvoiceForm";
import { InvoiceWithClient } from "@/types/Client";
import { Text } from "@tremor/react";
import { useEffect, useState } from "react";
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

    if (!invoice) return <Text className="text-center text-gray-500">Cargando...</Text>;

    if (invoice.status !== 'ACTIVA') {
        return <Text className="text-center text-gray-500">Las facturas anuladas no se pueden editar</Text>;
    }

    return <InvoiceForm clientId={params.id} client={invoice.client} invoice={invoice} />;
}
