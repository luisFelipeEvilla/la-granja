"use client";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import EvidencePanel from "@/components/invoices/EvidencePanel";
import SignaturePanel from "@/components/invoices/SignaturePanel";
import Badge from "@/components/ui/Badge";
import { formatCOP, formatDate, getInvoiceBalance, getPaymentStatus, paymentMethodLabels, toDateString, formatQuantity } from "@/app/utils/clientInvoice";
import { InvoiceWithClient } from "@/types/Client";
import Button, { ButtonLink } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { DatePicker, TextInput } from "@tremor/react";
import { es } from "date-fns/locale";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import MoneyInput from "@/components/inputs/MoneyInput";
import {
    HiOutlineBanknotes,
    HiOutlineCheckCircle,
    HiOutlineCreditCard,
    HiOutlineNoSymbol,
    HiOutlinePencilSquare,
    HiOutlineReceiptPercent,
    HiOutlineTrash
} from "react-icons/hi2";
import toast from "react-hot-toast";

const ClientInvoicePDF = dynamic(() => import("@/components/pdfs/clientInvoice"), {
    ssr: false
});

type PaymentInputs = { amount: string, reference: string };

type Params = { params: { id: string, invoiceId: string } };

type PaymentMethod = keyof typeof paymentMethodLabels;

// what the confirmation dialog is about to do
type PendingAction = { type: 'void' } | { type: 'deletePayment', paymentId: string, amount: number } | null;

