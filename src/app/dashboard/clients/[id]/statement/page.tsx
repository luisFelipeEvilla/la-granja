"use client";
import { formatCOP, formatDate, getAccountStatement, getInvoiceBalance, getItemsSummary, getPeriodLabel, toDateString } from "@/app/utils/clientInvoice";
import { ClientWithInvoices } from "@/types/Client";
import {
    Card,
    DateRangePicker,
    DateRangePickerValue,
    Metric,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Text,
    Title
} from "@tremor/react";
import { es } from "date-fns/locale";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const ClientStatementPDF = dynamic(() => import("@/components/pdfs/clientStatement"), {
    ssr: false
});

export default function ClientStatement({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<ClientWithInvoices>();
    // empty range = the whole history
    const [dates, setDates] = useState<DateRangePickerValue>({});

    useEffect(() => {
        fetch(`/api/clients/${params.id}`).then(async (res) => {
            if (res.ok) setClient(await res.json());
            else toast.error('Cliente no encontrado');
        });
    }, [params.id]);

    if (!client) return <Text className="text-center text-gray-500">Cargando...</Text>;

    const from = dates.from && toDateString(dates.from);
    const to = dates.to ? toDateString(dates.to) : from;
    const statement = getAccountStatement(client.invoices, from, to);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Estado de cuenta</Title>
                        <Text className="mt-1">{client.name} · {client.idType} {client.idNum}</Text>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/dashboard/clients/${client.id}`}
                            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                        >
                            Volver
                        </a>
                        <ClientStatementPDF client={client} from={from} to={to} />
                    </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="text-sm font-medium text-gray-700">Período</label>
                    <DateRangePicker
                        value={dates}
                        onValueChange={setDates}
                        locale={es}
                        placeholder="Todo el historial"
                        selectPlaceholder="Rango"
                        className="w-full sm:max-w-md"
                    />
                    <Text className="text-sm text-gray-500">{getPeriodLabel(from, to)}</Text>
                </div>
            </div>

            {/* Summary */}
            <div className={`grid grid-cols-2 gap-4 ${from ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                {from && (
                    <Card className="p-4" decoration="top" decorationColor="gray">
                        <Text className="text-sm font-medium text-gray-600">Saldo anterior</Text>
                        <Metric className="text-xl sm:text-2xl font-bold text-gray-700 mt-2">{formatCOP(statement.openingBalance)}</Metric>
                    </Card>
                )}
                <Card className="p-4" decoration="top" decorationColor="blue">
                    <Text className="text-sm font-medium text-gray-600">Facturado</Text>
                    <Metric className="text-xl sm:text-2xl font-bold text-blue-600 mt-2">{formatCOP(statement.totalCharges)}</Metric>
                </Card>
                <Card className="p-4" decoration="top" decorationColor="green">
                    <Text className="text-sm font-medium text-gray-600">Pagado</Text>
                    <Metric className="text-xl sm:text-2xl font-bold text-green-600 mt-2">{formatCOP(statement.totalCredits)}</Metric>
                </Card>
                <Card className={`p-4 ${from ? '' : 'col-span-2 md:col-span-1'}`} decoration="top" decorationColor="red">
                    <Text className="text-sm font-medium text-gray-600">Saldo{to ? ` al ${formatDate(to)}` : ''}</Text>
                    <Metric className="text-xl sm:text-2xl font-bold text-red-600 mt-2">{formatCOP(statement.closingBalance)}</Metric>
                </Card>
            </div>

            {/* Movements */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold">Movimientos</Title>
                </div>
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHead>
                            <TableRow>
                                <TableCell className="whitespace-nowrap">Fecha</TableCell>
                                <TableCell className="whitespace-nowrap">Descripción</TableCell>
                                <TableCell className="whitespace-nowrap text-right hidden sm:table-cell">Cargo</TableCell>
                                <TableCell className="whitespace-nowrap text-right hidden sm:table-cell">Abono</TableCell>
                                <TableCell className="whitespace-nowrap text-right">Saldo</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {from && (
                                <TableRow>
                                    <TableCell className="whitespace-nowrap">{formatDate(from)}</TableCell>
                                    <TableCell className="font-medium">Saldo anterior</TableCell>
                                    <TableCell className="hidden sm:table-cell" />
                                    <TableCell className="hidden sm:table-cell" />
                                    <TableCell className="whitespace-nowrap text-right font-medium">{formatCOP(statement.openingBalance)}</TableCell>
                                </TableRow>
                            )}
                            {statement.movements.map((movement, index) => (
                                <TableRow key={index}>
                                    <TableCell className="whitespace-nowrap">{formatDate(movement.date)}</TableCell>
                                    <TableCell className="whitespace-normal min-w-[12rem]">
                                        {movement.description}
                                        <div className={`sm:hidden text-xs ${movement.charge ? 'text-blue-600' : 'text-green-600'}`}>
                                            {movement.charge ? `+ ${formatCOP(movement.charge)}` : `- ${formatCOP(movement.credit)}`}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-right hidden sm:table-cell text-blue-600">
                                        {movement.charge ? formatCOP(movement.charge) : ''}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-right hidden sm:table-cell text-green-600">
                                        {movement.credit ? formatCOP(movement.credit) : ''}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-right font-medium">{formatCOP(movement.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {statement.movements.length === 0 && (
                    <div className="p-8 text-center">
                        <Text className="text-gray-500">No hay movimientos en este período</Text>
                    </div>
                )}
            </div>

            {/* Pending invoices */}
            {statement.pendingInvoices.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <Title className="text-lg font-semibold">Facturas pendientes de pago</Title>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHead>
                                <TableRow>
                                    <TableCell className="whitespace-nowrap">Factura</TableCell>
                                    <TableCell className="whitespace-nowrap hidden md:table-cell">Productos</TableCell>
                                    <TableCell className="whitespace-nowrap text-right hidden sm:table-cell">Total</TableCell>
                                    <TableCell className="whitespace-nowrap text-right">Saldo</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {statement.pendingInvoices.map((invoice) => (
                                    <TableRow key={invoice.number}>
                                        <TableCell className="whitespace-nowrap font-medium">
                                            #{invoice.number}
                                            <div className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell max-w-xs truncate">{getItemsSummary(invoice.items)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right hidden sm:table-cell">{formatCOP(invoice.amount)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right font-medium text-red-600">{formatCOP(getInvoiceBalance(invoice))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
