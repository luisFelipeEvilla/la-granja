"use client";
import { Card, DateRangePicker, DateRangePickerValue, Table, TableBody, TableCell, TableHead, TableRow, TextInput, Title } from "@tremor/react";
import { providersData } from "../data/providers";
import PrimaryButton from "../componeents/buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { es } from "date-fns/locale";

export default function Sheet() {
    const [providers, setProviders] = useState<any[]>(providersData);
    const [sheet, setSheet] = useState<any[]>([]);
    const [date, setDate] = useState<DateRangePickerValue>({
        from: new Date(),
        to: new Date(),
      });
    

    useEffect(() => {
        const aux = providers.map((provider, index) => {
            return { id: provider.id, liters: 0}
        })
        setSheet(aux);
    }, [])

    const handleLitersChange = (e: any, id: number) => {
        const liters =  parseInt(e.target.value);

        const newSheet = sheet.map((provider) => {
            if (provider.id === id) {
                return { ...provider, liters }
            }
            return provider;
        })
        setSheet(newSheet);    
    }

    const handleSubmit = (e: any) => {
        e.preventDefault();        
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
                                        <TableCell>{provider.name}</TableCell>
                                        <TableCell>
                                        <TextInput 
                                            onChange={(e) => handleLitersChange(e, provider.id)}
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