export default function InvoiceDetail({ params }: Params) {
    const [invoice, setInvoice] = useState<InvoiceWithClient>();
    const [method, setMethod] = useState<PaymentMethod>('EFECTIVO');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [busy, setBusy] = useState(false);
    const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PaymentInputs>();

    const loadInvoice = useCallback(async () => {
        const res = await fetch(`/api/client-invoices/${params.invoiceId}`);
        if (!res.ok) return toast.error('Factura no encontrada');

        const data: InvoiceWithClient = await res.json();
        setInvoice(data);
        reset({ amount: String(getInvoiceBalance(data)), reference: '' });
    }, [params.invoiceId, reset]);

    useEffect(() => { loadInvoice() }, [loadInvoice]);

    const onAddPayment: SubmitHandler<PaymentInputs> = async (data) => {
        const res = await fetch(`/api/client-invoices/${params.invoiceId}/payments`, {
            method: 'POST',
            body: JSON.stringify({ ...data, amount: parseInt(data.amount), method, date: date && toDateString(date) })
        });
        const json = await res.json();

        if (!res.ok) return toast.error(json.message ?? 'Error al registrar el pago');

        toast.success('Pago registrado correctamente');
        loadInvoice();
    }

    const deletePayment = async (paymentId: string) => {
        setBusy(true);
        const res = await fetch(`/api/client-payments/${paymentId}`, { method: 'DELETE' });
        setBusy(false);
        setPendingAction(null);

        if (!res.ok) return toast.error('Error al eliminar el pago');

        toast.success('Pago eliminado');
        loadInvoice();
    }

    const voidInvoice = async () => {
        setBusy(true);
        const res = await fetch(`/api/client-invoices/${params.invoiceId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ANULADA' })
        });
        const json = await res.json();
        setBusy(false);
        setPendingAction(null);

        if (!res.ok) return toast.error(json.message ?? 'Error al anular la factura');

        toast.success('Factura anulada');
        loadInvoice();
    }

    const confirmPendingAction = () => {
        if (pendingAction?.type === 'void') voidInvoice();
        if (pendingAction?.type === 'deletePayment') deletePayment(pendingAction.paymentId);
    }

    if (!invoice) return <PageSkeleton />;

    const balance = getInvoiceBalance(invoice);
    const isActive = invoice.status === 'ACTIVA';
    // a signed invoice is frozen: payments and evidence still allowed, editing is not
    const isSigned = Boolean(invoice.signedAt);
    const canPay = isActive && balance > 0;
    const canVoid = isActive && invoice.paidAmount === 0;
    const paidPercent = invoice.amount > 0 ? Math.min(100, Math.round(invoice.paidAmount / invoice.amount * 100)) : 0;

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: `/dashboard/clients/${params.id}`, label: invoice.client.name }}
                title={`Factura #${invoice.number}`}
                badge={<div className="flex flex-wrap items-center gap-2">
                    <InvoiceStatusBadge status={getPaymentStatus(invoice)} />
                    {isSigned && <Badge tone="emerald">Firmada</Badge>}
                </div>}
                description={<>
                    <NextLink href={`/dashboard/clients/${params.id}`} className="min-h-0 min-w-0 font-medium text-slate-700 hover:text-emerald-700 hover:underline">
                        {invoice.client.name}
                    </NextLink>
                    {' · '}Emitida el {formatDate(invoice.issueDate)}
                </>}
                actions={<>
                    {canVoid && (
                        <Button variant="danger" icon={<HiOutlineNoSymbol className="h-4 w-4" />} onClick={() => setPendingAction({ type: 'void' })}>
                            Anular
                        </Button>
                    )}
                    {isActive && !isSigned && (
                        <ButtonLink
                            href={`/dashboard/clients/${params.id}/invoices/${invoice.id}/edit`}
                            variant="secondary"
                            icon={<HiOutlinePencilSquare className="h-4 w-4" />}
                        >
                            Editar
                        </ButtonLink>
                    )}
                    <ClientInvoicePDF invoice={invoice} />
                </>}
            />

            {isSigned && isActive && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    El cliente firmó esta factura: los productos y montos ya no se pueden editar. Puedes seguir registrando pagos y evidencias.
                </div>
            )}

            {invoice.status === 'ANULADA' && (
                <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    Esta factura está anulada: no suma a la cartera del cliente ni admite pagos.
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <StatCard label="Total" value={formatCOP(invoice.amount)} icon={<HiOutlineReceiptPercent />} tone="blue" />
                <StatCard label="Pagado" value={formatCOP(invoice.paidAmount)} icon={<HiOutlineCheckCircle />} tone="emerald" />
                <StatCard
                    className="col-span-2 md:col-span-1"
                    label="Saldo"
                    value={formatCOP(balance)}
                    icon={<HiOutlineBanknotes />}
                    tone={balance > 0 && isActive ? "red" : "default"}
                />
            </div>
            {isActive && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">Progreso de pago</span>
                        <span className="tabular-nums text-slate-500">{paidPercent}%</span>
                    </div>
                    <div
                        className="h-2 overflow-hidden rounded-full bg-slate-200"
                        role="progressbar"
                        aria-valuenow={paidPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Porcentaje pagado"
                    >
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${paidPercent}%` }} />
                    </div>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="space-y-6 min-w-0">
                    {/* Products */}
                    <Panel title="Productos" flush>
                        <Table>
                            <THead>
                                <TH>Producto</TH>
                                <TH align="right">Cantidad</TH>
                                <TH align="right" className="hidden sm:table-cell">Precio unitario</TH>
                                <TH align="right">Total</TH>
                            </THead>
                            <TBody>
                                {invoice.items.map((item, index) => (
                                    <TR key={index}>
                                        <TD>
                                            <p className="font-medium text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500 sm:hidden">{formatCOP(item.unitPrice)} / {item.unit}</p>
                                        </TD>
                                        <TD align="right" className="whitespace-nowrap tabular-nums">{formatQuantity(item.quantity)} {item.unit}</TD>
                                        <TD align="right" className="hidden whitespace-nowrap tabular-nums sm:table-cell">{formatCOP(item.unitPrice)}</TD>
                                        <TD align="right" className="whitespace-nowrap tabular-nums font-medium text-slate-900">{formatCOP(item.total)}</TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-6">
                            <span className="text-sm font-semibold text-slate-700">Total factura</span>
                            <span className="text-lg font-bold tabular-nums text-slate-900">{formatCOP(invoice.amount)}</span>
                        </div>
                        {invoice.notes && (
                            <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:px-6">
                                <span className="font-medium text-slate-700">Notas: </span>{invoice.notes}
                            </div>
                        )}
                    </Panel>

                    <SignaturePanel invoice={invoice} onChange={loadInvoice} />

                    <EvidencePanel invoiceId={invoice.id} attachments={invoice.attachments} onChange={loadInvoice} />

                    {/* Payments */}
                    <Panel title="Pagos y abonos" description={invoice.payments.length > 0 ? `${invoice.payments.length} registrado(s)` : undefined} flush>
                        {invoice.payments.length > 0 ? (
                            <Table>
                                <THead>
                                    <TH>Fecha</TH>
                                    <TH className="hidden sm:table-cell">Método</TH>
                                    <TH className="hidden md:table-cell">Referencia</TH>
                                    <TH align="right">Monto</TH>
                                    <TH align="right"><span className="sr-only">Acciones</span></TH>
                                </THead>
                                <TBody>
                                    {invoice.payments.map((payment) => (
                                        <TR key={payment.id}>
                                            <TD className="whitespace-nowrap">
                                                <p className="text-slate-900">{formatDate(payment.date)}</p>
                                                <p className="text-xs text-slate-500 sm:hidden">
                                                    {paymentMethodLabels[payment.method]}{payment.reference ? ` · ${payment.reference}` : ''}
                                                </p>
                                            </TD>
                                            <TD className="hidden sm:table-cell">{paymentMethodLabels[payment.method]}</TD>
                                            <TD className="hidden text-slate-500 md:table-cell">{payment.reference ?? '—'}</TD>
                                            <TD align="right" className="whitespace-nowrap tabular-nums font-semibold text-emerald-700">{formatCOP(payment.amount)}</TD>
                                            <TD align="right">
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingAction({ type: 'deletePayment', paymentId: payment.id, amount: payment.amount })}
                                                    aria-label="Eliminar pago"
                                                    title="Eliminar pago"
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 pointer-coarse:h-11 pointer-coarse:w-11"
                                                >
                                                    <HiOutlineTrash className="h-5 w-5" />
                                                </button>
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        ) : (
                            <EmptyState
                                icon={<HiOutlineCreditCard />}
                                title="Sin pagos registrados"
                                description={canPay ? "Registra un abono o el pago total con el formulario." : undefined}
                            />
                        )}
                    </Panel>
                </div>

                {/* New payment */}
                {canPay && (
                    <form onSubmit={handleSubmit(onAddPayment)} noValidate className="xl:sticky xl:top-6 xl:self-start">
                        <Panel
                            title="Registrar abono o pago"
                            description={`Saldo pendiente: ${formatCOP(balance)}`}
                            footer={
                                <Button type="submit" loading={isSubmitting} fullWidth icon={<HiOutlineCheckCircle className="h-5 w-5" />}>
                                    Registrar pago
                                </Button>
                            }
                        >
                            <div className="space-y-5">
                                <Field
                                    label="Monto"
                                    required
                                    error={errors.amount && `Ingresa un monto entre $ 1 y ${formatCOP(balance)}`}
                                    hint="Si es menor al saldo queda registrado como abono"
                                >
                                    <Controller
                                        name="amount"
                                        control={control}
                                        rules={{
                                            required: true,
                                            validate: (value) => parseInt(value) > 0 && parseInt(value) <= balance
                                        }}
                                        render={({ field }) => (
                                            <MoneyInput
                                                value={field.value ?? ''}
                                                onValueChange={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="$ 0"
                                                error={errors.amount != undefined}
                                            />
                                        )}
                                    />
                                </Field>
                                <Field label="Método de pago" required>
                                    <Segmented
                                        label="Método de pago"
                                        value={method}
                                        onChange={setMethod}
                                        className="w-full [&>button]:flex-1 [&>button]:justify-center"
                                        options={Object.entries(paymentMethodLabels).map(([value, label]) => ({ value: value as PaymentMethod, label }))}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">
                                    <Field label="Fecha">
                                        <DatePicker value={date} onValueChange={setDate} locale={es} enableClear={false} />
                                    </Field>
                                    <Field label="Referencia" htmlFor="reference">
                                        <TextInput id="reference" {...register('reference')} placeholder="N° de transferencia, recibo..." />
                                    </Field>
                                </div>
                            </div>
                        </Panel>
                    </form>
                )}
            </div>

            <ConfirmDialog
                open={pendingAction !== null}
                onClose={() => !busy && setPendingAction(null)}
                onConfirm={confirmPendingAction}
                loading={busy}
                title={pendingAction?.type === 'void' ? `¿Anular la factura #${invoice.number}?` : '¿Eliminar este pago?'}
                description={pendingAction?.type === 'void'
                    ? 'La factura dejará de sumar a la cartera del cliente y no podrá recibir pagos. Esta acción no se puede deshacer.'
                    : pendingAction?.type === 'deletePayment'
                        ? `Se eliminará el pago de ${formatCOP(pendingAction.amount)} y el saldo de la factura aumentará en ese valor.`
                        : undefined}
                confirmLabel={pendingAction?.type === 'void' ? 'Anular factura' : 'Eliminar pago'}
            />
        </div>
    )
}
