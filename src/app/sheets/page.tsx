"use client";
import { Card, Metric, Table, TableBody, TableCell, TableHead, TableRow, TextInput, Text, Title } from "@tremor/react";
import PrimaryButton from "../componeents/buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { Product, Provider } from "@prisma/client";
import { ProductWithProvider } from "@/types/Product";
import { toast } from "react-hot-toast";

export default function Sheet() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [sheet, setSheet] = useState<ProductWithProvider[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [total, setTotal] = useState<number>(0);


    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);

                const aux = data.map((provider: Provider) => {
                    return { providerId: provider.id, quantity: 0 }
                })
                setSheet(aux);
            })
    }, [])

    useEffect(() => {
        fetchSheet();
    }, [date, providers])

    useEffect(() => {
        console.log('hola');
        
        const total = sheet.reduce((acc, product) => acc + product.quantity, 0);

        setTotal(total);
    }, [sheet])

    const fetchSheet = async () => {
        const res = await fetch(`/api/sheets?date=${date.toISOString().split('T')[0]}`);

        const products = await res.json();

        // update sheet with products
        const newSheet = sheet.map((product) => {
            const newProduct = products.find((p: Product) => p.providerId === product.providerId);
            return newProduct ? { ...product, quantity: newProduct.quantity } : { ...product, quantity: 0 };
        });
        setSheet(newSheet);
    }

    const handleDateChange = async (e: any) => {
        setDate(new Date(e.target.value));
    }

    const handleQuantityChange = (e: any, id: string) => {
        const quantity = parseInt(e.target.value || '0');

        const newSheet = sheet.map((product) => product.providerId === id ? { ...product, quantity } : product)

        setSheet(newSheet);
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        //  remove time zone from date
        const aux = date.toISOString().split('T')[0];

        const res = await fetch('/api/sheets', {
            method: 'POST',
            body: JSON.stringify({
                date: new Date(aux),
                products: sheet
            })
        })

        toast.success('Planilla guardada con éxito');
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center">
            <div className="mb-4 rounded-md bg-white border shadow-sm cursor-pointer px-3 py-1 focus:outline-none ring-0">
                <input
                    type="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    placeholder="Selecciona una fecha"
                    // set max date to today
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>
            <form onSubmit={handleSubmit}>
                <Card className="w-[600px]">
                    <Title>Planilla de recolección</Title>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Proveedor</TableCell>
                                <TableCell>Litros</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {
                                sheet.map((product, index) => {
                                    const provider = providers.find((provider) => provider.id === product.providerId);
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>{provider?.firstName} {provider?.lastName}</TableCell>
                                            <TableCell>
                                                <TextInput
                                                    onChange={(e) => handleQuantityChange(e, provider?.id as string)}
                                                    placeholder="Litros de leche"
                                                    className="w-[100px]"
                                                    value={sheet.find((product) => product.providerId === provider?.id)?.quantity.toString()}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>

                    <div className="flex items-center">
                        <Text>Total: <span className="font-bold">{total}</span></Text>
                    </div>
                </Card>

                <div className="w-full flex mt-6 justify-center">
                    <PrimaryButton text="Guardar"></PrimaryButton>
                </div>
            </form>
        </div>
    )
}