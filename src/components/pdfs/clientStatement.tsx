"use client";
import { formatCOP, formatDate, getAccountStatement, getPeriodLabel, getInvoiceBalance, getItemsSummary, idTypeLabels } from "@/app/utils/clientInvoice";
import { ClientWithInvoices } from "@/types/Client";
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"

type Props = { client: ClientWithInvoices, from?: string, to?: string };

const styles = StyleSheet.create({
    body: { paddingHorizontal: 20, paddingVertical: 20 },
    logo: { width: 120, height: 60 },
    header: { display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, textAlign: 'center' },
    headerRight: { fontSize: 12, textAlign: 'right', marginRight: 20 },
    sectionTitle: { fontSize: 14, marginBottom: 8 },
    fieldLabel: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
    fieldValue: { fontSize: 12, marginBottom: 10 },
    divider: { border: '1px solid gray', marginBottom: 10 },
    row: { display: 'flex', flexDirection: 'row' },
    column: { flex: 1 },
    table: { display: "flex", flexDirection: "column", width: "100%", marginBottom: 15 },
    tableRow: { width: '100%', display: "flex", flexDirection: "row", borderLeftWidth: 1 },
    tableHeader: { fontSize: 10, borderTopWidth: 1 },
    tableCell: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        fontSize: 9,
        flex: 1,
        textAlign: 'right',
        borderStyle: "solid",
        borderBottomWidth: 1,
        borderRightWidth: 1,
    },
    summary: { alignSelf: 'flex-end', width: 240, marginBottom: 15 },
    summaryRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 },
    summaryTotal: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', fontSize: 13, borderTopWidth: 1, paddingTop: 4 }
});

const dateCell = { ...styles.tableCell, flex: 0.9, textAlign: 'center' as const };
const descriptionCell = { ...styles.tableCell, flex: 3, textAlign: 'left' as const };

export default function ClientStatementPDF({ client, from, to }: Props) {
    const statement = getAccountStatement(client.invoices, from, to);

    const MyDocument = () => (
        <Document title={`Estado de cuenta ${client.name}`}>
            <Page style={styles.body}>
                <View style={styles.header}>
                    <Image style={styles.logo} src={'/images/logo.jpg'} />
                    <Text style={styles.title}> Lácteos La Granja </Text>
                    <View style={styles.headerRight}>
                        <Text>Estado de cuenta</Text>
                        <Text>{new Date().toLocaleDateString('es-CO')}</Text>
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
                        <Text style={styles.fieldLabel}>Período</Text>
                        <Text style={styles.fieldValue}>{getPeriodLabel(from, to)}</Text>
                        {client.phone && <Text style={styles.fieldLabel}>Teléfono</Text>}
                        {client.phone && <Text style={styles.fieldValue}>{client.phone}</Text>}
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Movimientos</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...dateCell, ...styles.tableHeader }}>Fecha</Text>
                        <Text style={{ ...descriptionCell, ...styles.tableHeader }}>Descripción</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Cargo</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Abono</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Saldo</Text>
                    </View>
                    {from && (
                        <View style={styles.tableRow}>
                            <Text style={dateCell}>{formatDate(from)}</Text>
                            <Text style={descriptionCell}>Saldo anterior</Text>
                            <Text style={styles.tableCell}></Text>
                            <Text style={styles.tableCell}></Text>
                            <Text style={styles.tableCell}>{formatCOP(statement.openingBalance)}</Text>
                        </View>
                    )}
                    {statement.movements.map((movement, index) => (
                        <View style={styles.tableRow} key={index} wrap={false}>
                            <Text style={dateCell}>{formatDate(movement.date)}</Text>
                            <Text style={descriptionCell}>{movement.description}</Text>
                            <Text style={styles.tableCell}>{movement.charge ? formatCOP(movement.charge) : ''}</Text>
                            <Text style={styles.tableCell}>{movement.credit ? formatCOP(movement.credit) : ''}</Text>
                            <Text style={styles.tableCell}>{formatCOP(movement.balance)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summary}>
                    {from && <View style={styles.summaryRow}><Text>Saldo anterior</Text><Text>{formatCOP(statement.openingBalance)}</Text></View>}
                    <View style={styles.summaryRow}><Text>Facturado</Text><Text>{formatCOP(statement.totalCharges)}</Text></View>
                    <View style={styles.summaryRow}><Text>Pagado</Text><Text>{formatCOP(statement.totalCredits)}</Text></View>
                    <View style={styles.summaryTotal}><Text>Saldo{to ? ` al ${formatDate(to)}` : ''}</Text><Text>{formatCOP(statement.closingBalance)}</Text></View>
                </View>

                {statement.pendingInvoices.length > 0 && (
                    <View wrap={false}>
                        <Text style={styles.sectionTitle}>Facturas pendientes de pago</Text>
                        <View style={styles.table}>
                            <View style={styles.tableRow}>
                                <Text style={{ ...dateCell, ...styles.tableHeader }}>Fecha</Text>
                                <Text style={{ ...descriptionCell, ...styles.tableHeader }}>Factura</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Total</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Pagado</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader }}>Saldo</Text>
                            </View>
                            {statement.pendingInvoices.map((invoice) => (
                                <View style={styles.tableRow} key={invoice.number}>
                                    <Text style={dateCell}>{formatDate(invoice.issueDate)}</Text>
                                    <Text style={descriptionCell}>#{invoice.number} · {getItemsSummary(invoice.items)}</Text>
                                    <Text style={styles.tableCell}>{formatCOP(invoice.amount)}</Text>
                                    <Text style={styles.tableCell}>{formatCOP(invoice.paidAmount)}</Text>
                                    <Text style={styles.tableCell}>{formatCOP(getInvoiceBalance(invoice))}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    )

    return (
        <PDFDownloadLink
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            document={<MyDocument />}
            fileName={`Estado de cuenta ${client.name}.pdf`}
        >Descargar PDF
        </PDFDownloadLink>
    )
}
