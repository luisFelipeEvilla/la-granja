"use client";
import { Card, Table, TableBody, TableCell, TableHead, TableRow, TextInput, Title } from "@tremor/react";
import { providersData } from "../data/providers";
import PrimaryButton from "../componeents/buttons/PrimaryButton";
import { useEffect, useState } from "react";

export default function Sheet() {
    const [providers, setProviders] = useState<any[]>(providersData);
    const [sheet, setSheet] = useState<any[]>([]);

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

        console.log(newSheet)
        setSheet(newSheet);    
    }

    return (
        <div className="w-full h-screen flex items-center justify-center">
            <form>
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
                                        <TextInput 
                                            onChange={(e) => handleLitersChange(e, provider.id)}
                                            placeholder="Litros de leche"
                                            className="w-[100px] mt-2" />
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