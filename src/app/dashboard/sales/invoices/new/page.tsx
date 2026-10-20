"use client";
import InvoiceForm from "@/components/clients/InvoiceForm";
import Panel from "@/components/ui/Panel";
import PageHeader from "@/components/ui/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ClientWithSummary } from "@/types/Client";
import { SearchSelect, SearchSelectItem } from "@/components/ui/form";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { ButtonLink } from "@/components/ui/Button";

function NewSalesInvoice() {
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<ClientWithSummary[]>();
    const [clientId, setClientId] = useState(searchParams.get("client") ?? "");

    useEffect(() => {
        fetch("/api/clients").then(async (res) => {
            setClients(res.ok ? await res.json() : []);
        });
    }, []);

    if (!clients) return <PageSkeleton stats={0} rows={3} />;

    const activeClients = clients.filter((client) => client.active || client.id === clientId);
    const client = clients.find((client) => client.id === clientId);

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/dashboard/sales/invoices", label: "Facturas" }}
                title="Nueva factura de venta"
                description="Elige el cliente y agrega los productos vendidos"
            />

            <Panel title="Cliente" description={client ? `${client.idType} ${client.idNum}${client.phone ? ` · ${client.phone}` : ""}` : undefined}>
                {activeClients.length === 0 ? (
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">Aún no tienes clientes activos para facturarles.</p>
                        <ButtonLink href="/dashboard/clients/create">Crear cliente</ButtonLink>
                    </div>
                ) : (
                    <SearchSelect
                        value={clientId}
                        onValueChange={(value) => setClientId(value ?? "")}
                        placeholder="Buscar cliente por nombre o documento"
                        icon={HiOutlineUserCircle}
                    >
                        {activeClients.map((option) => (
                            <SearchSelectItem key={option.id} value={option.id}>
                                {option.name} · {option.idType} {option.idNum}
                            </SearchSelectItem>
                        ))}
                    </SearchSelect>
                )}
            </Panel>

            {client ? (
                // keyed by client so switching clients starts a clean form
                <InvoiceForm
                    key={client.id}
                    clientId={client.id}
                    client={client}
                    hideHeader
                    cancelHref="/dashboard/sales/invoices"
                />
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
                        <HiOutlineUserCircle />
                    </span>
                    <p className="font-semibold text-slate-900">Elige un cliente para empezar</p>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">Después podrás agregar los productos, las cantidades y los precios de la venta.</p>
                </div>
            )}
        </div>
    );
}

export default function NewSalesInvoicePage() {
    return (
        <Suspense fallback={<PageSkeleton stats={0} rows={3} />}>
            <NewSalesInvoice />
        </Suspense>
    );
}
