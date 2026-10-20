"use client";
import InvoiceForm from "@/components/clients/InvoiceForm";
import { Client } from "@prisma/client";
import { useEffect, useState } from "react";

export default function NewInvoice({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<Client>();

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
        });
    }, [params.id]);

    return <InvoiceForm clientId={params.id} client={client} />;
}
