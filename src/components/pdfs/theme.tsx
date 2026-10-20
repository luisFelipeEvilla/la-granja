"use client";
import { Document, type DocumentProps, Image, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ReactElement, ReactNode, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { HiOutlineArrowDownTray } from "react-icons/hi2";

// shared look of every PDF: brand header, info grid, tables, totals and footer
export const colors = {
    brand: "#059669",
    brandDark: "#047857",
    brandFaint: "#ecfdf5",
    ink: "#0f172a",
    text: "#334155",
    muted: "#64748b",
    border: "#e2e8f0",
    zebra: "#f8fafc",
    danger: "#dc2626",
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 36,
        paddingBottom: 56,
        paddingHorizontal: 36,
        fontFamily: "Helvetica",
        fontSize: 9,
        color: colors.text,
    },
    accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: colors.brand },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
    brand: { flexDirection: "row", alignItems: "center" },
    logo: { width: 64, height: 45, objectFit: "cover", borderRadius: 6, marginRight: 12 },
    company: { fontFamily: "Helvetica-Bold", fontSize: 15, color: colors.ink },
    companySub: { fontSize: 8.5, color: colors.muted, marginTop: 3 },
    docBox: { alignItems: "flex-end" },
    docLabel: { fontFamily: "Helvetica-Bold", fontSize: 17, color: colors.ink, letterSpacing: 0.3 },
    docMetaRow: { flexDirection: "row", marginTop: 4 },
    docMetaLabel: { fontSize: 8.5, color: colors.muted, marginRight: 6 },
    docMetaValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: colors.text },
    badge: {
        marginTop: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: colors.danger,
        backgroundColor: "#fef2f2",
    },
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    infoItem: { paddingVertical: 4, paddingRight: 10 },
    infoLabel: { fontSize: 7.5, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
    infoValue: { fontSize: 10, color: colors.ink },
    sectionTitle: {
        fontFamily: "Helvetica-Bold",
        fontSize: 10.5,
        color: colors.ink,
        marginBottom: 8,
    },
    table: { marginBottom: 18 },
    tableHeader: { flexDirection: "row", backgroundColor: colors.ink, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    tableHeaderCell: {
        paddingVertical: 7,
        paddingHorizontal: 8,
        fontFamily: "Helvetica-Bold",
        fontSize: 8,
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
    tableCell: { paddingVertical: 6, paddingHorizontal: 8, fontSize: 9 },
    tableFooter: { flexDirection: "row", backgroundColor: colors.brandFaint, borderBottomWidth: 1, borderBottomColor: colors.brand },
    tableFooterCell: { paddingVertical: 7, paddingHorizontal: 8, fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.ink },
    emptyRow: { paddingVertical: 12, textAlign: "center", color: colors.muted, borderBottomWidth: 1, borderBottomColor: colors.border },
    totals: { alignSelf: "flex-end", width: 230, marginBottom: 18 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 10 },
    totalsLabel: { color: colors.muted, fontSize: 9.5 },
    totalsValue: { color: colors.ink, fontSize: 9.5 },
    totalsEmphasis: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: colors.brand,
        borderRadius: 4,
    },
    totalsEmphasisText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 11 },
    notes: {
        borderLeftWidth: 3,
        borderLeftColor: colors.brand,
        backgroundColor: colors.zebra,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 18,
    },
    notesTitle: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: colors.ink, marginBottom: 3 },
    notesText: { fontSize: 9, color: colors.text, lineHeight: 1.4 },
    footer: {
        position: "absolute",
        bottom: 24,
        left: 36,
        right: 36,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        fontSize: 7.5,
        color: colors.muted,
    },
    watermark: {
        position: "absolute",
        top: 330,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: "Helvetica-Bold",
        fontSize: 96,
        color: colors.danger,
        opacity: 0.08,
        transform: "rotate(-30deg)",
    },
});

type Meta = { label: string, value: string };

type PdfDocumentProps = {
    title: string,
    docLabel: string,
    meta?: Meta[],
    // short red tag under the document title (e.g. "ANULADA")
    badge?: string,
    watermark?: string,
    children: ReactNode
};

const generatedAt = () => new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });

