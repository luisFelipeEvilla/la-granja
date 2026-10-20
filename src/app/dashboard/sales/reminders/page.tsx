"use client";
import { formatCOP } from "@/app/utils/clientInvoice";
import { ClientReceivable, getReceivables, toWhatsappPhone } from "@/app/utils/sales";
import ReminderDialog from "@/components/sales/ReminderDialog";
import { Reminder, useSales } from "@/components/sales/SalesContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineChatBubbleLeftEllipsis, HiOutlineCheckBadge, HiOutlineClock } from "react-icons/hi2";

type Filter = "all" | "stale" | "never";

const DAY = 86_400_000;

// "hoy", "ayer", "hace 3 días"
const relativeDay = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / DAY);
    if (days <= 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days} días`;
};

const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

function Reminders() {
    const { invoices, reminders, reload } = useSales();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [filter, setFilter] = useState<Filter>("all");
    const [selected, setSelected] = useState<ClientReceivable | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const receivables = useMemo(() => invoices ? getReceivables(invoices).clients : [], [invoices]);

    // reminders come newest first: the first one per client is the latest
    const lastReminder = useMemo(() => {
        const latest = new Map<string, Reminder>();
        (reminders ?? []).forEach((reminder) => {
            if (!latest.has(reminder.clientId)) latest.set(reminder.clientId, reminder);
        });
        return latest;
    }, [reminders]);

    // ?client=<id> (from the client profile) opens the dialog for that client
    // opened only once per link: data reloads after sending must not reopen it
    const requestedClient = searchParams.get("client");
    const openedFor = useRef<string | null>(null);
    useEffect(() => {
        if (!requestedClient || !invoices || openedFor.current === requestedClient) return;
        const receivable = receivables.find((entry) => entry.client.id === requestedClient);
        if (receivable) {
            openedFor.current = requestedClient;
            setSelected(receivable);
        }
    }, [requestedClient, invoices, receivables]);

    if (!invoices || !reminders) return <PageSkeleton stats={0} rows={6} />;

    const isStale = (clientId: string) => {
        const last = lastReminder.get(clientId);
        return !last || Date.now() - new Date(last.sentAt).getTime() > 7 * DAY;
    };

    const visible = receivables.filter(({ client }) =>
        filter === "never" ? !lastReminder.has(client.id) : filter === "stale" ? isStale(client.id) : true
    );

    const closeDialog = () => {
        setSelected(null);
        if (requestedClient) router.replace("/dashboard/sales/reminders");
    };

    return (
        <div className="space-y-6">
            <Panel
                flush
                title="Clientes por cobrar"
                description="Envía un recordatorio por WhatsApp con el saldo y las facturas pendientes"
                actions={receivables.length > 0 && (
                    <Segmented
                        label="Filtrar clientes"
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: "all", label: "Todos", count: receivables.length },
                            { value: "stale", label: "Sin recordar en 7 días", count: receivables.filter(({ client }) => isStale(client.id)).length },
                            { value: "never", label: "Nunca recordados", count: receivables.filter(({ client }) => !lastReminder.has(client.id)).length },
                        ]}
                    />
                )}
            >
                {receivables.length === 0 ? (
                    <EmptyState
                        icon={<HiOutlineCheckBadge />}
                        title="Nadie te debe"
                        description="Todos tus clientes están al día. Cuando haya saldos pendientes aparecerán aquí."
                    />
                ) : visible.length === 0 ? (
                    <EmptyState icon={<HiOutlineClock />} title="Sin resultados" description="Ningún cliente coincide con el filtro." />
                ) : (
                    <Table>
                        <THead>
                            <TH>Cliente</TH>
                            <TH align="right">Saldo</TH>
                            <TH className="hidden md:table-cell">Antigüedad</TH>
                            <TH className="hidden lg:table-cell">Último recordatorio</TH>
                            <TH align="right"><span className="sr-only">Acciones</span></TH>
                        </THead>
                        <TBody>
                            {visible.map((receivable) => {
                                const { client, balance, pending, oldestDays } = receivable;
                                const last = lastReminder.get(client.id);
                                const lastLabel = last ? relativeDay(last.sentAt) : "Nunca";
                                const hasPhone = !!toWhatsappPhone(client.phone);
                                return (
                                    <TR key={client.id}>
                                        <TD className="[overflow-wrap:anywhere]">
                                            <p className="font-medium text-slate-900">{client.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {pending.length} factura(s) pendiente(s)
                                                <span className="md:hidden"> · {oldestDays} días</span>
                                            </p>
                                            <p className="text-xs text-slate-500 lg:hidden">Recordado: {lastLabel}</p>
                                            {!hasPhone && <p className="mt-1"><Badge tone="amber" dot={false}>Sin celular</Badge></p>}
                                        </TD>
                                        <TD align="right" className="whitespace-nowrap font-semibold tabular-nums text-red-600">{formatCOP(balance)}</TD>
                                        <TD className="hidden whitespace-nowrap md:table-cell">
                                            <Badge tone={oldestDays > 90 ? "red" : oldestDays > 30 ? "amber" : "gray"} dot={false}>
                                                {oldestDays} días
                                            </Badge>
                                        </TD>
                                        <TD className="hidden whitespace-nowrap text-slate-500 lg:table-cell">{lastLabel}</TD>
                                        <TD align="right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSelected(receivable)}
                                                icon={<HiOutlineChatBubbleLeftEllipsis className="h-4 w-4 text-emerald-600" />}
                                                aria-label={`Recordar pago a ${client.name}`}
                                            >
                                                <span className="hidden sm:inline">Recordar</span>
                                            </Button>
                                        </TD>
                                    </TR>
                                );
                            })}
                        </TBody>
                    </Table>
                )}
            </Panel>

            <Panel flush title="Historial" description="Últimos recordatorios enviados">
                {reminders.length === 0 ? (
                    <EmptyState icon={<HiOutlineClock />} title="Sin recordatorios" description="Aquí verás cada recordatorio enviado por WhatsApp." />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {reminders.map((reminder) => {
                            const open = expanded === reminder.id;
                            return (
                                <li key={reminder.id}>
                                    <button
                                        type="button"
                                        onClick={() => setExpanded(open ? null : reminder.id)}
                                        aria-expanded={open}
                                        className="flex min-h-[56px] w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50 sm:px-6"
                                    >
                                        <div className="min-w-0 [overflow-wrap:anywhere]">
                                            <p className="font-medium text-slate-900">{reminder.client.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(reminder.sentAt)}
                                                {reminder.invoiceNumbers.length > 0 && ` · Facturas ${reminder.invoiceNumbers.map((n) => `#${n}`).join(", ")}`}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="font-semibold tabular-nums text-slate-900">{formatCOP(reminder.balance)}</p>
                                            <p className="text-xs text-emerald-600">{open ? "Ocultar mensaje" : "Ver mensaje"}</p>
                                        </div>
                                    </button>
                                    {open && (
                                        <p className="mx-4 mb-4 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700 [overflow-wrap:anywhere] sm:mx-6">
                                            {reminder.message}
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>

            <ReminderDialog receivable={selected} onClose={closeDialog} onSent={reload} />
        </div>
    );
}

export default function RemindersPage() {
    return (
        <Suspense fallback={<PageSkeleton stats={0} rows={6} />}>
            <Reminders />
        </Suspense>
    );
}
