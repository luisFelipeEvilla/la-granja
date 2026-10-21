"use client";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import { formatCOP, formatDate, getInvoiceBalance, getItemsSummary, getPaymentStatus, idTypeLabels, paymentMethodLabels } from "@/app/utils/clientInvoice";
import { ClientReceiptWithPayments, ClientSummary, ClientWithInvoices, PaymentStatus } from "@/types/Client";
import ReceiptForm from "@/components/clients/ReceiptForm";
import Button, { ButtonLink } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { ReactNode, useCallback, useEffect, useState, use } from "react";
import {
    HiOutlineBanknotes,
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineCheckCircle,
    HiOutlineDocumentChartBar,
    HiOutlineDocumentText,
    HiOutlineEnvelope,
    HiOutlineMapPin,
    HiOutlinePencilSquare,
    HiOutlinePhone,
    HiOutlinePlus,
    HiOutlineReceiptPercent,
    HiOutlineTrash
} from "react-icons/hi2";
import NextLink from "next/link";
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

export default function ClientDetail(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [client, setClient] = useState<ClientWithInvoices & { summary: ClientSummary }>();
    const [filter, setFilter] = useState<Filter>("all");
    const [receiptFormOpen, setReceiptFormOpen] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState<ClientReceiptWithPayments | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadClient = useCallback(async () => {
        const res = await fetch(`/api/clients/${params.id}`);
        if (res.ok) setClient(await res.json());
        else toast.error('Cliente no encontrado');
    }, [params.id]);

    useEffect(() => { loadClient() }, [loadClient]);

    const deleteReceipt = async (receiptId: string) => {
        setDeleting(true);
        const res = await fetch(`/api/client-receipts/${receiptId}`, { method: 'DELETE' });
        setDeleting(false);
        setReceiptToDelete(null);

        if (!res.ok) return toast.error('Error al eliminar el abono');

        toast.success('Abono eliminado');
        loadClient();
    }

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
                    {client.summary.balance > 0 && (
                        <Button variant="secondary" icon={<HiOutlineBanknotes className="h-4 w-4" />} onClick={() => setReceiptFormOpen(true)}>
                            Registrar abono
                        </Button>
                    )}
                    {client.summary.balance > 0 && (
                        <ButtonLink href={`/dashboard/sales/reminders?client=${client.id}`} variant="secondary" icon={<HiOutlineChatBubbleLeftEllipsis className="h-4 w-4" />}>
                            Recordar pago
                        </ButtonLink>
                    )}
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
                            <TH className="hidden xl:table-cell">Productos</TH>
                            <TH align="right" className="hidden lg:table-cell">Total</TH>
                            <TH align="right">Saldo</TH>
                            <TH align="right">Estado</TH>
                        </THead>
                        <TBody>
                            {visibleInvoices.map(({ invoice, status }) => (
                                <TR key={invoice.id} href={`/dashboard/clients/${client.id}/invoices/${invoice.id}`}>
                                    <TD>
                                        <p className="font-semibold text-slate-900">#{invoice.number}</p>
                                        <p className="text-xs text-slate-500">{formatDate(invoice.issueDate)}</p>
                                        <p className="mt-0.5 line-clamp-2 wrap-anywhere text-xs text-slate-500 xl:hidden">{getItemsSummary(invoice.items)}</p>
                                    </TD>
                                    <TD className="hidden xl:table-cell">
                                        <p className="line-clamp-2 wrap-anywhere text-slate-600">{getItemsSummary(invoice.items)}</p>
                                    </TD>
                                    <TD align="right" className="hidden tabular-nums lg:table-cell">{formatCOP(invoice.amount)}</TD>
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

            {client.receipts.length > 0 && (
                <Panel title="Abonos a cuenta" description={`${client.receipts.length} registrado(s)`} flush>
                    <Table>
                        <THead>
                            <TH>Fecha</TH>
                            <TH className="hidden md:table-cell">Método</TH>
                            <TH>Aplicado a</TH>
                            <TH align="right">Monto</TH>
                            <TH align="right"><span className="sr-only">Acciones</span></TH>
                        </THead>
                        <TBody>
                            {client.receipts.map((receipt) => (
                                <TR key={receipt.id}>
                                    <TD className="whitespace-nowrap">
                                        <p className="text-slate-900">{formatDate(receipt.date)}</p>
                                        <p className="text-xs text-slate-500 md:hidden">{paymentMethodLabels[receipt.method]}</p>
                                        {receipt.reference && <p className="text-xs text-slate-500">{receipt.reference}</p>}
                                    </TD>
                                    <TD className="hidden md:table-cell">{paymentMethodLabels[receipt.method]}</TD>
                                    <TD>
                                        <ul className="space-y-0.5 text-sm">
                                            {[...receipt.payments].sort((a, b) => a.invoice.number - b.invoice.number).map((payment) => (
                                                <li key={payment.id} className="whitespace-nowrap">
                                                    <NextLink href={`/dashboard/clients/${client.id}/invoices/${payment.invoiceId}`} className="font-medium text-slate-700 hover:text-emerald-700 hover:underline">
                                                        #{payment.invoice.number}
                                                    </NextLink>
                                                    <span className="tabular-nums text-slate-500"> {formatCOP(payment.amount)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </TD>
                                    <TD align="right" className="whitespace-nowrap tabular-nums font-semibold text-emerald-700">{formatCOP(receipt.amount)}</TD>
                                    <TD align="right">
                                        <button
                                            type="button"
                                            onClick={() => setReceiptToDelete(receipt)}
                                            aria-label="Eliminar abono"
                                            title="Eliminar abono"
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 pointer-coarse:h-11 pointer-coarse:w-11"
                                        >
                                            <HiOutlineTrash className="h-5 w-5" />
                                        </button>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                </Panel>
            )}

            <ReceiptForm client={client} isOpen={receiptFormOpen} onClose={() => setReceiptFormOpen(false)} onSaved={loadClient} />

            <ConfirmDialog
                open={receiptToDelete !== null}
                onClose={() => !deleting && setReceiptToDelete(null)}
                onConfirm={() => receiptToDelete && deleteReceipt(receiptToDelete.id)}
                loading={deleting}
                title="¿Eliminar este abono?"
                description={receiptToDelete
                    ? `Se eliminará el abono de ${formatCOP(receiptToDelete.amount)} y el saldo de cada factura a la que se aplicó volverá a aumentar.`
                    : undefined}
                confirmLabel="Eliminar abono"
            />
        </div>
    )
}
