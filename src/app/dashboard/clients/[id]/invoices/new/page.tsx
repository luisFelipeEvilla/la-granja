"use client";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import MoneyInput from "@/components/inputs/MoneyInput";
import { formatCOP, toDateString } from "@/app/utils/clientInvoice";
import { Client, Product } from "@prisma/client";
import { DatePicker, Select, SelectItem, Text, TextInput, Textarea, Title } from "@tremor/react";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";
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

export default function NewInvoice({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<Client>();
    const [products, setProducts] = useState<Product[]>([]);
    const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);
    const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
        });
        fetch('/api/products').then(async (res) => {
            if (res.ok) setProducts(await res.json());
        });
    }, [params.id]);

    const updateLine = (key: number, changes: Partial<Line>) =>
        setLines(lines.map((line) => line.key === key ? { ...line, ...changes } : line));

    const removeLine = (key: number) => setLines(lines.filter((line) => line.key !== key));

    const total = lines.reduce((acc, line) => acc + getLineTotal(line), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const invalid = lines.find((line) => !line.productId || getLineTotal(line) === 0);
        if (lines.length === 0 || invalid) {
            return toast.error('Cada línea necesita producto, cantidad y precio');
        }

        setSaving(true);
        const res = await fetch(`/api/clients/${params.id}/invoices`, {
            method: 'POST',
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

        if (!res.ok) return toast.error(json.message ?? 'Error al crear la factura');

        toast.success(`Factura #${json.number} creada`);
        window.location.href = `/dashboard/clients/${params.id}/invoices/${json.id}`;
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Nueva factura de venta</Title>
                        <Text className="mt-1">{client?.name}</Text>
                    </div>
                    <a
                        href={`/dashboard/clients/${params.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                    >
                        Volver
                    </a>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Products */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <Title className="text-lg font-semibold text-gray-900">Productos</Title>
                    </div>

                    {/* column titles, only where lines are laid out as a row */}
                    <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_7rem_9rem_8rem_3rem] gap-3 px-6 pt-4 text-sm font-medium text-gray-700">
                        <span>Producto</span>
                        <span>Cantidad</span>
                        <span>Precio unitario</span>
                        <span className="text-right">Total</span>
                        <span />
                    </div>

                    <ul className="divide-y divide-gray-200 lg:divide-y-0">
                        {lines.map((line, index) => {
                            const product = products.find((product) => product.id === line.productId);

                            return (
                                <li
                                    key={line.key}
                                    className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_3rem] lg:grid-cols-[minmax(0,1fr)_7rem_9rem_8rem_3rem] gap-3 items-end lg:items-center p-4 sm:px-6 lg:py-2"
                                >
                                    <div className="col-span-2 md:col-span-4 lg:col-span-1 min-w-0 space-y-1">
                                        <label className="lg:hidden text-sm font-medium text-gray-700">Producto {index + 1}</label>
                                        <Select
                                            value={line.productId}
                                            onValueChange={(productId) => updateLine(line.key, { productId })}
                                            placeholder="Seleccionar producto"
                                            enableClear={false}
                                        >
                                            {products.map((product) =>
                                                <SelectItem value={product.id} key={product.id}>
                                                    {product.name} ({product.unit})
                                                </SelectItem>
                                            )}
                                        </Select>
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <label className="lg:hidden text-sm font-medium text-gray-700">Cantidad {product && `(${product.unit})`}</label>
                                        <TextInput
                                            value={line.quantity}
                                            onValueChange={(quantity) => updateLine(line.key, { quantity })}
                                            placeholder={product ? `0 ${product.unit}` : '0'}
                                            inputMode="decimal"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <label className="lg:hidden text-sm font-medium text-gray-700">Precio unitario</label>
                                        <MoneyInput
                                            value={line.unitPrice}
                                            onValueChange={(unitPrice) => updateLine(line.key, { unitPrice })}
                                            placeholder="$ 0"
                                        />
                                    </div>
                                    <div className="min-h-[44px] flex items-center md:justify-end font-medium text-gray-900">
                                        <span className="lg:hidden text-sm text-gray-500 mr-2">Total</span>
                                        {formatCOP(getLineTotal(line))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeLine(line.key)}
                                            disabled={lines.length === 1}
                                            aria-label="Quitar producto"
                                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent"
                                        >
                                            <BiTrash className="text-xl" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="p-4 sm:px-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setLines([...lines, emptyLine()])}
                            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                        >
                            + Agregar producto
                        </button>
                        <div className="text-right">
                            <Text className="text-sm text-gray-600">Total factura</Text>
                            <p className="text-2xl font-bold text-gray-900">{formatCOP(total)}</p>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Fecha de emisión</label>
                            <DatePicker value={issueDate} onValueChange={setIssueDate} locale={es} enableClear={false} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Notas</label>
                            <Textarea value={notes} onValueChange={setNotes} placeholder="Notas adicionales" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <a
                        href={`/dashboard/clients/${params.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                    >
                        Cancelar
                    </a>
                    <PrimaryButton text={saving ? "Guardando..." : "Crear factura"} disabled={saving} />
                </div>
            </form>
        </div>
    )
}
