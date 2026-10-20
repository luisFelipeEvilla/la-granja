"use client";
import ClientForm from "@/components/clients/ClientForm";
import { Title } from "@tremor/react";

export default function CreateClient() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Crear Nuevo Cliente</Title>
                    <a
                        href="/dashboard/clients"
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-center"
                    >
                        Volver a la lista
                    </a>
                </div>
            </div>

            <ClientForm />
        </div>
    )
}
