"use client"
import { Card, Title, Text, Metric, BarChart, DateRangePicker, DateRangePickerValue, MultiSelectItem, MultiSelect, DonutChart, LineChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";
import { es } from "date-fns/locale";

export default function Providers() {
    const [providers, setProviders] = useState<ProviderWithProducts[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [productsByDate, setProductsByDate] = useState<any[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date()
    });
    const [average, setAverage] = useState(0);

    useEffect(() => {
        const startDate = dates.from?.toISOString().slice(0, 10);
        const endDate = dates.to?.toISOString().slice(0, 10);

        fetch(`/api/providers?startDate=${startDate}&endDate=${endDate}`)
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);
            });
    }, [dates])

    useEffect(() => {
        handleFilterProvider(providers.map(provider => provider.id));
        updateProducts(providers);
    }, [providers])

    const updateProducts = (providers: ProviderWithProducts[]) => {
        const aux = providers.map((provider: ProviderWithProducts) => {
            const cantidad = provider.products.reduce((acc, product) => acc + product.quantity, 0);
            return { provider: `${provider.firstName} ${provider.lastName}`, Cantidad: cantidad }
        });

        setProducts(aux);

        // @ts-ignore
        const numberOfDays = (dates.to?.getTime() - dates.from?.getTime()) / (1000 * 3600 * 24) + 1;

        const average = aux.reduce((acc, product) => acc + product.Cantidad, 0) / numberOfDays;
        setAverage(average);
        getTotalProductsByDate(providers);
    }

    const handleFilterProvider = (id: string[]) => {
        const filtered = providers.filter(provider => id.includes(provider.id));
        setFilteredProviders(filtered);
        updateProducts(filtered);
    }

    const getTotalProductsByDate = (providers: ProviderWithProducts[]) => {
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

        setProductsByDate(totalByDates);
    }

    return (
        <div className="grid col-span-1 w-full py-5 gap-4">
            <div className="grid grid-flow-col justify-start gap-3 ml-8" >
                <DateRangePicker
                    value={dates}
                    locale={es}
                    onValueChange={setDates}
                    selectPlaceholder="Fechas"
                    className="max-w-[300px]"
                />
                <MultiSelect
                    placeholder="Seleccionar proveedor"
                    className="max-w-fit"
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
            <div className="flex justify-end mx-32">
                <Card className="mr-4 w-fit" decoration="top" decorationColor="green">
                    <Text>Proveedores activos</Text>
                    <Metric>{filteredProviders.length}</Metric>
                </Card>

                <Card className="w-fit mr-4" decoration="top" decorationColor="green">
                    <Text>Litros de leche Recogidos</Text>
                    <Metric>{
                        products.reduce((acc, product) => acc + product.Cantidad, 0)
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
                    <div  className="w-[800px] grid grid-flow-col gap-4">
                        <Card className="">
                            <BarChart
                                className="w-[600px]"
                                data={products}
                                index="provider"
                                categories={["Cantidad"]}
                                colors={["blue"]}
                            />
                        </Card>

                        <Card className="flex items-center w-[200px]" >
                            <DonutChart
                                data={products}
                                index="provider"
                                category={"Cantidad"}
                                colors={["blue", "green", "red", "yellow", "purple", "pink", "orange", "indigo", "teal", "cyan"]}
                            />
                        </Card>
                    </div>
                </div>

                <div className="grid gap-4">
                    <Title>Litros de Leche por día</Title>
                    <div  className="w-[800px] grid grid-flow-col gap-4">
                        <Card className="">
                            <LineChart
                                className="w-[600px]"
                                data={productsByDate}
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