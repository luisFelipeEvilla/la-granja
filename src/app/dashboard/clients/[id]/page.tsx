"use client";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import { formatCOP, formatDate, getInvoiceBalance, getItemsSummary, getPaymentStatus, idTypeLabels } from "@/app/utils/clientInvoice";
import { ClientSummary, ClientWithInvoices, PaymentStatus } from "@/types/Client";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
    HiOutlineBanknotes,
    HiOutlineCheckCircle,
    HiOutlineDocumentChartBar,
    HiOutlineDocumentText,
    HiOutlineEnvelope,
    HiOutlineMapPin,
    HiOutlinePencilSquare,
    HiOutlinePhone,
    HiOutlinePlus,
    HiOutlineReceiptPercent
} from "react-icons/hi2";
import toast from "react-hot-toast";

type Filter = "all" | "pending" | "paid" | "void";

const filterStatuses: Record<Filter, PaymentStatus[]> = {
    all: ['PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA'],
    pending: ['PENDIENTE', 'PARCIAL'],
    paid: ['PAGADA'],
    void: ['ANULADA']
};

function ContactChip({ icon, children }: { icon: ReactNode, children: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
            <span className="text-slate-400">{icon}</span>
            {children}
        </span>
    );
}

export default function ClientDetail({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<ClientWithInvoices & { summary: ClientSummary }>();
    const [filter, setFilter] = useState<Filter>("all");

    const loadClient = useCallback(async () => {
        const res = await fetch(`/api/clients/${params.id}`);
        if (res.ok) setClient(await res.json());
        else toast.error('Cliente no encontrado');
    }, [params.id]);

    useEffect(() => { loadClient() }, [loadClient]);

    if (!client) return <PageSkeleton />;

    const invoicesWithStatus = client.invoices.map((invoice) => ({ invoice, status: getPaymentStatus(invoice) }));
    const count = (key: Filter) => invoicesWithStatus.filter(({ status }) => filterStatuses[key].includes(status)).length;
    const visibleInvoices = invoicesWithStatus.filter(({ status }) => filterStatuses[filter].includes(status));
    const newInvoiceHref = `/dashboard/clients/${client.id}/invoices/new`;

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/dashboard/clients", label: "Clientes" }}
                title={client.name}
                badge={!client.active && <Badge tone="gray">Inactivo</Badge>}
                description={`${idTypeLabels[client.idType]} ${client.idNum}`}
                actions={<>
                    <ButtonLink href={`/dashboard/clients/${client.id}/edit`} variant="ghost" icon={<HiOutlinePencilSquare className="h-4 w-4" />}>
                        Editar
                    </ButtonLink>
                    <ButtonLink href={`/dashboard/clients/${client.id}/statement`} variant="secondary" icon={<HiOutlineDocumentChartBar className="h-4 w-4" />}>
                        Estado de cuenta
                    </ButtonLink>
                    <ButtonLink href={newInvoiceHref} icon={<HiOutlinePlus className="h-4 w-4" />}>
                        Nueva factura
                    </ButtonLink>
                </>}
            >
                {(client.phone || client.email || client.address) && (
                    <div className="flex flex-wrap gap-2">
                        {client.phone && <ContactChip icon={<HiOutlinePhone className="h-4 w-4" />}>{client.phone}</ContactChip>}
                        {client.email && <ContactChip icon={<HiOutlineEnvelope className="h-4 w-4" />}>{client.email}</ContactChip>}
                        {client.address && <ContactChip icon={<HiOutlineMapPin className="h-4 w-4" />}>{client.address}</ContactChip>}
                    </div>
                )}
            </PageHeader>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <StatCard label="Total facturado" value={formatCOP(client.summary.invoiced)} icon={<HiOutlineReceiptPercent />} tone="blue" />
                <StatCard label="Total pagado" value={formatCOP(client.summary.paid)} icon={<HiOutlineCheckCircle />} tone="emerald" />
                <StatCard
                    className="col-span-2 md:col-span-1"
                    label="Saldo pendiente"
                    value={formatCOP(client.summary.balance)}
                    icon={<HiOutlineBanknotes />}
                    tone={client.summary.balance > 0 ? "red" : "default"}
                />
            </div>

            <Panel flush>
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <h2 className="text-base font-semibold text-slate-900">Facturas</h2>
                    <Segmented
                        label="Filtrar facturas"
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: "all", label: "Todas", count: count("all") },
                            { value: "pending", label: "Pendientes", count: count("pending") },
                            { value: "paid", label: "Pagadas", count: count("paid") },
                            { value: "void", label: "Anuladas", count: count("void") },
                        ]}
                    />
                </div>

                {visibleInvoices.length > 0 ? (
                    <Table>
                        <THead>
                            <TH>Factura</TH>
                            <TH className="hidden md:table-cell">Productos</TH>
                            <TH align="right" className="hidden sm:table-cell">Total</TH>
                            <TH align="right">Saldo</TH>
                            <TH align="right">Estado</TH>
                        </THead>
                        <TBody>
                            {visibleInvoices.map(({ invoice, status }) => (
                                <TR key={invoice.id} href={`/dashboard/clients/${client.id}/invoices/${invoice.id}`}>
                                    <TD>
                                        <p className="font-semibold text-slate-900">#{invoice.number}</p>
                                        <p className="text-xs text-slate-500">{formatDate(invoice.issueDate)}</p>
                                        <p className="mt-0.5 max-w-[14rem] truncate text-xs text-slate-500 md:hidden">{getItemsSummary(invoice.items)}</p>
                                    </TD>
                                    <TD className="hidden max-w-xs md:table-cell">
                                        <p className="truncate text-slate-600">{getItemsSummary(invoice.items)}</p>
                                    </TD>
                                    <TD align="right" className="hidden tabular-nums sm:table-cell">{formatCOP(invoice.amount)}</TD>
                                    <TD align="right" className={`tabular-nums font-semibold ${status === 'ANULADA' || getInvoiceBalance(invoice) === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                                        {status === 'ANULADA' ? '—' : formatCOP(getInvoiceBalance(invoice))}
                                    </TD>
                                    <TD align="right"><InvoiceStatusBadge status={status} /></TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                ) : client.invoices.length === 0 ? (
                    <EmptyState
                        icon={<HiOutlineDocumentText />}
                        title="Este cliente aún no tiene facturas"
                        description="Crea una factura de venta con los productos que le entregaste."
                        action={<ButtonLink href={newInvoiceHref} icon={<HiOutlinePlus className="h-4 w-4" />}>Nueva factura</ButtonLink>}
                    />
                ) : (
                    <EmptyState icon={<HiOutlineDocumentText />} title="Sin facturas en este filtro" description="Prueba con otro estado." />
                )}
            </Panel>
        </div>
    )
}
