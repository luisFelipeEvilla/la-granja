"use client";
import ProviderForm from "@/components/providers/ProviderForm";
import PageHeader from "@/components/ui/PageHeader";

export default function CreateProvider() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Nuevo proveedor"
                description="Registra un productor para incluirlo en la planilla diaria"
                back={{ href: "/dashboard/providers", label: "Proveedores" }}
            />
            <ProviderForm />
        </div>
    )
}
