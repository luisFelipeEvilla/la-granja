"use client";
import InvoiceStatusBadge from "@/components/clients/InvoiceStatusBadge";
import { formatCOP, formatDate, getInvoiceBalance, getItemsSummary, getPaymentStatus, idTypeLabels } from "@/app/utils/clientInvoice";
import { ClientSummary, ClientWithInvoices } from "@/types/Client";
import {
    Card,
    Metric,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Text,
    Title
} from "@tremor/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ClientDetail({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<ClientWithInvoices & { summary: ClientSummary }>();

    const loadClient = useCallback(async () => {
        const res = await fetch(`/api/clients/${params.id}`);
        if (res.ok) setClient(await res.json());
        else toast.error('Cliente no encontrado');
    }, [params.id]);

    useEffect(() => { loadClient() }, [loadClient]);


    if (!client) return <Text className="text-center text-gray-500">Cargando...</Text>;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <Title className="text-2xl sm:text-3xl font-bold text-gray-900">{client.name}</Title>
                        <Text className="mt-1">{idTypeLabels[client.idType]} {client.idNum}</Text>
                        <Text className="text-gray-500">
                            {[client.phone, client.email, client.address].filter(Boolean).join(' · ')}
                        </Text>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/dashboard/clients"
                            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                        >
                            Volver
                        </a>
                        <Link
                            href={`/dashboard/clients/${client.id}/invoices/new`}
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                            Nueva factura
                        </Link>
                        <a
                            href={`/dashboard/clients/${client.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                            Editar
                        </a>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4" decoration="top" decorationColor="blue">
                    <Text className="text-sm font-medium text-gray-600">Total facturado</Text>
                    <Metric className="text-2xl font-bold text-blue-600 mt-2">{formatCOP(client.summary.invoiced)}</Metric>
                </Card>
                <Card className="p-4" decoration="top" decorationColor="green">
                    <Text className="text-sm font-medium text-gray-600">Total pagado</Text>
                    <Metric className="text-2xl font-bold text-green-600 mt-2">{formatCOP(client.summary.paid)}</Metric>
                </Card>
                <Card className="p-4" decoration="top" decorationColor="red">
                    <Text className="text-sm font-medium text-gray-600">Saldo pendiente</Text>
                    <Metric className="text-2xl font-bold text-red-600 mt-2">{formatCOP(client.summary.balance)}</Metric>
                </Card>
            </div>


            {/* Invoices */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold">Facturas</Title>
                </div>
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHead>
                            <TableRow>
                                <TableCell className="whitespace-nowrap">N°</TableCell>
                                <TableCell className="whitespace-nowrap hidden lg:table-cell">Emisión</TableCell>
                                <TableCell className="whitespace-nowrap">Productos</TableCell>
                                <TableCell className="whitespace-nowrap hidden lg:table-cell">Monto</TableCell>
                                <TableCell className="whitespace-nowrap">Saldo</TableCell>
                                <TableCell className="whitespace-nowrap">Estado</TableCell>
                                <TableCell className="whitespace-nowrap">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {client.invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">#{invoice.number}</TableCell>
                                    <TableCell className="whitespace-nowrap hidden lg:table-cell">{formatDate(invoice.issueDate)}</TableCell>
                                    <TableCell className="max-w-[12rem] lg:max-w-xs">
                                        <div className="truncate">{getItemsSummary(invoice.items)}</div>
                                        <div className="lg:hidden text-xs text-gray-500">{formatDate(invoice.issueDate)} · {formatCOP(invoice.amount)}</div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap hidden lg:table-cell">{formatCOP(invoice.amount)}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {invoice.status === 'ANULADA' ? '-' : formatCOP(getInvoiceBalance(invoice))}
                                    </TableCell>
                                    <TableCell><InvoiceStatusBadge status={getPaymentStatus(invoice)} /></TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/dashboard/clients/${client.id}/invoices/${invoice.id}`}
                                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                                        >
                                            Ver
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {client.invoices.length === 0 && (
                    <div className="p-8 text-center">
                        <Text className="text-gray-500">Este cliente no tiene facturas</Text>
                    </div>
                )}
            </div>
        </div>
    )
}
