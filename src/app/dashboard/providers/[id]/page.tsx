"use client";
import { Provider } from "@prisma/client";
import { useEffect, useState, use } from "react";
import { HiOutlineTruck } from "react-icons/hi2";
import ProviderForm from "@/components/providers/ProviderForm";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function EditProvider(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [provider, setProvider] = useState<Provider | null>();

    useEffect(() => {
        fetch(`/api/providers/${params.id}`).then(async (res) => {
            const data = res.ok ? await res.json() : null;
            // the API answers 200 with a statusCode field when the provider doesn't exist
            setProvider(data?.id ? data : null);
        })
    }, [params.id])

    if (provider === undefined) return <PageSkeleton stats={0} rows={6} />;

    if (provider === null) {
        return (
            <EmptyState
                icon={<HiOutlineTruck />}
                title="Proveedor no encontrado"
                action={<ButtonLink href="/dashboard/providers" variant="secondary">Volver a proveedores</ButtonLink>}
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${provider.firstName} ${provider.lastName}`}
                description={`${provider.idType} ${provider.idNum}`}
                badge={<Badge tone={provider.active ? "emerald" : "gray"}>{provider.active ? "Activo" : "Inactivo"}</Badge>}
                back={{ href: "/dashboard/providers", label: "Proveedores" }}
            />
            <ProviderForm provider={provider} />
        </div>
    )
}
