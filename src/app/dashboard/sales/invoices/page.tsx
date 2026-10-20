"use client";
import { formatCOP, formatDate, getInvoiceBalance, getItemsSummary, getPaymentStatus, toDateString } from "@/app/utils/clientInvoice";
import { invoicesToCsv, SalesInvoice, toDay } from "@/app/utils/sales";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import { useSales } from "@/components/sales/SalesContext";
import Button, { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import SearchInput from "@/components/ui/SearchInput";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { PaymentStatus } from "@/types/Client";
import { DateRangePicker, DateRangePickerItem, DateRangePickerValue, SearchSelect, SearchSelectItem } from "@tremor/react";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineDocumentText, HiOutlinePlus } from "react-icons/hi2";

type Filter = "all" | PaymentStatus;

const PAGE_SIZE = 50;

const today = new Date();
const startOfMonth = (offset = 0) => new Date(today.getFullYear(), today.getMonth() + offset, 1);
const daysAgo = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);

const filters: { value: Filter, label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "PENDIENTE", label: "Pendientes" },
    { value: "PARCIAL", label: "Abonadas" },
    { value: "PAGADA", label: "Pagadas" },
    { value: "ANULADA", label: "Anuladas" },
];

const balanceOf = (invoice: SalesInvoice) => invoice.status === "ANULADA" ? 0 : getInvoiceBalance(invoice);

