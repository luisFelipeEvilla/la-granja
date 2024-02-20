"use client"
import { Card, Title, Text, Metric, BarChart, DateRangePicker, DateRangePickerValue, MultiSelectItem, MultiSelect, DonutChart, LineChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";
import { es } from "date-fns/locale";
import axios from "axios";

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
        <div className="grid col-span-1 w-full py-5 gap-4">
            <div className="grid md:grid-flow-col justify-start gap-12 ml-8" >
                <DateRangePicker
                    value={dates}
                    locale={es}
                    onValueChange={setDates}
                    selectPlaceholder="Fechas"
                    className="max-w-[300px]"
                />
                <MultiSelect
                    placeholder="Seleccionar proveedor"
                    className="max-w-[300px]"
                    value={filteredProviders.map(provider => provider.id)}
                    onValueChange={e => handleFilterProvider(e)}
                >
                    {
                        providers.map((provider) => (
                            <MultiSelectItem value={provider.id} key={provider.id}>{provider.firstName} {provider.lastName}</MultiSelectItem>
                        ))
                    }
                </MultiSelect>
            </div>


            <div className="flex flex-col items-center gap-8 md:flex-row md:justify-end md:mx-32">
                <Card className="w-fit" decoration="top" decorationColor="green">
                    <Text>Proveedores activos</Text>
                    <Metric>{filteredProviders.length}</Metric>
                </Card>

                <Card className="w-fit" decoration="top" decorationColor="green">
                    <Text>Litros de leche Recogidos</Text>
                    <Metric>{
                        milkLogs.reduce((acc, product) => acc + product.Cantidad, 0)
                    }</Metric>
                </Card>

                <Card className="w-fit" decoration="top" decorationColor="green">
                    <Text>Promedio de litros de leche recogidos</Text>
                    <Metric>{new Intl.NumberFormat('es-co', { maximumFractionDigits: 0}).format(average)}</Metric>
                </Card>
            </div>

            <section className="grid gap-4 justify-center ">
                <div className="grid gap-4">
                    <Title>Litros de Leche por proveedor</Title>
                    <div  className="md:w-[800px] grid md:grid-flow-col gap-4">
                        <Card className="">
                            <BarChart
                                className="md:w-[600px]"
                                data={milkLogs}
                                index="provider"
                                categories={["Cantidad"]}
                                colors={["blue"]}
                            />
                        </Card>

                        <Card className="flex items-center w-[200px]" >
                            <DonutChart
                                data={milkLogs}
                                index="provider"
                                category={"Cantidad"}
                                colors={["blue", "green", "red", "yellow", "purple", "pink", "orange", "indigo", "teal", "cyan"]}
                            />
                        </Card>
                    </div>
                </div>

                <div className="grid gap-4">
                    <Title>Litros de Leche por día</Title>
                    <div  className="md:w-[800px] grid grid-flow-col gap-4">
                        <Card className="">
                            <LineChart
                                className="md:w-[600px]"
                                data={milkLogsByDate}
                                index="Fecha"
                                categories={["Cantidad"]}
                                colors={["blue"]}
                            />
                        </Card>
                    </div>
                </div>

                <div className="grid gap-4">
                    <Title>Promedio por producto</Title>

                    <div  className="md:w-[800px] grid grid-flow-col gap-4">
                        <Card className="">
                            <LineChart
                                className="md:w-[600px]"
                                data={productsLogsByDate}
                                index="Fecha"
                                categories={["Cantidad"]}
                                colors={["blue"]}
                            />
                        </Card>
                    </div>

                </div>
            </section>

            <section>
                
           
            </section>
        </div>
    )
}