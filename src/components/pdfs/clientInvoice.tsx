"use client";
import { formatCOP, formatDate, formatQuantity, getInvoiceBalance, idTypeLabels, paymentMethodLabels } from "@/app/utils/clientInvoice";
import { InvoiceWithClient } from "@/types/Client";
import { InfoGrid, Notes, PdfDocument, PdfDownloadButton, PdfTable, SectionTitle, TotalsBox } from "./theme";

type Props = { invoice: InvoiceWithClient };

export default function ClientInvoicePDF({ invoice }: Props) {
    const { client } = invoice;
    const voided = invoice.status === 'ANULADA';

    const document = (
        <PdfDocument
            title={`Factura ${invoice.number} ${client.name}`}
            docLabel="Factura de venta"
            meta={[
                { label: "N°", value: String(invoice.number) },
                { label: "Fecha de emisión", value: formatDate(invoice.issueDate) },
            ]}
            badge={voided ? "ANULADA" : undefined}
            watermark={voided ? "ANULADA" : undefined}
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

            <SectionTitle>Productos</SectionTitle>
            <PdfTable
                columns={[
                    { label: "Producto", flex: 2.6 },
                    { label: "Cantidad", flex: 1, align: "right" },
                    { label: "Precio unitario", flex: 1.3, align: "right" },
                    { label: "Total", flex: 1.3, align: "right" },
                ]}
                rows={invoice.items.map((item) => [
                    item.name,
                    `${formatQuantity(item.quantity)} ${item.unit}`,
                    formatCOP(item.unitPrice),
                    formatCOP(item.total),
                ])}
            />

            <TotalsBox
                rows={[
                    { label: "Total factura", value: formatCOP(invoice.amount) },
                    { label: "Pagado", value: formatCOP(invoice.paidAmount) },
                    { label: "Saldo pendiente", value: formatCOP(getInvoiceBalance(invoice)), emphasis: true },
                ]}
            />

            {invoice.notes && <Notes>{invoice.notes}</Notes>}

            {invoice.payments.length > 0 && (
                <>
                    <SectionTitle>Pagos y abonos</SectionTitle>
                    <PdfTable
                        columns={[
                            { label: "Fecha", flex: 1 },
                            { label: "Método", flex: 1.2 },
                            { label: "Referencia", flex: 1.6 },
                            { label: "Valor", flex: 1.2, align: "right" },
                        ]}
                        rows={invoice.payments.map((payment) => [
                            formatDate(payment.date),
                            paymentMethodLabels[payment.method],
                            payment.reference ?? "—",
                            formatCOP(payment.amount),
                        ])}
                    />
                </>
            )}
        </PdfDocument>
    );

    return <PdfDownloadButton document={document} fileName={`Factura de venta ${invoice.number} ${client.name}.pdf`} />;
}
