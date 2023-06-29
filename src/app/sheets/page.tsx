"use client";
import { Card, DateRangePicker, DateRangePickerValue, Table, TableBody, TableCell, TableHead, TableRow, TextInput, Title } from "@tremor/react";
import PrimaryButton from "../componeents/buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { Product, Provider } from "@prisma/client";
import { ProductWithProvider } from "@/types/Product";

export default function Sheet() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [sheet, setSheet] = useState<ProductWithProvider[]>([]);
    const [date, setDate] = useState<Date>(new Date());


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

    const fetchSheet = async () => {
        const res = await fetch(`/api/sheets?date=${date.toISOString().split('T')[0]}`);

        const products = await res.json();

        // update sheet with products
        const newSheet = sheet.map((product) => {
            const newProduct = products.find((p: Product) => p.providerId === product.providerId);
            return newProduct ? { ...product, quantity: newProduct.quantity } :  { ...product, quantity: 0};
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

        window.location.reload();
    }

    return (
        <div className="w-full h-screen flex flex-col gap-2 items-center justify-center">
            <div>
                <input
                    type="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    placeholder="Selecciona una fecha"
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
                </Card>

                <div className="w-full flex mt-6 justify-center">
                    <PrimaryButton text="Guardar"></PrimaryButton>
                </div>
            </form>
        </div>
    )
}