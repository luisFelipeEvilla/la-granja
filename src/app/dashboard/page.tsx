"use client"
import { Card, Title, Text, Metric, BarChart, DateRangePicker, DateRangePickerValue, MultiSelectItem, MultiSelect, DonutChart, LineChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";
import { es } from "date-fns/locale";
import axios from "axios";
import useMediaQuery from "@/hooks/useMediaQuery";

export default function Providers() {
    const [providers, setProviders] = useState<ProviderWithProducts[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);

    const [milkLogs, setMilkLogs] = useState<any[]>([]);
    const [milkLogsByDate, setMilkLogsByDate] = useState<any[]>([]);
  
    const [average, setAverage] = useState(0);

    const [productsLogs, setProductsLogs] = useState<any[]>([]);
    const [productsLogsByDate, setProductsLogsByDate] = useState<any[]>([]);
    const [averageByProduct, setAverageByProduct] = useState(0);

    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date()
    });

    // En móvil y tablet los nombres de proveedores no caben en el eje X,
    // así que el gráfico de barras se muestra en horizontal.
    const isCompact = useMediaQuery("(max-width: 1023px)");
    
    useEffect(() => {
        fetchData();
    }, [dates])

    async function fetchData() {
        const startDate = dates.from?.toISOString().slice(0, 10);
        const endDate = dates.to?.toISOString().slice(0, 10);

        const milksLogs = await axios.get(`/api/providers?startDate=${startDate}&endDate=${endDate}`);

        const productsLogs = await axios.get(`/api/productLog?startDate=${startDate}&endDate=${endDate}`);

        const providers = milksLogs.data;
        const products = productsLogs.data;

        setProviders(providers);
        setProductsLogs(products);
    }

    useEffect(() => {
        handleFilterProvider(providers.map(provider => provider.id));
        updateMilkLogs(providers);
    }, [providers])

    useEffect(() => {
        getTotalProductionByDate(productsLogs);
        getAverageByProduct(productsLogs);
    }, [productsLogs])

    const updateMilkLogs = (providers: ProviderWithProducts[]) => {
        const aux = providers.map((provider: ProviderWithProducts) => {
            const cantidad = provider.products.reduce((acc, product) => acc + product.quantity, 0);
            return { provider: `${provider.firstName} ${provider.lastName}`, Cantidad: cantidad }
        });

        setMilkLogs(aux);

        // @ts-ignore
        const numberOfDays = (dates.to?.getTime() - dates.from?.getTime()) / (1000 * 3600 * 24) + 1;

        const average = aux.reduce((acc, product) => acc + product.Cantidad, 0) / numberOfDays;
        setAverage(average);
        getTotalMilkByDate(providers);
    }

    const handleFilterProvider = (id: string[]) => {
        const filtered = providers.filter(provider => id.includes(provider.id));
        setFilteredProviders(filtered);
        updateMilkLogs(filtered);
    }

    const getTotalMilkByDate = (providers: ProviderWithProducts[]) => {
        const totalByDates = [];
        // @ts-ignore
        const numberOfDays = (dates.to?.getTime() - dates.from?.getTime()) / (1000 * 3600 * 24) + 1;

        for (let i = 0; i < numberOfDays; i++) {
            // @ts-ignore
            const date = new Date(dates.from?.getTime() + i * 1000 * 3600 * 24);
            const dateString = date.toISOString().slice(0, 10);

            const total = providers.map(provider => {
                const product = provider.products.find(product => {
                    const productDate = new Date(product.createdAt).toISOString().slice(0, 10);
                    return productDate  === dateString
                });
                return product ? product.quantity : 0;
           })

           totalByDates.push({
                "Fecha": dateString,
                "Cantidad": total.reduce((acc, quantity) => acc + quantity, 0) 
           })
        }

        setMilkLogsByDate(totalByDates);
    }

    const getTotalProductionByDate = (products: any[]) => {
        const totalByDates = [];
        // @ts-ignore
        const numberOfDays = (dates.to?.getTime() - dates.from?.getTime()) / (1000 * 3600 * 24) + 1;

        for (let i = 0; i < numberOfDays; i++) {
            // @ts-ignore
            const date = new Date(dates.from?.getTime() + i * 1000 * 3600 * 24);
            const dateString = date.toISOString().slice(0, 10);

            const total = products.map(product => {
                const productDate = new Date(product.createdAt).toISOString().slice(0, 10);
                return productDate  === dateString ? product.quantity : 0;
           })

           totalByDates.push({
                "Fecha": dateString,
                "Cantidad": total.reduce((acc, quantity) => acc + quantity, 0) 
           })
        }

        setProductsLogsByDate(totalByDates);
    }

    function getAverageByProduct(products: any[]) {

        const average = products.reduce((acc, product) => acc + product.Cantidad, 0) / products.length;
        setAverageByProduct(average);
    }

    return (
        <div className="w-full space-y-6">
            {/* Filters Section */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <DateRangePicker
                        value={dates}
                        locale={es}
                        onValueChange={setDates}
                        selectPlaceholder="Fechas"
                        className="w-full sm:w-auto sm:min-w-[280px]"
                    />
                    <MultiSelect
                        placeholder="Seleccionar proveedor"
                        className="w-full sm:w-auto sm:min-w-[280px]"
                        value={filteredProviders.map(provider => provider.id)}
                        onValueChange={e => handleFilterProvider(e)}
                    >
                        {providers.map((provider) => (
                            <MultiSelectItem value={provider.id} key={provider.id}>
                                {provider.firstName} {provider.lastName}
                            </MultiSelectItem>
                        ))}
                    </MultiSelect>
                </div>
            </div>


            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="p-4" decoration="top" decorationColor="green">
                    <Text className="text-sm font-medium text-gray-600">Proveedores activos</Text>
                    <Metric className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">
                        {filteredProviders.length}
                    </Metric>
                </Card>

                <Card className="p-4" decoration="top" decorationColor="blue">
                    <Text className="text-sm font-medium text-gray-600">Litros de leche Recogidos</Text>
                    <Metric className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">
                        {milkLogs.reduce((acc, product) => acc + product.Cantidad, 0)}
                    </Metric>
                </Card>

                <Card className="p-4 sm:col-span-2 lg:col-span-1" decoration="top" decorationColor="purple">
                    <Text className="text-sm font-medium text-gray-600">Promedio diario</Text>
                    <Metric className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">
                        {new Intl.NumberFormat('es-co', { maximumFractionDigits: 0}).format(average)}
                    </Metric>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="space-y-6 sm:space-y-8">
                {/* Leche por proveedor */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <Title className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Litros de Leche por proveedor</Title>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <Card className="xl:col-span-2 p-2 sm:p-4">
                            <BarChart
                                className="w-full lg:h-80"
                                style={isCompact ? { height: Math.max(240, milkLogs.length * 28) } : undefined}
                                layout={isCompact ? "vertical" : "horizontal"}
                                yAxisWidth={isCompact ? 120 : 56}
                                data={milkLogs}
                                index="provider"
                                categories={["Cantidad"]}
                                colors={["blue"]}
                            />
                        </Card>

                        <Card className="p-4 flex items-center justify-center">
                            <div className="w-full max-w-xs">
                                <DonutChart
                                    className="h-60 w-full"
                                    data={milkLogs}
                                    index="provider"
                                    category="Cantidad"
                                    colors={["blue", "green", "red", "yellow", "purple", "pink", "orange", "indigo", "teal", "cyan"]}
                                />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Leche por día */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <Title className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Litros de Leche por día</Title>
                    <Card className="p-2 sm:p-4">
                        <LineChart
                            className="h-60 sm:h-80 w-full"
                            data={milkLogsByDate}
                            index="Fecha"
                            categories={["Cantidad"]}
                            colors={["blue"]}
                        />
                    </Card>
                </div>

                {/* Promedio por producto */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <Title className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Producción por día</Title>
                    <Card className="p-2 sm:p-4">
                        <LineChart
                            className="h-60 sm:h-80 w-full"
                            data={productsLogsByDate}
                            index="Fecha"
                            categories={["Cantidad"]}
                            colors={["purple"]}
                        />
                    </Card>
                </div>
            </div>
        </div>
    )
}