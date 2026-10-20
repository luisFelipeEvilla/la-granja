"use client";
import InvoiceForm from "@/components/clients/InvoiceForm";
import { Client } from "@prisma/client";
import { useEffect, useState, use } from "react";

export default function NewInvoice(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [client, setClient] = useState<Client>();

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
        });
    }, [params.id]);

    return <InvoiceForm clientId={params.id} client={client} />;
}
