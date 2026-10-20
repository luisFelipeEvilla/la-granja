"use client";
import { formatCOP, formatDate, formatQuantity, getInvoiceBalance, idTypeLabels, paymentMethodLabels } from "@/app/utils/clientInvoice";
import { InvoiceWithClient } from "@/types/Client";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { colors, InfoGrid, Notes, PdfDocument, PdfDownloadButton, PdfTable, SectionTitle, TotalsBox } from "./theme";

type Props = { invoice: InvoiceWithClient };

const styles = StyleSheet.create({
    signature: { marginTop: 4, marginBottom: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, width: 260 },
    signatureImage: { height: 80, objectFit: "contain" },
    signatureLine: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 6 },
    signatureName: { fontFamily: "Helvetica-Bold", fontSize: 9, color: colors.ink },
    signatureMeta: { fontSize: 8, color: colors.muted, marginTop: 2 },
    annexGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    annexItem: { width: "48.5%", marginBottom: 14 },
    annexImage: { width: "100%", height: 230, objectFit: "contain", backgroundColor: colors.zebra, borderRadius: 4 },
    annexCaption: { fontSize: 8, color: colors.muted, marginTop: 4 },
});

const formatDateTime = (date: Date | string) =>
    new Date(date).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default function ClientInvoicePDF({ invoice }: Props) {
    const { client } = invoice;
    const voided = invoice.status === 'ANULADA';
    // generated on tap in the browser: images are fetched from the app at that moment
    const origin = window.location.origin;
    const signed = invoice.signatureRequest?.signedAt;

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

            {signed && (
                <View style={styles.signature} wrap={false}>
                    <Text style={{ ...styles.signatureMeta, marginTop: 0, marginBottom: 6 }}>FIRMA DEL CLIENTE</Text>
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
                    <Image style={styles.signatureImage} src={`${origin}/api/client-invoices/${invoice.id}/signature/file`} />
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureName}>{client.name}</Text>
                        <Text style={styles.signatureMeta}>
                            Firmado electrónicamente el {formatDateTime(signed)}
                            {invoice.signatureRequest?.signerIp ? ` · IP ${invoice.signatureRequest.signerIp}` : ""}
                        </Text>
                    </View>
                </View>
            )}

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
            {invoice.attachments.length > 0 && (
                <View break>
                    <SectionTitle>Anexo · Evidencias</SectionTitle>
                    <View style={styles.annexGrid}>
                        {invoice.attachments.map((attachment, index) => (
                            <View key={attachment.id} style={styles.annexItem} wrap={false}>
                                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
                                <Image style={styles.annexImage} src={`${origin}/api/attachments/${attachment.id}/file`} />
                                <Text style={styles.annexCaption}>Evidencia {index + 1} · {formatDateTime(attachment.createdAt)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </PdfDocument>
    );

    return <PdfDownloadButton document={document} fileName={`Factura de venta ${invoice.number} ${client.name}.pdf`} />;
}
