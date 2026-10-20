"use client";
import MoneyInput from "@/components/inputs/MoneyInput";
import Button, { ButtonLink } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { formatCOP, toDateString } from "@/app/utils/clientInvoice";
import { InvoiceWithClient } from "@/types/Client";
import { Client, Product } from "@prisma/client";
import { Select, SelectItem, Textarea } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/form/DatePicker";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import toast from "react-hot-toast";

type Line = { key: number, productId: string, quantity: string, unitPrice: string };

let nextKey = 0;
const emptyLine = (): Line => ({ key: nextKey++, productId: '', quantity: '', unitPrice: '' });

// accepts "2,5" as well as "2.5" (decimal comma on Spanish keyboards)
const parseQuantity = (value: string) => parseFloat(value.replace(',', '.'));

const getLineTotal = (line: Line) => {
    const quantity = parseQuantity(line.quantity);
    const unitPrice = parseInt(line.unitPrice);
    return quantity > 0 && unitPrice > 0 ? Math.round(quantity * unitPrice) : 0;
};

const toLines = (invoice?: InvoiceWithClient): Line[] => invoice
    ? invoice.items.map((item) => ({
        key: nextKey++,
        productId: item.productId,
        quantity: String(item.quantity).replace('.', ','),
        unitPrice: String(item.unitPrice)
    }))
    : [emptyLine()];

type Props = {
    clientId: string,
    client?: Client,
    invoice?: InvoiceWithClient,
    // when the page renders its own header (e.g. the sales section, where the client is picked first)
    hideHeader?: boolean,
    // where "Cancelar" goes, defaults to the client or invoice page
    cancelHref?: string
};

