"use client";
import ClientForm from "@/components/clients/ClientForm";
import { Client } from "@prisma/client";
import { Text, Title } from "@tremor/react";
import { useEffect, useState } from "react";

export default function EditClient({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<Client>();

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
        });
    }, [params.id]);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Editar Cliente</Title>
                    <a
                        href={`/dashboard/clients/${params.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-center"
                    >
                        Volver al cliente
                    </a>
                </div>
            </div>

            {client ? <ClientForm client={client} /> : <Text className="text-center text-gray-500">Cargando...</Text>}
        </div>
    )
}
