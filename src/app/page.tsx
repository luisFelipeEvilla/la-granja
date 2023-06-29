"use client"
import { Card, Table, TableBody, TableCell, TableHead, TableRow, Title, Text, TextInput, Metric, BarChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";

export default function Providers() {
    const [search, setSearch] = useState<string>('');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/providers')
        .then(async (res) => {
            const data = await res.json();
            setProviders(data);

            const aux = data.map((provider: ProviderWithProducts) => {
                const cantidad = provider.products.reduce((acc, product) => acc + product.quantity, 0);
                return { provider: `${provider.firstName} ${provider.lastName}`, "Cantidad": cantidad}
            });

            setProducts(aux);
        })
    })

    useEffect(() => {
        const filtered = providers.filter(provider =>  `${provider.firstName} ${provider.lastName}`.toLocaleLowerCase().includes(search))
        setFilteredProviders(filtered);
    }, [search, providers])

    return (
        <div className="flex flex-col w-full py-5 gap-4">
            <div className="flex gap-8 justify-end mx-32">
                <Card className="w-fit" decoration="top" decorationColor="green">
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