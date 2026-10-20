"use client"
import { BarChart, DateRangePicker, DateRangePickerValue, DonutChart, LineChart, MultiSelect, MultiSelectItem } from "@tremor/react";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";
import { es } from "date-fns/locale";
import axios from "axios";
import { HiOutlineBeaker, HiOutlineCalendarDays, HiOutlineChartBar, HiOutlineTruck } from "react-icons/hi2";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { dateRangePresets } from "@/components/dashboard/datePresets";

const formatLiters = (value: number) => `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value)} L`;

const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Dashboard() {
    const [providers, setProviders] = useState<ProviderWithProducts[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
    const [loaded, setLoaded] = useState(false);

    const [milkLogs, setMilkLogs] = useState<any[]>([]);
    const [milkLogsByDate, setMilkLogsByDate] = useState<any[]>([]);

    const [average, setAverage] = useState(0);

    const [productsLogs, setProductsLogs] = useState<any[]>([]);
    const [productsLogsByDate, setProductsLogsByDate] = useState<any[]>([]);

    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date(), selectValue: 'today'
    });

    useEffect(() => {
        fetchData();
    }, [dates])

    async function fetchData() {
        const startDate = dates.from?.toISOString().slice(0, 10);
        const endDate = (dates.to ?? dates.from)?.toISOString().slice(0, 10);

        const milksLogs = await axios.get(`/api/providers?startDate=${startDate}&endDate=${endDate}`);

        const productsLogs = await axios.get(`/api/productLog?startDate=${startDate}&endDate=${endDate}`);

        setProviders(milksLogs.data);
        setProductsLogs(productsLogs.data);
        setLoaded(true);
    }

    useEffect(() => {
        handleFilterProvider(providers.map(provider => provider.id));
        updateMilkLogs(providers);
    }, [providers])

    useEffect(() => {
        getTotalProductionByDate(productsLogs);
    }, [productsLogs])

    const getNumberOfDays = () => {
        const to = dates.to ?? dates.from;
        if (!dates.from || !to) return 1;
        return Math.round((to.getTime() - dates.from.getTime()) / (1000 * 3600 * 24)) + 1;
    }

    const updateMilkLogs = (providers: ProviderWithProducts[]) => {
        const aux = providers.map((provider: ProviderWithProducts) => {
            const cantidad = provider.products.reduce((acc, product) => acc + product.quantity, 0);
            return { provider: `${provider.firstName} ${provider.lastName}`, Litros: cantidad }
        });

        setMilkLogs(aux);

        const average = aux.reduce((acc, product) => acc + product.Litros, 0) / getNumberOfDays();
        setAverage(average);
        getTotalMilkByDate(providers);
    }

    const handleFilterProvider = (id: string[]) => {
        const filtered = providers.filter(provider => id.includes(provider.id));
        setFilteredProviders(filtered);
        updateMilkLogs(filtered);
    }

    const getDateRange = () => {
        const days = [];
        for (let i = 0; i < getNumberOfDays(); i++) {
            // @ts-ignore
            const date = new Date(dates.from?.getTime() + i * 1000 * 3600 * 24);
            days.push(date.toISOString().slice(0, 10));
        }
        return days;
    }

    const getTotalMilkByDate = (providers: ProviderWithProducts[]) => {
        setMilkLogsByDate(getDateRange().map((dateString) => {
            const total = providers.map(provider => {
                const product = provider.products.find(product => new Date(product.createdAt).toISOString().slice(0, 10) === dateString);
                return product ? product.quantity : 0;
            });

            return { "Fecha": dateString, "Litros": total.reduce((acc, quantity) => acc + quantity, 0) };
        }));
    }

    const getTotalProductionByDate = (products: any[]) => {
        setProductsLogsByDate(getDateRange().map((dateString) => {
            const total = products.map(product => {
                const productDate = new Date(product.createdAt).toISOString().slice(0, 10);
                return productDate === dateString ? product.quantity : 0;
            });

            return { "Fecha": dateString, "Cantidad": total.reduce((acc, quantity) => acc + quantity, 0) };
        }));
    }

    if (!loaded) return <PageSkeleton stats={3} rows={6} />;

    const totalLiters = milkLogs.reduce((acc, product) => acc + product.Litros, 0);
    const providersWithMilk = milkLogs.filter((log) => log.Litros > 0);
    const totalProduction = productsLogsByDate.reduce((acc, day) => acc + day.Cantidad, 0);
    const days = getNumberOfDays();
    const todayLabel = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const today = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

    return (
        <div className="space-y-6">
            <PageHeader
                title={getGreeting()}
                description={`Resumen de la operación · ${today}`}
            />

            {/* Filters */}
            <Panel>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-slate-700">Período</p>
                        <DateRangePicker
                            value={dates}
                            locale={es}
                            onValueChange={setDates}
                            enableClear={false}
                            selectPlaceholder="Rango"
                            className="w-full max-w-none"
                        >
                            {dateRangePresets()}
                        </DateRangePicker>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-slate-700">Proveedores</p>
                        <MultiSelect
                            placeholder="Todos los proveedores"
                            placeholderSearch="Buscar proveedor"
                            className="w-full max-w-none"
                            value={filteredProviders.length === providers.length ? [] : filteredProviders.map(provider => provider.id)}
                            onValueChange={ids => handleFilterProvider(ids.length ? ids : providers.map(provider => provider.id))}
                        >
                            {providers.map((provider) => (
                                <MultiSelectItem value={provider.id} key={provider.id}>
                                    {provider.firstName} {provider.lastName}
                                </MultiSelectItem>
                            ))}
                        </MultiSelect>
                    </div>
                </div>
            </Panel>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Proveedores" value={filteredProviders.length} icon={<HiOutlineTruck />} tone="emerald" hint={`${providersWithMilk.length} entregaron leche`} />
                <StatCard label="Litros recogidos" value={formatLiters(totalLiters)} icon={<HiOutlineChartBar />} tone="blue" hint={`En ${days} ${days === 1 ? 'día' : 'días'}`} />
                <StatCard label="Promedio diario" value={formatLiters(average)} icon={<HiOutlineCalendarDays />} tone="violet" />
                <StatCard label="Producción" value={new Intl.NumberFormat('es-CO').format(totalProduction)} icon={<HiOutlineBeaker />} tone="amber" hint="Unidades registradas" />
            </div>

            {/* Charts */}
            <div className="grid gap-6 xl:grid-cols-3">
                <Panel className="xl:col-span-2" title="Litros por proveedor" description="Leche recogida a cada proveedor en el período">
                    {totalLiters > 0 ? (
                        <BarChart
                            className="h-72 sm:h-80"
                            data={providersWithMilk}
                            index="provider"
                            categories={["Litros"]}
                            colors={["emerald"]}
                            valueFormatter={formatLiters}
                            showLegend={false}
                            yAxisWidth={64}
                        />
                    ) : <EmptyState icon={<HiOutlineChartBar />} title="Sin entregas en el período" description="Cambia las fechas o registra la planilla del día." />}
                </Panel>

                <Panel title="Participación" description="Porcentaje del total recogido">
                    {totalLiters > 0 ? (
                        <DonutChart
                            className="h-60"
                            data={providersWithMilk}
                            index="provider"
                            category="Litros"
                            valueFormatter={formatLiters}
                            colors={["emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "lime", "amber", "slate"]}
                        />
                    ) : <EmptyState icon={<HiOutlineChartBar />} title="Sin datos" />}
                </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Litros por día" description="Total recogido cada día">
                    {totalLiters > 0 ? (
                        <LineChart
                            className="h-64"
                            data={milkLogsByDate}
                            index="Fecha"
                            categories={["Litros"]}
                            colors={["emerald"]}
                            valueFormatter={formatLiters}
                            showLegend={false}
                            yAxisWidth={64}
                        />
                    ) : <EmptyState icon={<HiOutlineCalendarDays />} title="Sin datos en el período" />}
                </Panel>

                <Panel title="Producción por día" description="Unidades producidas cada día">
                    {totalProduction > 0 ? (
                        <LineChart
                            className="h-64"
                            data={productsLogsByDate}
                            index="Fecha"
                            categories={["Cantidad"]}
                            colors={["amber"]}
                            showLegend={false}
                        />
                    ) : <EmptyState icon={<HiOutlineBeaker />} title="Sin producción en el período" />}
                </Panel>
            </div>
        </div>
    )
}
