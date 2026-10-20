"use client";
import { useState } from "react";
import { BarChart } from "@/components/ui/charts";
import {
    HiOutlineBanknotes,
    HiOutlineDocumentText,
    HiOutlinePlus,
    HiOutlineReceiptPercent,
    HiOutlineScale,
    HiOutlineShoppingCart,
} from "react-icons/hi2";
import { formatCOP, formatDate, formatQuantity, getItemsSummary, getPaymentStatus, toDateString } from "@/app/utils/clientInvoice";
import { getMonthlySeries, getPeriodMetrics, getSalesByClient, getSalesByProduct } from "@/app/utils/sales";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import { useSales } from "@/components/sales/SalesContext";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

type Preset = "month" | "lastMonth" | "90days" | "year" | "all";

const presets: { value: Preset, label: string }[] = [
    { value: "month", label: "Este mes" },
    { value: "lastMonth", label: "Mes anterior" },
    { value: "90days", label: "Últimos 90 días" },
    { value: "year", label: "Este año" },
    { value: "all", label: "Todo" },
];

// local calendar days ("YYYY-MM-DD") for each preset; "all" has no bounds
function getPresetRange(preset: Preset): { from?: string, to?: string } {
    const today = new Date();
    const year = today.getFullYear(), month = today.getMonth();
    switch (preset) {
        case "month": return { from: toDateString(new Date(year, month, 1)), to: toDateString(today) };
        case "lastMonth": return { from: toDateString(new Date(year, month - 1, 1)), to: toDateString(new Date(year, month, 0)) };
        case "90days": return { from: toDateString(new Date(year, month, today.getDate() - 89)), to: toDateString(today) };
        case "year": return { from: toDateString(new Date(year, 0, 1)), to: toDateString(today) };
        default: return {};
    }
}

// short peso amounts for chart axes: "$ 2,5 M", "$ 850 mil"
function formatCOPCompact(amount: number) {
    const abs = Math.abs(amount);
    const format = (value: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value);
    if (abs >= 1_000_000) return `$ ${format(amount / 1_000_000)} M`;
    if (abs >= 1_000) return `$ ${format(amount / 1_000)} mil`;
    return `$ ${format(amount)}`;
}

const formatPercent = (value: number) => `${Math.round(value * 100)} %`;