// creates a sales invoice, or edits one when `invoice` is given
export default function InvoiceForm({ clientId, client, invoice, hideHeader = false, cancelHref }: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [lines, setLines] = useState<Line[]>(() => toLines(invoice));
    // stored dates are calendar days at UTC midnight: rebuild them as local dates for the picker
    const [issueDate, setIssueDate] = useState<Date | undefined>(() => {
        if (!invoice) return new Date();
        const [year, month, day] = new Date(invoice.issueDate).toISOString().slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day);
    });
    const [notes, setNotes] = useState(invoice?.notes ?? '');
    const [saving, setSaving] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        fetch('/api/products').then(async (res) => {
            if (res.ok) setProducts(await res.json());
        });
    }, []);

    const backHref = invoice
        ? `/dashboard/clients/${clientId}/invoices/${invoice.id}`
        : `/dashboard/clients/${clientId}`;

    const updateLine = (key: number, changes: Partial<Line>) =>
        setLines(lines.map((line) => line.key === key ? { ...line, ...changes } : line));

    const removeLine = (key: number) => setLines(lines.filter((line) => line.key !== key));

    const total = lines.reduce((acc, line) => acc + getLineTotal(line), 0);
    const belowPaid = invoice !== undefined && total < invoice.paidAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const invalid = lines.find((line) => !line.productId || getLineTotal(line) === 0);
        if (lines.length === 0 || invalid) {
            setShowErrors(true);
            return toast.error('Cada línea necesita producto, cantidad y precio');
        }

        if (invoice && total < invoice.paidAmount) {
            return toast.error(`El total no puede ser menor a lo ya pagado (${formatCOP(invoice.paidAmount)})`);
        }

        setSaving(true);
        const res = await fetch(invoice ? `/api/client-invoices/${invoice.id}` : `/api/clients/${clientId}/invoices`, {
            method: invoice ? 'PATCH' : 'POST',
            body: JSON.stringify({
                items: lines.map((line) => ({
                    productId: line.productId,
                    quantity: parseQuantity(line.quantity),
                    unitPrice: parseInt(line.unitPrice)
                })),
                issueDate: issueDate && toDateString(issueDate),
                notes
            })
        });
        const json = await res.json();
        setSaving(false);

        if (!res.ok) return toast.error(json.message ?? 'Error al guardar la factura');

        toast.success(invoice ? `Factura #${json.number} actualizada` : `Factura #${json.number} creada`);
        window.location.href = `/dashboard/clients/${clientId}/invoices/${json.id}`;
    }

    const submitLabel = invoice ? "Guardar cambios" : "Crear factura";

    return (
        <div className="space-y-6">
            {!hideHeader && <PageHeader
                back={{ href: backHref, label: invoice ? `Factura #${invoice.number}` : client?.name ?? 'Cliente' }}
                title={invoice ? `Editar factura #${invoice.number}` : 'Nueva factura de venta'}
                description={client?.name}
            />}

            {invoice && invoice.paidAmount > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>Esta factura tiene pagos por <strong>{formatCOP(invoice.paidAmount)}</strong>: el nuevo total no puede ser menor.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-6">
                    <Panel title="Productos" description="Elige los productos vendidos, la cantidad y el precio de esta venta.">
                        <ol className="space-y-3">
                            {lines.map((line, index) => {
                                const product = products.find((product) => product.id === line.productId);
                                const lineTotal = getLineTotal(line);
                                const missingProduct = showErrors && !line.productId;
                                const missingAmounts = showErrors && line.productId && lineTotal === 0;

                                return (
                                    <li
                                        key={line.key}
                                        className={`rounded-xl border bg-white p-4 transition-colors ${missingProduct || missingAmounts ? 'border-red-300' : 'border-slate-200'}`}
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
                                                {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeLine(line.key)}
                                                disabled={lines.length === 1}
                                                aria-label={`Quitar producto ${index + 1}`}
                                                title="Quitar producto"
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30 pointer-coarse:h-11 pointer-coarse:w-11"
                                            >
                                                <HiOutlineTrash className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-[minmax(0,1fr)_8rem_10rem]">
                                            <Field label="Producto" className="col-span-2 lg:col-span-1" error={missingProduct && 'Elige un producto'}>
                                                <Select
                                                    value={line.productId}
                                                    onValueChange={(productId) => updateLine(line.key, { productId })}
                                                    placeholder="Seleccionar producto"
                                                    enableClear={false}
                                                    error={missingProduct || undefined}
                                                >
                                                    {products.map((product) =>
                                                        <SelectItem value={product.id} key={product.id}>
                                                            {product.name} ({product.unit})
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                            </Field>
                                            <Field label="Cantidad" htmlFor={`quantity-${line.key}`}>
                                                <div className="relative">
                                                    <input
                                                        id={`quantity-${line.key}`}
                                                        value={line.quantity}
                                                        onChange={(e) => updateLine(line.key, { quantity: e.target.value.replace(/[^\d.,]/g, '') })}
                                                        onFocus={(e) => e.target.select()}
                                                        inputMode="decimal"
                                                        placeholder="0"
                                                        className="h-[38px] w-full rounded-lg border-0 bg-white pl-3 pr-12 text-sm tabular-nums text-slate-900 shadow-xs ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                                    />
                                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                                                        {product?.unit ?? ''}
                                                    </span>
                                                </div>
                                            </Field>
                                            <Field label="Precio unitario">
                                                <MoneyInput
                                                    value={line.unitPrice}
                                                    onValueChange={(unitPrice) => updateLine(line.key, { unitPrice })}
                                                    placeholder="$ 0"
                                                />
                                            </Field>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
                                            <span className={missingAmounts ? 'text-red-600' : 'text-slate-500'}>
                                                {missingAmounts ? 'Ingresa cantidad y precio' : 'Subtotal'}
                                            </span>
                                            <span className="font-semibold tabular-nums text-slate-900">{formatCOP(lineTotal)}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        <button
                            type="button"
                            onClick={() => setLines([...lines, emptyLine()])}
                            className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700"
                        >
                            <HiOutlinePlus className="h-5 w-5" />
                            Agregar producto
                        </button>
                    </Panel>

                    <Panel title="Detalles">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <Field
                                label="Fecha de emisión"
                                hint={issueDate && toDateString(issueDate) > toDateString()
                                    ? <span className="text-amber-700">La fecha es posterior a hoy. Revísala si no es intencional.</span>
                                    : undefined}
                            >
                                <DatePicker value={issueDate} onValueChange={setIssueDate} locale={es} enableClear={false} />
                            </Field>
                            <Field label="Notas" hint="Aparecen en la factura y en el PDF">
                                <Textarea value={notes} onValueChange={setNotes} placeholder="Ej: Entrega en bodega principal" rows={3} />
                            </Field>
                        </div>
                    </Panel>
                </div>

                {/* Summary: side card on wide screens, bottom bar elsewhere */}
                <aside className="hidden xl:block">
                    <div className="sticky top-6">
                        <Panel title="Resumen">
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <dt>Productos</dt>
                                    <dd className="tabular-nums">{lines.length}</dd>
                                </div>
                                {invoice && invoice.paidAmount > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <dt>Ya pagado</dt>
                                        <dd className="tabular-nums">{formatCOP(invoice.paidAmount)}</dd>
                                    </div>
                                )}
                                <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                                    <dt className="font-semibold text-slate-900">Total</dt>
                                    <dd className={`text-2xl font-bold tabular-nums ${belowPaid ? 'text-red-600' : 'text-slate-900'}`}>{formatCOP(total)}</dd>
                                </div>
                            </dl>
                            <div className="mt-6 space-y-2">
                                <Button type="submit" loading={saving} fullWidth size="lg" icon={<HiOutlineCheckCircle className="h-5 w-5" />}>
                                    {submitLabel}
                                </Button>
                                <ButtonLink href={cancelHref ?? backHref} variant="ghost" fullWidth>Cancelar</ButtonLink>
                            </div>
                        </Panel>
                    </div>
                </aside>

                {/* sticks to the bottom of the page content, so it lines up whether the sidebar is shown or hidden */}
                <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white safe-bottom sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg xl:hidden">
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Total factura</p>
                            <p className={`text-xl font-bold tabular-nums ${belowPaid ? 'text-red-600' : 'text-slate-900'}`}>{formatCOP(total)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ButtonLink href={cancelHref ?? backHref} variant="ghost" className="hidden sm:inline-flex">Cancelar</ButtonLink>
                            <Button type="submit" loading={saving} size="lg">{submitLabel}</Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
