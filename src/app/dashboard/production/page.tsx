"use client";
import { Card, Metric, Table, TableBody, TableCell, TableHead, TableRow, TextInput, Text, Title } from "@tremor/react";
import PrimaryButton from "../../../components/buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { MilkRouteLog, Product, Provider } from "@prisma/client";
import { MilkRouteLogWithProvider } from "@/types/Product";
import { toast } from "react-hot-toast";

export default function ProductionPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [sheet, setSheet] = useState<MilkRouteLogWithProvider[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [total, setTotal] = useState<number>(0);


    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                
                const activeProviders = data.filter((provider: Provider) => provider.active);
                setProviders(activeProviders);

                const aux = activeProviders.map((provider: Provider) => {
                    return { providerId: provider.id, quantity: 0 }
                })
                setSheet(aux);
            })
    }, [])

    useEffect(() => {
        fetchSheet();
    }, [date, providers])

    useEffect(() => {
        const total = sheet.reduce((acc, product) => acc + product.quantity, 0);

        setTotal(total);
    }, [sheet])

    const fetchSheet = async () => {
        const res = await fetch(`/api/sheets?date=${date.toISOString().split('T')[0]}`);

        const products = await res.json();

        // update sheet with products
        const newSheet = sheet.map((product) => {
            const newProduct = products.find((p: MilkRouteLog) => p.providerId === product.providerId);
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
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Producción Diaria</Title>
                    <div className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-gray-600">Fecha:</Text>
                        <input
                            type="date"
                            value={date.toISOString().split('T')[0]}
                            onChange={handleDateChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <Title className="text-lg sm:text-xl font-semibold">Planilla de recolección</Title>
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                                <Text className="text-sm font-medium text-gray-600">Total:</Text>
                                <Metric className="text-xl font-bold text-green-600">{total} L</Metric>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHead>
                                <TableRow>
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">Proveedor</TableCell>
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">Litros</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody className="divide-y divide-gray-200">
                                {sheet.map((product, index) => {
                                    const provider = providers.find((provider) => provider.id === product.providerId);
                                    return (
                                        <TableRow key={index} className="hover:bg-gray-50">
                                            <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                                {provider?.firstName} {provider?.lastName}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <TextInput
                                                        onChange={(e) => handleQuantityChange(e, provider?.id as string)}
                                                        placeholder="0"
                                                        className="w-24 sm:w-28"
                                                        type="number"
                                                        min="0"
                                                        value={sheet.find((product) => product.providerId === provider?.id)?.quantity.toString()}
                                                    />
                                                    <Text className="text-sm text-gray-500">L</Text>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {sheet.length === 0 && (
                        <div className="p-8 text-center">
                            <Text className="text-gray-500">No hay proveedores activos</Text>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <PrimaryButton text="Guardar Planilla" />
                </div>
            </form>
        </div>
    )
}