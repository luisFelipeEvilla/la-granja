"use client";
import { formatCOP, formatDate, formatQuantity, getInvoiceBalance, idTypeLabels, paymentMethodLabels } from "@/app/utils/clientInvoice";
import { InvoiceWithClient } from "@/types/Client";
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"

type Props = { invoice: InvoiceWithClient };

const styles = StyleSheet.create({
    body: { paddingHorizontal: 20, paddingVertical: 20 },
    logo: { width: 120, height: 60 },
    header: { display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, textAlign: 'center' },
    invoiceNumber: { fontSize: 12, textAlign: 'right', marginRight: 20 },
    sectionTitle: { fontSize: 14, marginBottom: 8 },
    fieldLabel: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
    fieldValue: { fontSize: 12, marginBottom: 10 },
    divider: { border: '1px solid gray', marginBottom: 10 },
    row: { display: 'flex', flexDirection: 'row' },
    column: { flex: 1 },
    table: { display: "flex", flexDirection: "column", width: "100%", marginBottom: 15 },
    tableRow: { width: '100%', display: "flex", flexDirection: "row", borderLeftWidth: 1 },
    tableHeader: { fontSize: 11, borderTopWidth: 1 },
    tableCell: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 9,
        flex: 1,
        textAlign: 'center',
        borderStyle: "solid",
        borderBottomWidth: 1,
        borderRightWidth: 1,
    },
    totals: { alignSelf: 'flex-end', width: 220 },
    totalRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }
});

export default function ClientInvoicePDF({ invoice }: Props) {
    const { client } = invoice;

    const MyDocument = () => (
        <Document title={`Factura ${invoice.number} ${client.name}`}>
            <Page style={styles.body}>
                <View style={styles.header}>
                    <Image style={styles.logo} src={'/images/logo.jpg'} />
                    <Text style={styles.title}> Lácteos La Granja </Text>
                    <View style={styles.invoiceNumber}>
                        <Text>Factura de venta N° {invoice.number}</Text>
                        {invoice.status === 'ANULADA' && <Text>ANULADA</Text>}
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.fieldLabel}>Cliente</Text>
                        <Text style={styles.fieldValue}>{client.name}</Text>
                        <Text style={styles.fieldLabel}>{idTypeLabels[client.idType]}</Text>
                        <Text style={styles.fieldValue}>{client.idNum}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.fieldLabel}>Fecha de emisión</Text>
                        <Text style={styles.fieldValue}>{formatDate(invoice.issueDate)}</Text>
                        {client.phone && <Text style={styles.fieldLabel}>Teléfono</Text>}
                        {client.phone && <Text style={styles.fieldValue}>{client.phone}</Text>}
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Productos</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, flex: 2 }}>Producto</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Cantidad</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Precio unitario</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Total</Text>
                    </View>
                    {invoice.items.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'left' }}>{item.name}</Text>
                            <Text style={styles.tableCell}>{formatQuantity(item.quantity)} {item.unit}</Text>
                            <Text style={styles.tableCell}>{formatCOP(item.unitPrice)}</Text>
                            <Text style={styles.tableCell}>{formatCOP(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {invoice.notes && <Text style={styles.fieldValue}>Notas: {invoice.notes}</Text>}

                {invoice.payments.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Pagos y abonos</Text>
                        <View style={styles.table}>
                            <View style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Fecha</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Método</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Referencia</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Valor</Text>
                            </View>
                            {invoice.payments.map((payment) => (
                                <View style={styles.tableRow} key={payment.id}>
                                    <Text style={styles.tableCell}>{formatDate(payment.date)}</Text>
                                    <Text style={styles.tableCell}>{paymentMethodLabels[payment.method]}</Text>
                                    <Text style={styles.tableCell}>{payment.reference ?? '-'}</Text>
                                    <Text style={styles.tableCell}>{formatCOP(payment.amount)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                <View style={styles.totals}>
                    <View style={styles.totalRow}><Text>Total</Text><Text>{formatCOP(invoice.amount)}</Text></View>
                    <View style={styles.totalRow}><Text>Pagado</Text><Text>{formatCOP(invoice.paidAmount)}</Text></View>
                    <View style={styles.totalRow}><Text>Saldo</Text><Text>{formatCOP(getInvoiceBalance(invoice))}</Text></View>
                </View>
            </Page>
        </Document>
    )

    return (
        <PDFDownloadLink
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            document={<MyDocument />}
            fileName={`Factura de venta ${invoice.number} ${client.name}.pdf`}
        >Descargar PDF
        </PDFDownloadLink>
    )
}
