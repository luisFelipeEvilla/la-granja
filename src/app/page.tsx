"use client"
import { Card, Table, TableBody, TableCell, TableHead, TableRow, Title, Text, TextInput, Metric, BarChart, Select, SelectItem, DateRangePicker, DateRangePickerValue, MultiSelectItem, MultiSelect } from "@tremor/react";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";
import { es } from "date-fns/locale";

export default function Providers() {
    const [search, setSearch] = useState<string>('');
    const [providers, setProviders] = useState<ProviderWithProducts[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date()
    });

    useEffect(() => {
        fetch(`/api/providers?startDate=${dates.from?.toISOString()}&endDate=${dates.to?.toISOString()}`)
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
            return { provider: `${provider.firstName} ${provider.lastName}`, "Cantidad": cantidad}
        });

        setProducts(aux);
    }

    const handleFilterProvider = (id: string[]) => {
        const filtered = providers.filter(provider => id.includes(provider.id));
        setFilteredProviders(filtered);
        updateProducts(filtered);
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
                            <MultiSelectItem   value={provider.id} key={provider.id}>{provider.firstName} {provider.lastName}</MultiSelectItem>
                        ))
                    }
                </MultiSelect>
            </div>
            <div className="flex justify-end mx-32">
                <Card className="mr-4 w-fit" decoration="top" decorationColor="green">
                    <Text>Proveedores activos</Text>
                    <Metric>{providers.length}</Metric>
                </Card>

                <Card className="w-fit" decoration="top" decorationColor="green">
                    <Text>Litros de leche Recogidos</Text>
                    <Metric>{
                        products.reduce((acc, product) => acc + product.Cantidad, 0)
                    }</Metric>
                </Card>
            </div>
            
            <section className="flex justify-center"> 
                <Card className="max-w-[800px]">
                    <Title>Litros de Leche por proveedor</Title>
                    <BarChart
                        data={products}
                        index="provider"
                        categories={["Cantidad"]}
                        colors={["blue"]}
                    />
                </Card>
            </section>
        </div>
    )
}