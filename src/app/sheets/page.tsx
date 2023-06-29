"use client";
import { Card, DateRangePicker, DateRangePickerValue, Table, TableBody, TableCell, TableHead, TableRow, TextInput, Title } from "@tremor/react";
import PrimaryButton from "../componeents/buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { es } from "date-fns/locale";
import { Product, Provider } from "@prisma/client";

export default function Sheet() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [sheet, setSheet] = useState<Product[]>([]);
    const [date, setDate] = useState<DateRangePickerValue>({
        from: new Date(),
        to: new Date(),
    });


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
    })

    const handleQuantityChange = (e: any, id: string) => {
        const quantity = parseInt(e.target.value);

        const newSheet = sheet.map((product) => product.providerId === id ? { ...product, quantity } : product)

        setSheet(newSheet);
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const res = await fetch('/api/sheets', {
            method: 'POST',
            body: JSON.stringify({
                date: date.from,
                products: sheet
            })
        })

        window.location.reload();
    }

    return (
        <div className="w-full h-screen flex flex-col gap-2 items-center justify-center">
            <div>
                <DateRangePicker
                    locale={es}
                    enableSelect={false}
                    value={date}
                    onValueChange={setDate}
                    selectPlaceholder="Seleccionar fecha"
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
                                providers.map((provider, index) =>
                                    <TableRow key={index}>
                                        <TableCell>{provider.firstName} {provider.lastName}</TableCell>
                                        <TableCell>
                                            <TextInput
                                                onChange={(e) => handleQuantityChange(e, provider.id)}
                                                placeholder="Litros de leche"
                                                className="w-[100px]" />
                                        </TableCell>
                                    </TableRow>
                                )
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