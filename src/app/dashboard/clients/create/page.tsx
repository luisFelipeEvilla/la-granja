"use client";
import ClientForm from "@/components/clients/ClientForm";
import PageHeader from "@/components/ui/PageHeader";

export default function CreateClient() {
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <PageHeader
                back={{ href: "/dashboard/clients", label: "Clientes" }}
                title="Nuevo cliente"
                description="Registra un cliente para facturarle y llevar su cartera."
            />
            <ClientForm />
        </div>
    )
}