export function PdfDocument({ title, docLabel, meta = [], badge, watermark, children }: PdfDocumentProps) {
    return (
        <Document title={title} author="Lácteos La Granja" creator="La Granja">
            <Page size="LETTER" style={styles.page}>
                <View style={styles.accentBar} fixed />
                {watermark && <Text style={styles.watermark} fixed>{watermark}</Text>}

                <View style={styles.header}>
                    <View style={styles.brand}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image style={styles.logo} src="/images/logo.jpg" />
                        <View>
                            <Text style={styles.company}>Lácteos La Granja</Text>
                            <Text style={styles.companySub}>Distribuidora de productos lácteos</Text>
                        </View>
                    </View>
                    <View style={styles.docBox}>
                        <Text style={styles.docLabel}>{docLabel}</Text>
                        {meta.map((item) => (
                            <View style={styles.docMetaRow} key={item.label}>
                                <Text style={styles.docMetaLabel}>{item.label}</Text>
                                <Text style={styles.docMetaValue}>{item.value}</Text>
                            </View>
                        ))}
                        {badge && <Text style={styles.badge}>{badge}</Text>}
                    </View>
                </View>

                {children}

                <View style={styles.footer} fixed>
                    <Text>Lácteos La Granja · Generado el {generatedAt()}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
}

// falsy items are skipped, so optional fields can be passed as `value && { ... }`
export function InfoGrid({ items, columns = 2 }: { items: (Meta | false | null | undefined | "")[], columns?: number }) {
    const visible = items.filter(Boolean) as Meta[];
    const width = `${100 / columns}%`;

    return (
        <View style={styles.infoGrid}>
            {visible.map((item) => (
                <View style={{ ...styles.infoItem, width }} key={item.label}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                </View>
            ))}
        </View>
    );
}

export function SectionTitle({ children }: { children: ReactNode }) {
    return <Text style={styles.sectionTitle}>{children}</Text>;
}

export type Column = { label: string, flex?: number, align?: "left" | "right" | "center" };

type TableProps = {
    columns: Column[],
    rows: string[][],
    footer?: string[],
    empty?: string
};

// header in dark ink, zebra rows, numbers right aligned
export function PdfTable({ columns, rows, footer, empty = "Sin registros" }: TableProps) {
    const cellStyle = (column: Column) => ({ flex: column.flex ?? 1, textAlign: column.align ?? "left" });

    return (
        <View style={styles.table}>
            <View style={styles.tableHeader} fixed>
                {columns.map((column) => (
                    <Text key={column.label} style={{ ...styles.tableHeaderCell, ...cellStyle(column) }}>{column.label}</Text>
                ))}
            </View>
            {rows.length === 0 && <Text style={styles.emptyRow}>{empty}</Text>}
            {rows.map((row, rowIndex) => (
                <View
                    key={rowIndex}
                    wrap={false}
                    style={{ ...styles.tableRow, backgroundColor: rowIndex % 2 ? colors.zebra : "#ffffff" }}
                >
                    {row.map((value, index) => (
                        <Text key={index} style={{ ...styles.tableCell, ...cellStyle(columns[index]) }}>{value}</Text>
                    ))}
                </View>
            ))}
            {footer && (
                <View style={styles.tableFooter} wrap={false}>
                    {footer.map((value, index) => (
                        <Text key={index} style={{ ...styles.tableFooterCell, ...cellStyle(columns[index]) }}>{value}</Text>
                    ))}
                </View>
            )}
        </View>
    );
}

export type TotalRow = { label: string, value: string, emphasis?: boolean };

export function TotalsBox({ rows }: { rows: TotalRow[] }) {
    return (
        <View style={styles.totals} wrap={false}>
            {rows.map((row) => row.emphasis ? (
                <View style={styles.totalsEmphasis} key={row.label}>
                    <Text style={styles.totalsEmphasisText}>{row.label}</Text>
                    <Text style={styles.totalsEmphasisText}>{row.value}</Text>
                </View>
            ) : (
                <View style={styles.totalsRow} key={row.label}>
                    <Text style={styles.totalsLabel}>{row.label}</Text>
                    <Text style={styles.totalsValue}>{row.value}</Text>
                </View>
            ))}
        </View>
    );
}

export function Notes({ title = "Notas", children }: { title?: string, children: ReactNode }) {
    return (
        <View style={styles.notes} wrap={false}>
            <Text style={styles.notesTitle}>{title}</Text>
            <Text style={styles.notesText}>{children}</Text>
        </View>
    );
}

// generates the PDF only when tapped (not on every render of the page, which is slow on iPad and
// can make react-pdf fail when a new render starts before the previous one finished)
export function PdfDownloadButton({ document: pdfDocument, fileName }: { document: ReactElement, fileName: string }) {
    const [generating, setGenerating] = useState(false);

    const download = async () => {
        if (generating) return;
        setGenerating(true);
        try {
            const blob = await pdf(pdfDocument as ReactElement<DocumentProps>).toBlob();
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            console.error(error);
            toast.error("No se pudo generar el PDF");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button onClick={download} loading={generating} icon={<HiOutlineArrowDownTray className="h-4 w-4" />}>
            {generating ? "Generando PDF..." : "Descargar PDF"}
        </Button>
    );
}
