import { Card, Table, TableBody, TableCell, TableHead, TableRow, Title, Text } from "@tremor/react";

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
    return (
        <div className="flex flex-col w-full py-5">
            <div className="flex justify-between">
                <Title>Proveedores</Title>
                <a href="/providers/create"
                 className="rounded-md px-4 py-2 bg-[#22c55e] text-white">Agregar
                </a>
            </div>

            <div className="flex flex-col items-center w-full h-fit">
                <Card className="w-4/6">
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
                                data.map((provider, index) =>
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