"use client";
import { useEffect, useState } from "react";
import { MilkRouteLog, Provider } from "@prisma/client";
import { MilkRouteLogWithProvider } from "@/types/Product";
import { toast } from "react-hot-toast";
import { HiOutlineBeaker } from "react-icons/hi2";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchInput from "@/components/ui/SearchInput";
import StatCard from "@/components/ui/StatCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import MilkSheetList, { SheetProgress } from "@/components/dashboard/MilkSheetList";

const formatLiters = (value: number) => `${new Intl.NumberFormat("es-CO").format(value)} L`;

export default function ProductionPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [sheet, setSheet] = useState<MilkRouteLogWithProvider[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();

                const activeProviders = data.filter((provider: Provider) => provider.active);
                setProviders(activeProviders);
                setSheet(activeProviders.map((provider: Provider) => ({ providerId: provider.id, quantity: 0 })));
                setLoaded(true);
            })
    }, [])

    useEffect(() => {
        if (providers.length > 0) fetchSheet();
    }, [date, providers])

    const fetchSheet = async () => {
        const res = await fetch(`/api/sheets?date=${date.toISOString().split('T')[0]}`);
        const products = await res.json();

        // update sheet with products
        setSheet((current) => current.map((product) => {
            const newProduct = products.find((p: MilkRouteLog) => p.providerId === product.providerId);
            return { ...product, quantity: newProduct ? newProduct.quantity : 0 };
        }));
    }

    const handleDateChange = (e: any) => {
        if (!e.target.value) return;
        setDate(new Date(e.target.value));
    }

    const handleQuantityChange = (id: string, quantity: number) => {
        setSheet((current) => current.map((product) => product.providerId === id ? { ...product, quantity } : product));
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);

        //  remove time zone from date
        const aux = date.toISOString().split('T')[0];

        const res = await fetch('/api/sheets', {
            method: 'POST',
            body: JSON.stringify({
                date: new Date(aux),
                products: sheet
            })
        });
        setSaving(false);

        if (!res.ok) return toast.error('Error al guardar la planilla');
        toast.success('Planilla guardada con éxito');
    }

    if (!loaded) return <PageSkeleton stats={2} rows={8} />;

    const rows = sheet.map((product) => {
        const provider = providers.find((provider) => provider.id === product.providerId);
        return { id: product.providerId, name: `${provider?.firstName ?? ""} ${provider?.lastName ?? ""}`.trim(), quantity: product.quantity };
    });
    const total = sheet.reduce((acc, product) => acc + product.quantity, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Producción diaria"
                description="Registro diario de litros por proveedor"
                actions={
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        Fecha
                        <input
                            type="date"
                            value={date.toISOString().split('T')[0]}
                            onChange={handleDateChange}
                            className="h-11 rounded-lg border-0 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </label>
                }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard label="Total del día" value={formatLiters(total)} icon={<HiOutlineBeaker />} tone="emerald" />
                <SheetProgress rows={rows} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Panel
                    flush
                    title="Proveedores"
                    description="Toca un campo y usa “Siguiente” en el teclado para pasar al próximo proveedor"
                    actions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar proveedor" className="w-full sm:w-64" />}
                >
                    <MilkSheetList rows={rows} onChange={handleQuantityChange} search={search} />
                </Panel>

                <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white px-4 py-3 safe-bottom sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
                            <p className="text-xl font-bold tabular-nums text-slate-900">{formatLiters(total)}</p>
                        </div>
                        <Button type="submit" size="lg" loading={saving}>
                            {saving ? "Guardando..." : "Guardar planilla"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
