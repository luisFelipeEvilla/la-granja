"use client";
import ClientForm from "@/components/clients/ClientForm";
import PageHeader from "@/components/ui/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Client } from "@prisma/client";
import { useEffect, useState } from "react";

export default function EditClient({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<Client>();

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
        });
    }, [params.id]);

    if (!client) return <PageSkeleton stats={0} rows={6} />;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <PageHeader
                back={{ href: `/dashboard/clients/${params.id}`, label: client.name }}
                title="Editar cliente"
                description="Actualiza los datos de identificación y contacto."
            />
            <ClientForm client={client} />
        </div>
    )
}
