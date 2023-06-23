"use client"
import { Card, Table, TableBody, TableCell, TableHead, TableRow, Title, Text, TextInput, Metric } from "@tremor/react";
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
        <div className="flex flex-col w-full py-5 gap-4">
            <Title className="text-4xl text-center">Proveedores</Title>

            <div className="flex justify-end w-full pr-10">
                <a href="/providers/create"
                    className="rounded-md px-4 py-2 bg-[#22c55e] text-white">Agregar
                </a>
            </div>

            <div className="flex gap-8 justify-end mx-32">
                <Card className="w-fit" decoration="top" decorationColor="green">
                    <Text>Proveedores activos</Text>
                    <Metric>{providers.length}</Metric>
                </Card>

                <Card className="w-fit" decoration="top" decorationColor="green">
                    <Text>Litros de leche Recogidos</Text>
                    <Metric>200 lts</Metric>
                </Card>
            </div>

            <section className="flex w-full justify-center h-fit">
                <div className="flex flex-col gap-3 w-fit">
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
            </section>
        </div>
    )
}