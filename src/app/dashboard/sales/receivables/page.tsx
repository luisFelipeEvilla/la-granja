"use client";
import { useState } from "react";
import NextLink from "next/link";
import { HiOutlineChatBubbleLeftEllipsis, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamationTriangle, HiOutlineScale, HiOutlineUsers } from "react-icons/hi2";
import { formatCOP } from "@/app/utils/clientInvoice";
import { AgingBucket, agingBuckets, getAgingBucket, getReceivables } from "@/app/utils/sales";
import { useSales } from "@/components/sales/SalesContext";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

type Filter = "all" | "30" | "90";

const bucketColors: Record<AgingBucket, string> = {
    "0-30": "bg-emerald-500",
    "31-60": "bg-amber-400",
    "61-90": "bg-orange-500",
    "90+": "bg-red-500",
};

const bucketTones: Record<AgingBucket, BadgeTone> = {
    "0-30": "emerald",
    "31-60": "amber",
    "61-90": "amber",
    "90+": "red",
};

const formatPercent = (value: number) => `${Math.round(value * 100)} %`;

// horizontal bar split by age buckets, widths proportional to each amount
function AgingBar({ buckets, total, className = "h-3" }: { buckets: Record<AgingBucket, number>, total: number, className?: string }) {
    return (
        <div className={`flex w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
            {agingBuckets.map(({ key, label }) => buckets[key] > 0 && (
                <span
                    key={key}
                    title={`${label}: ${formatCOP(buckets[key])}`}
                    className={`h-full ${bucketColors[key]}`}
                    style={{ width: `${(buckets[key] / total) * 100}%` }}
                />
            ))}
        </div>
    );
}

export default function Receivables() {
    const { invoices } = useSales();
    const [filter, setFilter] = useState<Filter>("all");

    if (!invoices) return <PageSkeleton stats={4} />;

    const receivables = getReceivables(invoices);

    if (receivables.total === 0) {
        return (
            <Panel>
                <EmptyState
                    icon={<HiOutlineCheckCircle />}
                    title="Sin cartera pendiente"
                    description="Todas las facturas activas están pagadas. Aquí verás el saldo por cobrar y su antigüedad."
                />
            </Panel>
        );
    }

    const over30 = receivables.clients.filter((entry) => entry.oldestDays > 30);
    const over90 = receivables.clients.filter((entry) => entry.oldestDays > 90);
    const visible = filter === "90" ? over90 : filter === "30" ? over30 : receivables.clients;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard label="Cartera total" value={formatCOP(receivables.total)} icon={<HiOutlineScale />} tone="red" />
                <StatCard label="Clientes con saldo" value={receivables.clients.length} icon={<HiOutlineUsers />} tone="amber" />
                <StatCard
                    label="Antigüedad promedio"
                    value={`${receivables.weightedDays} días`}
                    icon={<HiOutlineClock />}
                    tone="blue"
                    hint="Ponderada por el saldo de cada factura"
                />
                <StatCard
                    label="Más de 90 días"
                    value={formatCOP(receivables.totals["90+"])}
                    icon={<HiOutlineExclamationTriangle />}
                    tone={receivables.totals["90+"] > 0 ? "red" : "default"}
                    hint={`${formatPercent(receivables.totals["90+"] / receivables.total)} de la cartera`}
                />
            </div>

            <Panel title="Antigüedad de la cartera" description="Saldo pendiente según los días transcurridos desde la emisión de cada factura">
                <AgingBar buckets={receivables.totals} total={receivables.total} className="h-4" />
                <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {agingBuckets.map(({ key, label }) => (
                        <div key={key} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                            <dt className="flex items-center gap-2 text-sm text-slate-600">
                                <span className={`h-2.5 w-2.5 rounded-full ${bucketColors[key]}`} />
                                {label}
                            </dt>
                            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatCOP(receivables.totals[key])}</dd>
                            <dd className="text-xs tabular-nums text-slate-500">{formatPercent(receivables.totals[key] / receivables.total)}</dd>
                        </div>
                    ))}
                </dl>
            </Panel>

            <Panel flush>
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Cartera por cliente</h2>
                        <p className="mt-0.5 text-sm text-slate-500">Toca un cliente para ver su estado de cuenta</p>
                    </div>
                    <Segmented
                        label="Filtrar por antigüedad"
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: "all", label: "Todos", count: receivables.clients.length },
                            { value: "30", label: "Más de 30 días", count: over30.length },
                            { value: "90", label: "Más de 90 días", count: over90.length },
                        ]}
                    />
                </div>

                {visible.length > 0 ? (
                    <Table>
                        <THead>
                            <TH>Cliente</TH>
                            {agingBuckets.map(({ key, label }) => (
                                <TH key={key} align="right" className="hidden xl:table-cell">{label}</TH>
                            ))}
                            <TH align="right">Saldo</TH>
                            <TH align="right" className="hidden sm:table-cell">Más antigua</TH>
                            <TH align="right"><span className="sr-only">Acciones</span></TH>
                        </THead>
                        <TBody>
                            {visible.map((entry) => {
                                const oldestBucket = getAgingBucket(entry.oldestDays);
                                return (
                                    <TR key={entry.client.id} href={`/dashboard/clients/${entry.client.id}/statement`}>
                                        <TD className="[overflow-wrap:anywhere]">
                                            <p className="font-medium text-slate-900">{entry.client.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {entry.client.idType} {entry.client.idNum} · {entry.pending.length} factura{entry.pending.length === 1 ? "" : "s"}
                                            </p>
                                            <div className="mt-2 xl:hidden">
                                                <AgingBar buckets={entry.buckets} total={entry.balance} className="h-1.5" />
                                            </div>
                                            <span className="mt-1.5 inline-block sm:hidden">
                                                <Badge tone={bucketTones[oldestBucket]}>{entry.oldestDays} días</Badge>
                                            </span>
                                        </TD>
                                        {agingBuckets.map(({ key }) => (
                                            <TD key={key} align="right" className={`hidden whitespace-nowrap tabular-nums xl:table-cell ${entry.buckets[key] ? "text-slate-700" : "text-slate-300"}`}>
                                                {entry.buckets[key] ? formatCOP(entry.buckets[key]) : "—"}
                                            </TD>
                                        ))}
                                        <TD align="right" className="whitespace-nowrap font-semibold tabular-nums text-red-600">{formatCOP(entry.balance)}</TD>
                                        <TD align="right" className="hidden sm:table-cell">
                                            <Badge tone={bucketTones[oldestBucket]}>{entry.oldestDays} días</Badge>
                                        </TD>
                                        <TD align="right">
                                            {/* reminding must not open the statement */}
                                            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                                                <NextLink
                                                    href={`/dashboard/sales/reminders?client=${entry.client.id}`}
                                                    aria-label={`Enviar recordatorio a ${entry.client.name}`}
                                                    title="Enviar recordatorio"
                                                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 lg:px-3"
                                                >
                                                    <HiOutlineChatBubbleLeftEllipsis className="h-5 w-5" />
                                                    <span className="hidden lg:inline">Recordar</span>
                                                </NextLink>
                                            </span>
                                        </TD>
                                    </TR>
                                );
                            })}
                        </TBody>
                    </Table>
                ) : (
                    <EmptyState title="Sin clientes en este filtro" description="Ningún cliente tiene facturas pendientes con esa antigüedad." />
                )}
            </Panel>
        </div>
    );
}