export default function SalesSummary() {
    const { invoices } = useSales();
    const [preset, setPreset] = useState<Preset>("month");

    if (!invoices) return <PageSkeleton stats={4} />;

    if (invoices.length === 0) {
        return (
            <Panel>
                <EmptyState
                    icon={<HiOutlineDocumentText />}
                    title="Aún no hay facturas"
                    description="Crea tu primera factura de venta para ver aquí tus métricas de ventas y cobros."
                    action={<ButtonLink href="/dashboard/sales/invoices/new" icon={<HiOutlinePlus className="h-4 w-4" />}>Nueva factura</ButtonLink>}
                />
            </Panel>
        );
    }

    const { from, to } = getPresetRange(preset);
    const metrics = getPeriodMetrics(invoices, from, to);
    const series = getMonthlySeries(invoices, 12);
    const products = getSalesByProduct(invoices, from, to);
    const clients = getSalesByClient(invoices, from, to).slice(0, 6);
    const recent = [...invoices].sort((a, b) => b.number - a.number).slice(0, 5);
    const productsTotal = products.reduce((total, product) => total + product.amount, 0);
    const periodLabel = presets.find((option) => option.value === preset)?.label.toLowerCase();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Segmented label="Período" value={preset} onChange={setPreset} options={presets} />
                <p className="text-sm text-slate-500">
                    {from ? `${formatDate(from)} – ${formatDate(to ?? from)}` : "Todo el historial"}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard
                    label="Ventas del período"
                    value={formatCOP(metrics.soldAmount)}
                    icon={<HiOutlineShoppingCart />}
                    tone="emerald"
                    hint={`${metrics.invoiceCount} factura${metrics.invoiceCount === 1 ? "" : "s"} · ${metrics.clientsServed} cliente${metrics.clientsServed === 1 ? "" : "s"}`}
                />
                <StatCard
                    label="Cobrado en el período"
                    value={formatCOP(metrics.collected)}
                    icon={<HiOutlineBanknotes />}
                    tone="blue"
                    hint={metrics.soldAmount ? (
                        <span className="block">
                            <span className="mb-1 block">{formatPercent(metrics.collectionRate)} de lo vendido ya está pagado</span>
                            <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, metrics.collectionRate * 100)}%` }} />
                            </span>
                        </span>
                    ) : "Pagos registrados en el período"}
                />
                <StatCard
                    label="Cartera por cobrar"
                    value={formatCOP(metrics.receivable)}
                    icon={<HiOutlineScale />}
                    tone={metrics.receivable > 0 ? "red" : "default"}
                    hint="Saldo total pendiente hoy"
                />
                <StatCard
                    label="Ticket promedio"
                    value={formatCOP(metrics.averageTicket)}
                    icon={<HiOutlineReceiptPercent />}
                    tone="violet"
                    hint="Valor promedio por factura"
                />
            </div>

            <Panel title="Ventas vs cobros" description="Facturado y cobrado en los últimos 12 meses">
                <BarChart
                    className="h-64 sm:h-72"
                    data={series}
                    index="month"
                    categories={["Ventas", "Cobros"]}
                    colors={["emerald", "blue"]}
                    valueFormatter={formatCOPCompact}
                    yAxisWidth={72}
                />
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
                <Panel title="Ventas por producto" description={`Productos vendidos · ${periodLabel}`} flush>
                    {products.length > 0 ? (
                        <Table>
                            <THead>
                                <TH>Producto</TH>
                                <TH align="right" className="hidden sm:table-cell">Cantidad</TH>
                                <TH align="right">Valor</TH>
                            </THead>
                            <TBody>
                                {products.map((product) => {
                                    const share = productsTotal ? product.amount / productsTotal : 0;
                                    return (
                                        <TR key={product.name}>
                                            <TD className="wrap-anywhere">
                                                <p className="font-medium text-slate-900">{product.name}</p>
                                                <p className="text-xs text-slate-500 sm:hidden">{formatQuantity(product.quantity)} {product.unit}</p>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${share * 100}%` }} />
                                                    </span>
                                                    <span className="w-10 text-right text-xs tabular-nums text-slate-500">{formatPercent(share)}</span>
                                                </div>
                                            </TD>
                                            <TD align="right" className="hidden whitespace-nowrap tabular-nums sm:table-cell">
                                                {formatQuantity(product.quantity)} {product.unit}
                                            </TD>
                                            <TD align="right" className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatCOP(product.amount)}</TD>
                                        </TR>
                                    );
                                })}
                            </TBody>
                        </Table>
                    ) : (
                        <EmptyState title="Sin ventas en el período" description="Elige otro período para ver los productos vendidos." />
                    )}
                </Panel>

                <Panel title="Mejores clientes" description={`Por valor facturado · ${periodLabel}`} flush>
                    {clients.length > 0 ? (
                        <Table>
                            <THead>
                                <TH>Cliente</TH>
                                <TH align="right" className="hidden sm:table-cell">Facturas</TH>
                                <TH align="right">Valor</TH>
                            </THead>
                            <TBody>
                                {clients.map((entry, index) => (
                                    <TR key={entry.client.id} href={`/dashboard/clients/${entry.client.id}`}>
                                        <TD className="wrap-anywhere">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-900">{entry.client.name}</p>
                                                    <p className="text-xs text-slate-500 sm:hidden">{entry.invoices} factura{entry.invoices === 1 ? "" : "s"}</p>
                                                </div>
                                            </div>
                                        </TD>
                                        <TD align="right" className="hidden tabular-nums sm:table-cell">{entry.invoices}</TD>
                                        <TD align="right" className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatCOP(entry.amount)}</TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    ) : (
                        <EmptyState title="Sin ventas en el período" description="Elige otro período para ver tus mejores clientes." />
                    )}
                </Panel>
            </div>

            <Panel
                title="Últimas facturas"
                description="Las 5 facturas más recientes"
                actions={<ButtonLink href="/dashboard/sales/invoices" variant="secondary" size="sm">Ver todas</ButtonLink>}
                flush
            >
                <Table>
                    <THead>
                        <TH>Factura</TH>
                        <TH className="hidden md:table-cell">Cliente</TH>
                        <TH align="right">Total</TH>
                        <TH align="right" className="hidden sm:table-cell">Estado</TH>
                    </THead>
                    <TBody>
                        {recent.map((invoice) => {
                            const status = getPaymentStatus(invoice);
                            return (
                                <TR key={invoice.id} href={`/dashboard/clients/${invoice.clientId}/invoices/${invoice.id}`}>
                                    <TD className="wrap-anywhere">
                                        <p className="font-semibold text-slate-900">#{invoice.number}</p>
                                        <p className="text-xs text-slate-500">
                                            {formatDate(invoice.issueDate)}
                                            <span className="md:hidden"> · {invoice.client.name}</span>
                                        </p>
                                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{getItemsSummary(invoice.items)}</p>
                                        <span className="mt-1 inline-block sm:hidden"><InvoiceStatusBadge status={status} /></span>
                                    </TD>
                                    <TD className="hidden wrap-anywhere md:table-cell">{invoice.client.name}</TD>
                                    <TD align="right" className={`whitespace-nowrap font-semibold tabular-nums ${status === "ANULADA" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                        {formatCOP(invoice.amount)}
                                    </TD>
                                    <TD align="right" className="hidden sm:table-cell"><InvoiceStatusBadge status={status} /></TD>
                                </TR>
                            );
                        })}
                    </TBody>
                </Table>
            </Panel>
        </div>
    );
}
