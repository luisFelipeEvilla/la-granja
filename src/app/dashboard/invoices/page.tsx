"use client";
import { Provider } from "@prisma/client";
import { DateRangePicker, DateRangePickerValue, SearchSelect, SearchSelectItem } from "@tremor/react";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { HiOutlineBanknotes, HiOutlineCalculator, HiOutlineCalendarDays, HiOutlineChartBar, HiOutlineTag } from "react-icons/hi2";
import { ProviderWithProducts } from "@/types/Provider";
import { formatCOP } from "@/app/utils/clientInvoice";
import MoneyInput from "@/components/inputs/MoneyInput";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { dateRangePresets } from "@/components/dashboard/datePresets";

const InvoicePDF = dynamic(() => import("../../../components/pdfs/invoice"), {
    ssr: false
});

type Errors = { provider?: string, price?: string, dates?: string };

const formatLiters = (value: number) => `${new Intl.NumberFormat('es-CO').format(value)} L`;

// deliveries are stored at UTC midnight of their day
const formatDay = (date: Date | string) =>
    new Date(date).toLocaleDateString('es-CO', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

export default function Payouts() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>(() => {
        const now = new Date();
        return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now, selectValue: 'month' };
    });
    const [price, setPrice] = useState<number>(0);
    const [providerSelected, setProviderSelected] = useState<string>('');
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(false);
    const [providerWithProducts, setProviderWithProducts] = useState<ProviderWithProducts>();

    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);
            })
    }, [])

    // a new provider or period needs a new calculation
    useEffect(() => setProviderWithProducts(undefined), [providerSelected, dates]);

    const handleGenerateInvoice = async (e: any) => {
        e.preventDefault();

        const newErrors: Errors = {
            provider: providerSelected ? undefined : 'Selecciona un proveedor',
            price: price ? undefined : 'Ingresa el precio por litro',
            dates: dates.from ? undefined : 'Selecciona el período',
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return toast.error('Completa los datos de la liquidación');

        const startDate = new Date(dates.from!).toISOString().split('T')[0];
        const endDate = new Date(dates.to ?? dates.from!).toISOString().split('T')[0];

        setLoading(true);
        try {
            const res = await fetch(`/api/providers/${providerSelected}?startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();
            if (!res.ok || !data.id) throw new Error();
            setProviderWithProducts(data);
        } catch {
            toast.error('No se pudo calcular la liquidación');
        } finally {
            setLoading(false);
        }
    }

    const deliveries = providerWithProducts?.products ?? [];
    const totalLiters = deliveries.reduce((acc, product) => acc + product.quantity, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Liquidaciones"
                description="Calcula cuánto pagarle a un proveedor por la leche entregada en un período"
            />

            <Panel title="Datos de la liquidación">
                <form className="space-y-5" onSubmit={handleGenerateInvoice} noValidate>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Field label="Proveedor" required error={errors.provider}>
                            <SearchSelect
                                placeholder="Buscar proveedor"
                                value={providerSelected}
                                onValueChange={(value) => { setProviderSelected(value); setErrors({ ...errors, provider: undefined }); }}
                                error={!!errors.provider}
                                enableClear={false}
                            >
                                {providers.map((provider) =>
                                    <SearchSelectItem value={provider.id} key={provider.id}>
                                        {`${provider.firstName} ${provider.lastName}`}
                                    </SearchSelectItem>
                                )}
                            </SearchSelect>
                        </Field>

                        <Field label="Precio por litro" required error={errors.price} hint="Valor que se paga por cada litro">
                            <MoneyInput
                                value={price ? String(price) : ''}
                                onValueChange={(digits) => { setPrice(parseInt(digits) || 0); setErrors({ ...errors, price: undefined }); }}
                                placeholder="$ 0"
                                error={!!errors.price}
                            />
                        </Field>
                    </div>

                    <Field label="Período" required error={errors.dates}>
                        <DateRangePicker
                            value={dates}
                            onValueChange={(value) => { setDates(value); setErrors({ ...errors, dates: undefined }); }}
                            locale={es}
                            selectPlaceholder="Rango"
                            placeholder="Seleccionar fechas"
                            className="w-full max-w-none md:max-w-xl"
                        >
                            {dateRangePresets()}
                        </DateRangePicker>
                    </Field>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" loading={loading} icon={<HiOutlineCalculator className="h-5 w-5" />}>
                            Calcular liquidación
                        </Button>
                    </div>
                </form>
            </Panel>

            {providerWithProducts && (
                <>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard label="Litros entregados" value={formatLiters(totalLiters)} icon={<HiOutlineChartBar />} tone="blue" />
                        <StatCard label="Días con entrega" value={deliveries.length} icon={<HiOutlineCalendarDays />} tone="violet" />
                        <StatCard label="Precio por litro" value={formatCOP(price)} icon={<HiOutlineTag />} tone="amber" />
                        <StatCard label="Total a pagar" value={formatCOP(totalLiters * price)} icon={<HiOutlineBanknotes />} tone="emerald" />
                    </div>

                    <Panel
                        flush
                        title={`${providerWithProducts.firstName} ${providerWithProducts.lastName}`}
                        description="Entregas del período"
                        actions={deliveries.length > 0 && <InvoicePDF price={price} provider={providerWithProducts} />}
                    >
                        {deliveries.length > 0 ? (
                            <Table>
                                <THead>
                                    <TH>Fecha</TH>
                                    <TH align="right">Litros</TH>
                                    <TH align="right" className="hidden sm:table-cell">Precio</TH>
                                    <TH align="right">Valor</TH>
                                </THead>
                                <TBody>
                                    {deliveries.map((product) => (
                                        <TR key={product.id}>
                                            <TD className="first-letter:uppercase">{formatDay(product.createdAt)}</TD>
                                            <TD align="right" className="tabular-nums">{formatLiters(product.quantity)}</TD>
                                            <TD align="right" className="hidden sm:table-cell tabular-nums text-slate-500">{formatCOP(price)}</TD>
                                            <TD align="right" className="tabular-nums font-medium text-slate-900">{formatCOP(product.quantity * price)}</TD>
                                        </TR>
                                    ))}
                                    <tr className="bg-slate-50 font-semibold text-slate-900">
                                        <TD>Total</TD>
                                        <TD align="right" className="tabular-nums">{formatLiters(totalLiters)}</TD>
                                        <TD className="hidden sm:table-cell" />
                                        <TD align="right" className="tabular-nums">{formatCOP(totalLiters * price)}</TD>
                                    </tr>
                                </TBody>
                            </Table>
                        ) : (
                            <EmptyState icon={<HiOutlineCalendarDays />} title="Sin entregas en el período" description="Este proveedor no registró litros entre las fechas elegidas." />
                        )}
                    </Panel>
                </>
            )}
        </div>
    )
}