export default function SalesInvoices() {
    const { invoices } = useSales();
    const [filter, setFilter] = useState<Filter>("all");
    const [clientId, setClientId] = useState("");
    const [dates, setDates] = useState<DateRangePickerValue>({});
    const [search, setSearch] = useState("");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const from = dates.from && toDateString(dates.from);
    const to = dates.to ? toDateString(dates.to) : from;

    // invoices matching everything but the status, so the status tabs can show their counts
    const scoped = useMemo(() => {
        if (!invoices) return [];
        const query = search.trim().toLocaleLowerCase();
        return invoices
            .map((invoice) => ({ invoice, status: getPaymentStatus(invoice) }))
            .filter(({ invoice }) => {
                const day = toDay(invoice.issueDate);
                if (clientId && invoice.clientId !== clientId) return false;
                if (from && day < from) return false;
                if (to && day > to) return false;
                if (!query) return true;
                return `#${invoice.number} ${invoice.number} ${invoice.client.name} ${invoice.client.idNum} ${getItemsSummary(invoice.items)}`
                    .toLocaleLowerCase()
                    .includes(query);
            });
    }, [invoices, clientId, from, to, search]);

    const clients = useMemo(() => {
        const unique = new Map((invoices ?? []).map((invoice) => [invoice.client.id, invoice.client]));
        return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [invoices]);

    if (!invoices) return <PageSkeleton stats={0} rows={8} />;

    const filtered = scoped.filter(({ status }) => filter === "all" || status === filter).map(({ invoice }) => invoice);
    const shown = filtered.slice(0, visible);
    // voided invoices don't count towards the totals
    const totalAmount = filtered.filter((invoice) => invoice.status === "ACTIVA").reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalBalance = filtered.reduce((sum, invoice) => sum + balanceOf(invoice), 0);
    const hasFilters = filter !== "all" || clientId || from || search;

    const resetFilters = () => {
        setFilter("all");
        setClientId("");
        setDates({});
        setSearch("");
    };

    const exportCsv = () => {
        const blob = new Blob([invoicesToCsv(filtered)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `facturas-${toDateString()}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    };

    if (invoices.length === 0) {
        return (
            <Panel>
                <EmptyState
                    icon={<HiOutlineDocumentText />}
                    title="Aún no hay facturas"
                    description="Crea tu primera factura de venta para empezar a ver tus ventas y tu cartera."
                    action={<ButtonLink href="/dashboard/sales/invoices/new" icon={<HiOutlinePlus className="h-4 w-4" />}>Nueva factura</ButtonLink>}
                />
            </Panel>
        );
    }

    return (
        <Panel flush>
            {/* Filters */}
            <div className="space-y-3 border-b border-slate-100 p-4 sm:px-6">
                <Segmented
                    label="Filtrar por estado"
                    value={filter}
                    onChange={(value) => { setFilter(value); setVisible(PAGE_SIZE); }}
                    options={filters.map((option) => ({
                        ...option,
                        count: option.value === "all" ? scoped.length : scoped.filter(({ status }) => status === option.value).length
                    }))}
                />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <SearchSelect
                        value={clientId}
                        onValueChange={(value) => { setClientId(value ?? ""); setVisible(PAGE_SIZE); }}
                        placeholder="Todos los clientes"
                    >
                        {clients.map((client) => (
                            <SearchSelectItem key={client.id} value={client.id}>{client.name}</SearchSelectItem>
                        ))}
                    </SearchSelect>
                    <DateRangePicker
                        value={dates}
                        onValueChange={(value) => { setDates(value); setVisible(PAGE_SIZE); }}
                        locale={es}
                        placeholder="Todas las fechas"
                        selectPlaceholder="Período"
                        className="w-full max-w-none [&>div]:min-w-0 [&_.w-48]:w-auto [&_.w-48]:min-w-[8.5rem] [&_.w-48]:shrink-0"
                    >
                        <DateRangePickerItem value="month" from={startOfMonth()} to={today}>Este mes</DateRangePickerItem>
                        <DateRangePickerItem value="lastMonth" from={startOfMonth(-1)} to={new Date(today.getFullYear(), today.getMonth(), 0)}>Mes anterior</DateRangePickerItem>
                        <DateRangePickerItem value="90days" from={daysAgo(89)} to={today}>Últimos 90 días</DateRangePickerItem>
                        <DateRangePickerItem value="year" from={new Date(today.getFullYear(), 0, 1)} to={today}>Este año</DateRangePickerItem>
                    </DateRangePicker>
                    <SearchInput
                        value={search}
                        onChange={(value) => { setSearch(value); setVisible(PAGE_SIZE); }}
                        placeholder="Buscar factura, cliente o producto"
                        className="md:col-span-2 xl:col-span-1"
                    />
                </div>
            </div>

            {/* Summary of the filtered set */}
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{filtered.length}</span> factura(s)
                    <span className="mx-2 text-slate-300">·</span>
                    Total <span className="font-semibold tabular-nums text-slate-900">{formatCOP(totalAmount)}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    Saldo <span className={`font-semibold tabular-nums ${totalBalance > 0 ? "text-red-600" : "text-slate-900"}`}>{formatCOP(totalBalance)}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {hasFilters && <Button variant="ghost" size="sm" onClick={resetFilters}>Limpiar filtros</Button>}
                    <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0} icon={<HiOutlineArrowDownTray className="h-4 w-4" />}>
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={<HiOutlineDocumentText />}
                    title="Sin resultados"
                    description="Ninguna factura coincide con los filtros."
                    action={<Button variant="secondary" onClick={resetFilters}>Limpiar filtros</Button>}
                />
            ) : (
                <>
                    <Table>
                        <THead>
                            <TH>Factura</TH>
                            <TH className="hidden lg:table-cell">Cliente</TH>
                            <TH className="hidden xl:table-cell">Productos</TH>
                            <TH align="right" className="hidden lg:table-cell">Total</TH>
                            <TH align="right">Saldo</TH>
                            <TH align="right" className="hidden sm:table-cell">Estado</TH>
                        </THead>
                        <TBody>
                            {shown.map((invoice) => {
                                const status = getPaymentStatus(invoice);
                                const balance = balanceOf(invoice);
                                return (
                                    <TR key={invoice.id} href={`/dashboard/clients/${invoice.clientId}/invoices/${invoice.id}`}>
                                        <TD>
                                            <p className="font-semibold text-slate-900">#{invoice.number}</p>
                                            <p className="text-xs text-slate-500">{formatDate(invoice.issueDate)}</p>
                                            <p className="mt-0.5 text-xs font-medium text-slate-700 [overflow-wrap:anywhere] lg:hidden">{invoice.client.name}</p>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 [overflow-wrap:anywhere] xl:hidden">{getItemsSummary(invoice.items)}</p>
                                        </TD>
                                        <TD className="hidden lg:table-cell [overflow-wrap:anywhere]">
                                            <p className="font-medium text-slate-900">{invoice.client.name}</p>
                                            <p className="text-xs text-slate-500">{invoice.client.idType} {invoice.client.idNum}</p>
                                        </TD>
                                        <TD className="hidden xl:table-cell">
                                            <p className="line-clamp-2 text-slate-600 [overflow-wrap:anywhere]">{getItemsSummary(invoice.items)}</p>
                                        </TD>
                                        <TD align="right" className={`hidden whitespace-nowrap tabular-nums lg:table-cell ${status === "ANULADA" ? "text-slate-400 line-through" : ""}`}>
                                            {formatCOP(invoice.amount)}
                                        </TD>
                                        <TD align="right" className={`whitespace-nowrap tabular-nums font-semibold ${balance > 0 ? "text-slate-900" : "text-slate-400"}`}>
                                            {status === "ANULADA" ? "—" : formatCOP(balance)}
                                            {/* on phones the status goes under the balance */}
                                            <div className="mt-1 sm:hidden"><InvoiceStatusBadge status={status} /></div>
                                        </TD>
                                        <TD align="right" className="hidden sm:table-cell"><InvoiceStatusBadge status={status} /></TD>
                                    </TR>
                                );
                            })}
                        </TBody>
                        <tfoot className="border-t border-slate-200 bg-slate-50/80 text-sm">
                            <tr>
                                <td className="px-4 py-3 font-semibold text-slate-900 sm:pl-6">
                                    Total
                                    <p className="text-xs font-normal text-slate-500 lg:hidden">Facturado {formatCOP(totalAmount)}</p>
                                </td>
                                <td className="hidden lg:table-cell" />
                                <td className="hidden xl:table-cell" />
                                <td className="hidden px-4 py-3 text-right font-semibold tabular-nums text-slate-900 lg:table-cell">{formatCOP(totalAmount)}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-600">{formatCOP(totalBalance)}</td>
                                <td className="hidden pr-4 sm:table-cell sm:pr-6" />
                            </tr>
                        </tfoot>
                    </Table>
                    {filtered.length > visible && (
                        <div className="flex flex-col items-center gap-2 border-t border-slate-100 px-4 py-4">
                            <p className="text-sm text-slate-500">Mostrando {shown.length} de {filtered.length}</p>
                            <Button variant="secondary" onClick={() => setVisible(visible + PAGE_SIZE)}>Mostrar más</Button>
                        </div>
                    )}
                </>
            )}
        </Panel>
    );
}
