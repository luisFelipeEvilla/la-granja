"use client";
import { formatCOP, formatDate, getAccountStatement, getInvoiceBalance, getItemsSummary, getPeriodLabel, idTypeLabels } from "@/app/utils/clientInvoice";
import { ClientWithInvoices } from "@/types/Client";
import { InfoGrid, PdfDocument, PdfDownloadButton, PdfTable, SectionTitle, TotalsBox } from "./theme";

type Props = { client: ClientWithInvoices, from?: string, to?: string };

export default function ClientStatementPDF({ client, from, to }: Props) {
    const statement = getAccountStatement(client.invoices, from, to);

    const movementRows = [
        ...(from ? [[formatDate(from), "Saldo anterior", "", "", formatCOP(statement.openingBalance)]] : []),
        ...statement.movements.map((movement) => [
            formatDate(movement.date),
            movement.description,
            movement.charge ? formatCOP(movement.charge) : "",
            movement.credit ? formatCOP(movement.credit) : "",
            formatCOP(movement.balance),
        ]),
    ];

    const document = (
        <PdfDocument
            title={`Estado de cuenta ${client.name}`}
            docLabel="Estado de cuenta"
            meta={[
                { label: "Período", value: getPeriodLabel(from, to) },
                { label: "Fecha", value: new Date().toLocaleDateString("es-CO") },
            ]}
        >
            <InfoGrid
                columns={3}
                items={[
                    { label: "Cliente", value: client.name },
                    { label: idTypeLabels[client.idType], value: client.idNum },
                    client.phone && { label: "Teléfono", value: client.phone },
                    client.email && { label: "Correo", value: client.email },
                    client.address && { label: "Dirección", value: client.address },
                ]}
            />

            <SectionTitle>Movimientos</SectionTitle>
            <PdfTable
                columns={[
                    { label: "Fecha", flex: 0.9 },
                    { label: "Descripción", flex: 3 },
                    { label: "Cargo", flex: 1.1, align: "right" },
                    { label: "Abono", flex: 1.1, align: "right" },
                    { label: "Saldo", flex: 1.1, align: "right" },
                ]}
                rows={movementRows}
                empty="No hay movimientos en este período"
            />

            <TotalsBox
                rows={[
                    ...(from ? [{ label: "Saldo anterior", value: formatCOP(statement.openingBalance) }] : []),
                    { label: "Facturado", value: formatCOP(statement.totalCharges) },
                    { label: "Pagado", value: formatCOP(statement.totalCredits) },
                    { label: `Saldo${to ? ` al ${formatDate(to)}` : ""}`, value: formatCOP(statement.closingBalance), emphasis: true },
                ]}
            />

            {statement.pendingInvoices.length > 0 && (
                <>
                    <SectionTitle>Facturas pendientes de pago</SectionTitle>
                    <PdfTable
                        columns={[
                            { label: "Fecha", flex: 0.9 },
                            { label: "Factura", flex: 3 },
                            { label: "Total", flex: 1.1, align: "right" },
                            { label: "Pagado", flex: 1.1, align: "right" },
                            { label: "Saldo", flex: 1.1, align: "right" },
                        ]}
                        rows={statement.pendingInvoices.map((invoice) => [
                            formatDate(invoice.issueDate),
                            `#${invoice.number} · ${getItemsSummary(invoice.items)}`,
                            formatCOP(invoice.amount),
                            formatCOP(invoice.paidAmount),
                            formatCOP(getInvoiceBalance(invoice)),
                        ])}
                    />
                </>
            )}
        </PdfDocument>
    );

    return <PdfDownloadButton document={document} fileName={`Estado de cuenta ${client.name}.pdf`} />;
}
