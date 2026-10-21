"use client";
import { allocatePayment, formatCOP, formatDate, getInvoiceBalance, getPendingInvoices, paymentMethodLabels, toDateString } from "@/app/utils/clientInvoice";
import { ClientWithInvoices } from "@/types/Client";
import MoneyInput from "@/components/inputs/MoneyInput";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import Segmented from "@/components/ui/Segmented";
import { TextInput } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/form/DatePicker";
import { es } from "date-fns/locale";
import { FormEvent, useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import toast from "react-hot-toast";

type PaymentMethod = keyof typeof paymentMethodLabels;

type Props = {
    client: ClientWithInvoices,
    isOpen: boolean,
    onClose: () => void,
    onSaved: () => void
};

const toAmount = (digits: string) => parseInt(digits) || 0;

// payment against the client's total balance: proposes settling the oldest invoices first,
// and each invoice's share can be changed before saving
export default function ReceiptForm({ client, isOpen, onClose, onSaved }: Props) {
    const pendingInvoices = getPendingInvoices(client.invoices);
    const totalBalance = pendingInvoices.reduce((total, invoice) => total + getInvoiceBalance(invoice), 0);

    const [amount, setAmount] = useState('');
    // digits applied to each invoice, by invoice id
    const [allocations, setAllocations] = useState<Record<string, string>>({});
    const [method, setMethod] = useState<PaymentMethod>('EFECTIVO');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [reference, setReference] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const changeAmount = (digits: string) => {
        setAmount(digits);
        setAllocations(Object.fromEntries(
            allocatePayment(client.invoices, toAmount(digits)).map((allocation) => [allocation.invoiceId, allocation.amount ? String(allocation.amount) : ''])
        ));
    };

    const total = toAmount(amount);
    const applied = pendingInvoices.reduce((sum, invoice) => sum + toAmount(allocations[invoice.id] ?? ''), 0);
    const unassigned = total - applied;
    const amountError = total <= 0 || total > totalBalance;
    const overInvoice = pendingInvoices.some((invoice) => toAmount(allocations[invoice.id] ?? '') > getInvoiceBalance(invoice));
    const invalid = amountError || overInvoice || unassigned !== 0;

    const close = () => {
        if (saving) return;
        setAmount('');
        setAllocations({});
        setReference('');
        setSubmitted(false);
        onClose();
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (invalid) return;

        setSaving(true);
        const res = await fetch(`/api/clients/${client.id}/receipts`, {
            method: 'POST',
            body: JSON.stringify({
                amount: total,
                method,
                date: date && toDateString(date),
                reference,
                allocations: pendingInvoices
                    .map((invoice) => ({ invoiceId: invoice.id, amount: toAmount(allocations[invoice.id] ?? '') }))
                    .filter((allocation) => allocation.amount > 0)
            })
        });
        const json = await res.json();
        setSaving(false);

        if (!res.ok) return toast.error(json.message ?? 'Error al registrar el abono');

        toast.success('Abono registrado correctamente');
        onSaved();
        close();
    };

    return (
        <Modal isOpen={isOpen} onClose={close} size="2xl" scrollBehavior="inside">
            <ModalContent>
                <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <ModalHeader>
                        Registrar abono
                        <p className="mt-0.5 text-sm font-normal text-slate-500">Saldo pendiente del cliente: {formatCOP(totalBalance)}</p>
                    </ModalHeader>
                    <ModalBody className="space-y-5">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field
                                label="Monto"
                                required
                                error={submitted && amountError && `Ingresa un monto entre $ 1 y ${formatCOP(totalBalance)}`}
                            >
                                <MoneyInput value={amount} onValueChange={changeAmount} placeholder="$ 0" error={submitted && amountError} autoFocus />
                            </Field>
                            <Field label="Fecha">
                                <DatePicker value={date} onValueChange={setDate} locale={es} enableClear={false} />
                            </Field>
                        </div>
                        <Field label="Método de pago" required>
                            <Segmented
                                label="Método de pago"
                                value={method}
                                onChange={setMethod}
                                className="w-full [&>button]:flex-1 [&>button]:justify-center"
                                options={Object.entries(paymentMethodLabels).map(([value, label]) => ({ value: value as PaymentMethod, label }))}
                            />
                        </Field>
                        <Field label="Referencia" htmlFor="receipt-reference">
                            <TextInput id="receipt-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° de transferencia, recibo..." />
                        </Field>

                        <div>
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-medium text-slate-700">Aplicar a facturas</h3>
                                <span className={`text-sm tabular-nums ${unassigned === 0 ? 'text-slate-500' : 'font-medium text-red-600'}`}>
                                    {unassigned >= 0 ? `Por asignar: ${formatCOP(unassigned)}` : `Asignado de más: ${formatCOP(-unassigned)}`}
                                </span>
                            </div>
                            <p className="mb-3 text-sm text-slate-500">Se salda primero la factura más antigua. Puedes cambiar cuánto va a cada una.</p>
                            <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                                {pendingInvoices.map((invoice) => {
                                    const balance = getInvoiceBalance(invoice);
                                    const value = allocations[invoice.id] ?? '';
                                    const tooMuch = toAmount(value) > balance;

                                    return (
                                        <li key={invoice.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-900">#{invoice.number}</p>
                                                <p className="text-xs text-slate-500">{formatDate(invoice.issueDate)} · Saldo {formatCOP(balance)}</p>
                                                {tooMuch && <p className="text-xs text-red-600" role="alert">Supera el saldo de la factura</p>}
                                            </div>
                                            <div className="w-36 shrink-0">
                                                <MoneyInput
                                                    aria-label={`Monto aplicado a la factura #${invoice.number}`}
                                                    value={value}
                                                    onValueChange={(digits) => setAllocations((current) => ({ ...current, [invoice.id]: digits }))}
                                                    placeholder="$ 0"
                                                    error={tooMuch}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {submitted && !amountError && unassigned !== 0 && (
                                <p className="mt-2 text-sm text-red-600" role="alert">Lo aplicado a las facturas debe sumar el monto del abono</p>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={close} disabled={saving}>Cancelar</Button>
                        <Button type="submit" loading={saving} icon={<HiOutlineCheckCircle className="h-5 w-5" />}>
                            Registrar abono
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
