"use client"
import { Card, Table, TableBody, TableCell, TableHead, TableRow, Title, Text, TextInput } from "@tremor/react";
import { SearchIcon } from "@heroicons/react/outline"
import { useEffect, useState } from "react";

const data = [
    {
        name: 'Proveedor 1',
        phone: '1234567890',
        email: 'provedor@gmail.com',
    },
    {
        name: 'Proveedor 2',
        phone: '1234567890',
        email: 'proveedor@gmail.com',
    },
    {
        name: 'Proveedor 3',
        phone: '1234567890',
        email: 'proveedor@gmail.com',
    }
]

export default function Providers() {
    const [search, setSearch] = useState<string>('');
    const [providers, setProviders] = useState<any[]>(data);

    useEffect(() => {
        const filtered = data.filter(provider => provider.name.toLocaleLowerCase().includes(search))
        setProviders(filtered);
    }, [search])

    return (
        <div className="flex flex-col w-full items-center py-5 gap-4">
            <div className="flex justify-center w-full">
                <Title>Proveedores</Title>
                <a href="/providers/create"
                    className="rounded-md px-4 py-2 bg-[#22c55e] text-white">Agregar
                </a>
            </div>

            <div className="flex flex-col gap-3 h-fit">
                <div className="">
                    <TextInput className="w-[240px]"
                        icon={SearchIcon}
                        placeholder="Buscar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />


                </div>
                <Card className="w-[800px]">
                    <Title>Lista de proveedores</Title>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Telefono</TableCell>
                                <TableCell>Correo</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                providers.map((provider, index) =>
                                    <TableRow key={index}>
                                        <TableCell>{provider.name}</TableCell>
                                        <TableCell>{provider.phone}</TableCell>
                                        <TableCell>{provider.email}</TableCell>
                                        <TableCell>Editar</TableCell>
                                    </TableRow>
                                )
                            }
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    )
}