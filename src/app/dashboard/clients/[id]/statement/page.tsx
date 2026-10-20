"use client";
import { formatCOP, formatDate, getAccountStatement, getInvoiceBalance, getItemsSummary, getPeriodLabel, idTypeLabels, toDateString } from "@/app/utils/clientInvoice";
import { ClientWithInvoices } from "@/types/Client";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { DateRangePicker, DateRangePickerItem, type DateRangePickerValue } from "@/components/ui/form/DatePicker";
import { es } from "date-fns/locale";
import dynamic from "next/dynamic";
import { useEffect, useState, use } from "react";
import {
    HiOutlineArrowDownLeft,
    HiOutlineArrowUpRight,
    HiOutlineBanknotes,
    HiOutlineCalendarDays,
    HiOutlineClock,
    HiOutlineDocumentText
} from "react-icons/hi2";
import toast from "react-hot-toast";

const ClientStatementPDF = dynamic(() => import("@/components/pdfs/clientStatement"), {
    ssr: false
});

const today = new Date();
const startOfMonth = (offset = 0) => new Date(today.getFullYear(), today.getMonth() + offset, 1);
const daysAgo = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);

// "all" keeps the whole history: no bounds are applied to the statement
const ALL = 'all';

export default function ClientStatement(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [client, setClient] = useState<ClientWithInvoices>();
    const [dates, setDates] = useState<DateRangePickerValue>({ selectValue: ALL });

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
            else toast.error('Cliente no encontrado');
        });
    }, [params.id]);

    if (!client) return <PageSkeleton stats={4} />;

    const isAll = dates.selectValue === ALL || (!dates.from && !dates.to);
    const from = !isAll && dates.from ? toDateString(dates.from) : undefined;
    const to = !isAll ? (dates.to ? toDateString(dates.to) : from) : undefined;
    const statement = getAccountStatement(client.invoices, from, to);

    // first invoice date (local calendar day), shown as the start of "Todo el historial"
    const firstIssue = client.invoices.map((invoice) => new Date(invoice.issueDate).toISOString().slice(0, 10)).sort()[0];
    const firstDay = firstIssue ? new Date(`${firstIssue}T00:00:00`) : today;

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: `/dashboard/clients/${client.id}`, label: client.name }}
                title="Estado de cuenta"
                description={`${client.name} · ${idTypeLabels[client.idType]} ${client.idNum}`}
                actions={<ClientStatementPDF client={client} from={from} to={to} />}
            />

            {/* Period filter */}
            <Panel>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500">
                            <HiOutlineCalendarDays />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Período</p>
                            <p className="text-sm text-slate-500">{getPeriodLabel(from, to)}</p>
                        </div>
                    </div>
                    <DateRangePicker
                        value={dates}
                        onValueChange={(value) => setDates(value.selectValue === ALL ? { selectValue: ALL } : value)}
                        locale={es}
                        placeholder="Elegir fechas"
                        selectPlaceholder="Período"
                        enableClear={false}
                        className="w-full max-w-none md:w-auto md:min-w-104 [&>div]:min-w-0 [&_.w-48]:w-auto [&_.w-48]:shrink-0 [&_.w-48]:min-w-34 md:[&_.w-48]:w-48"
                    >
                        <DateRangePickerItem value="month" from={startOfMonth()} to={today}>Este mes</DateRangePickerItem>
                        <DateRangePickerItem value="lastMonth" from={startOfMonth(-1)} to={new Date(today.getFullYear(), today.getMonth(), 0)}>Mes anterior</DateRangePickerItem>
                        <DateRangePickerItem value="90days" from={daysAgo(89)} to={today}>Últimos 90 días</DateRangePickerItem>
                        <DateRangePickerItem value="year" from={new Date(today.getFullYear(), 0, 1)} to={today}>Este año</DateRangePickerItem>
                        <DateRangePickerItem value={ALL} from={firstDay} to={today}>Todo el historial</DateRangePickerItem>
                    </DateRangePicker>
                </div>
            </Panel>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard
                    label="Saldo anterior"
                    value={from ? formatCOP(statement.openingBalance) : '—'}
                    icon={<HiOutlineClock />}
                    hint={from ? `Antes del ${formatDate(from)}` : 'Sin período seleccionado'}
                />
                <StatCard label="Facturado" value={formatCOP(statement.totalCharges)} icon={<HiOutlineArrowUpRight />} tone="blue" />
                <StatCard label="Pagado" value={formatCOP(statement.totalCredits)} icon={<HiOutlineArrowDownLeft />} tone="emerald" />
                <StatCard
                    label={to ? `Saldo al ${formatDate(to)}` : 'Saldo actual'}
                    value={formatCOP(statement.closingBalance)}
                    icon={<HiOutlineBanknotes />}
                    tone={statement.closingBalance > 0 ? "red" : "default"}
                />
            </div>

            {/* Movements */}
            <Panel title="Movimientos" description="Facturas como cargos y pagos como abonos, con el saldo acumulado" flush>
                {statement.movements.length > 0 || from ? (
                    <Table>
                        <THead>
                            <TH className="hidden sm:table-cell">Fecha</TH>
                            <TH>Descripción</TH>
                            <TH align="right" className="hidden sm:table-cell">Cargo</TH>
                            <TH align="right" className="hidden sm:table-cell">Abono</TH>
                            <TH align="right">Saldo</TH>
                        </THead>
                        <TBody>
                            {from && (
                                <TR className="bg-slate-50/60">
                                    <TD className="hidden whitespace-nowrap text-slate-500 sm:table-cell">{formatDate(from)}</TD>
                                    <TD className="font-medium text-slate-700">
                                        Saldo anterior
                                        <p className="text-xs font-normal text-slate-500 sm:hidden">{formatDate(from)}</p>
                                    </TD>
                                    <TD className="hidden sm:table-cell" />
                                    <TD className="hidden sm:table-cell" />
                                    <TD align="right" className="whitespace-nowrap tabular-nums font-semibold text-slate-900">{formatCOP(statement.openingBalance)}</TD>
                                </TR>
                            )}
                            {statement.movements.map((movement, index) => (
                                <TR key={index}>
                                    <TD className="hidden whitespace-nowrap text-slate-500 sm:table-cell">{formatDate(movement.date)}</TD>
                                    <TD className="wrap-anywhere">
                                        <div className="flex items-start gap-2">
                                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${movement.charge ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                            <div className="min-w-0">
                                                <p className="text-slate-800">{movement.description}</p>
                                                <p className="text-xs tabular-nums sm:hidden">
                                                    <span className="text-slate-500">{formatDate(movement.date)} · </span>
                                                    <span className={`font-semibold ${movement.charge ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                        {movement.charge ? `+ ${formatCOP(movement.charge)}` : `− ${formatCOP(movement.credit)}`}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD align="right" className="hidden whitespace-nowrap tabular-nums text-blue-600 sm:table-cell">
                                        {movement.charge ? formatCOP(movement.charge) : ''}
                                    </TD>
                                    <TD align="right" className="hidden whitespace-nowrap tabular-nums text-emerald-600 sm:table-cell">
                                        {movement.credit ? formatCOP(movement.credit) : ''}
                                    </TD>
                                    <TD align="right" className="whitespace-nowrap tabular-nums font-semibold text-slate-900">{formatCOP(movement.balance)}</TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                ) : null}
                {statement.movements.length === 0 && (
                    <EmptyState
                        icon={<HiOutlineDocumentText />}
                        title="Sin movimientos en este período"
                        description="Elige otro rango de fechas o revisa todo el historial."
                    />
                )}
                {statement.movements.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-6">
                        <span className="text-sm font-semibold text-slate-700">{to ? `Saldo al ${formatDate(to)}` : 'Saldo actual'}</span>
                        <span className={`text-lg font-bold tabular-nums ${statement.closingBalance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {formatCOP(statement.closingBalance)}
                        </span>
                    </div>
                )}
            </Panel>

            {/* Pending invoices */}
            {statement.pendingInvoices.length > 0 && (
                <Panel title="Facturas pendientes de pago" description="De la más antigua a la más reciente" flush>
                    <Table>
                        <THead>
                            <TH>Factura</TH>
                            <TH className="hidden xl:table-cell">Productos</TH>
                            <TH align="right" className="hidden sm:table-cell">Total</TH>
                            <TH align="right" className="hidden lg:table-cell">Pagado</TH>
                            <TH align="right">Saldo</TH>
                        </THead>
                        <TBody>
                            {statement.pendingInvoices.map((invoice) => {
                                const invoiceId = client.invoices.find((clientInvoice) => clientInvoice.number === invoice.number)?.id;
                                return (
                                    <TR key={invoice.number} href={invoiceId && `/dashboard/clients/${client.id}/invoices/${invoiceId}`}>
                                        <TD>
                                            <p className="font-semibold text-slate-900">#{invoice.number}</p>
                                            <p className="text-xs text-slate-500">{formatDate(invoice.issueDate)}</p>
                                            <p className="mt-0.5 line-clamp-2 wrap-anywhere text-xs text-slate-500 xl:hidden">{getItemsSummary(invoice.items)}</p>
                                        </TD>
                                        <TD className="hidden xl:table-cell">
                                            <p className="line-clamp-2 wrap-anywhere text-slate-600">{getItemsSummary(invoice.items)}</p>
                                        </TD>
                                        <TD align="right" className="hidden whitespace-nowrap tabular-nums sm:table-cell">{formatCOP(invoice.amount)}</TD>
                                        <TD align="right" className="hidden whitespace-nowrap tabular-nums text-emerald-600 lg:table-cell">{formatCOP(invoice.paidAmount)}</TD>
                                        <TD align="right" className="whitespace-nowrap tabular-nums font-semibold text-red-600">{formatCOP(getInvoiceBalance(invoice))}</TD>
                                    </TR>
                                );
                            })}
                        </TBody>
                    </Table>
                </Panel>
            )}
        </div>
    )
}
