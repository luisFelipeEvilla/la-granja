"use client";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import { formatCOP, formatDate, getInvoiceBalance, getPaymentStatus, paymentMethodLabels, toDateString } from "@/app/utils/clientInvoice";
import { InvoiceWithClient } from "@/types/Client";
import {
    Card,
    DatePicker,
    Metric,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Text,
    TextInput,
    Title
} from "@tremor/react";
import { es } from "date-fns/locale";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

const ClientInvoicePDF = dynamic(() => import("@/components/pdfs/clientInvoice"), {
    ssr: false
});

type PaymentInputs = { amount: string, reference: string };

type Params = { params: { id: string, invoiceId: string } };

export default function InvoiceDetail({ params }: Params) {
    const [invoice, setInvoice] = useState<InvoiceWithClient>();
    const [method, setMethod] = useState<string>('EFECTIVO');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PaymentInputs>();

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

    const handleDeletePayment = async (paymentId: string) => {
        // first click asks for confirmation, second click deletes
        if (pendingDelete !== paymentId) return setPendingDelete(paymentId);

        setBusy(true);
        const res = await fetch(`/api/client-payments/${paymentId}`, { method: 'DELETE' });
        setBusy(false);
        setPendingDelete(null);

        if (!res.ok) return toast.error('Error al eliminar el pago');

        toast.success('Pago eliminado');
        loadInvoice();
    }

    const handleVoidInvoice = async () => {
        if (pendingDelete !== 'invoice') return setPendingDelete('invoice');

        setBusy(true);
        const res = await fetch(`/api/client-invoices/${params.invoiceId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ANULADA' })
        });
        const json = await res.json();
        setBusy(false);
        setPendingDelete(null);

        if (!res.ok) return toast.error(json.message ?? 'Error al anular la factura');

        toast.success('Factura anulada');
        loadInvoice();
    }

    if (!invoice) return <Text className="text-center text-gray-500">Cargando...</Text>;

    const balance = getInvoiceBalance(invoice);
    const canPay = invoice.status === 'ACTIVA' && balance > 0;
    const canVoid = invoice.status === 'ACTIVA' && invoice.paidAmount === 0;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Factura #{invoice.number}</Title>
                            <InvoiceStatusBadge status={getPaymentStatus(invoice)} />
                        </div>
                        <Text className="mt-1">{invoice.client.name}</Text>
                        <Text className="text-gray-500">
                            Emitida {formatDate(invoice.issueDate)}
                        </Text>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/dashboard/clients/${params.id}`}
                            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                        >
                            Volver
                        </a>
                        <ClientInvoicePDF invoice={invoice} />
                        {canVoid && (
                            <button
                                type="button"
                                onClick={handleVoidInvoice}
                                disabled={busy}
                                className="min-h-[44px] inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                {pendingDelete === 'invoice' ? '¿Confirmar anulación?' : 'Anular'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="mt-4 space-y-1">
                    <Text><span className="font-medium">Concepto:</span> {invoice.concept}</Text>
                    {invoice.notes && <Text><span className="font-medium">Notas:</span> {invoice.notes}</Text>}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4" decoration="top" decorationColor="blue">
                    <Text className="text-sm font-medium text-gray-600">Total</Text>
                    <Metric className="text-2xl font-bold text-blue-600 mt-2">{formatCOP(invoice.amount)}</Metric>
                </Card>
                <Card className="p-4" decoration="top" decorationColor="green">
                    <Text className="text-sm font-medium text-gray-600">Pagado</Text>
                    <Metric className="text-2xl font-bold text-green-600 mt-2">{formatCOP(invoice.paidAmount)}</Metric>
                </Card>
                <Card className="p-4" decoration="top" decorationColor="red">
                    <Text className="text-sm font-medium text-gray-600">Saldo</Text>
                    <Metric className="text-2xl font-bold text-red-600 mt-2">{formatCOP(balance)}</Metric>
                </Card>
            </div>

            {/* New payment */}
            {canPay && (
                <form onSubmit={handleSubmit(onAddPayment)} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <Title className="text-lg font-semibold text-gray-900">Registrar abono o pago</Title>
                    </div>
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Monto *</label>
                                <TextInput
                                    {...register('amount', {
                                        required: true,
                                        validate: (value) => parseInt(value) > 0 && parseInt(value) <= balance
                                    })}
                                    type="number"
                                    min="1"
                                    max={balance}
                                    error={errors.amount != undefined}
                                    errorMessage={errors.amount ? `Ingresa un monto entre 1 y ${formatCOP(balance)}` : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Método de pago *</label>
                                <Select value={method} onValueChange={setMethod} enableClear={false}>
                                    {Object.entries(paymentMethodLabels).map(([value, label]) =>
                                        <SelectItem value={value} key={value}>{label}</SelectItem>
                                    )}
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Fecha</label>
                                <DatePicker value={date} onValueChange={setDate} locale={es} enableClear={false} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Referencia</label>
                                <TextInput {...register('reference')} placeholder="N° de transferencia, recibo..." />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <PrimaryButton text="Registrar pago" disabled={isSubmitting} />
                        </div>
                    </div>
                </form>
            )}

            {/* Payments */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold">Pagos y abonos</Title>
                </div>
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHead>
                            <TableRow>
                                <TableCell className="whitespace-nowrap">Fecha</TableCell>
                                <TableCell className="whitespace-nowrap">Monto</TableCell>
                                <TableCell className="whitespace-nowrap hidden sm:table-cell">Método</TableCell>
                                <TableCell className="whitespace-nowrap hidden sm:table-cell">Referencia</TableCell>
                                <TableCell className="whitespace-nowrap">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoice.payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="whitespace-nowrap">{formatDate(payment.date)}</TableCell>
                                    <TableCell className="whitespace-nowrap font-medium">{formatCOP(payment.amount)}</TableCell>
                                    <TableCell className="whitespace-nowrap hidden sm:table-cell">{paymentMethodLabels[payment.method]}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{payment.reference ?? '-'}</TableCell>
                                    <TableCell>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePayment(payment.id)}
                                            disabled={busy}
                                            className="min-h-[44px] inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors duration-200"
                                        >
                                            {pendingDelete === payment.id ? '¿Confirmar?' : 'Eliminar'}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {invoice.payments.length === 0 && (
                    <div className="p-8 text-center">
                        <Text className="text-gray-500">No hay pagos registrados</Text>
                    </div>
                )}
            </div>
        </div>
    )
}
