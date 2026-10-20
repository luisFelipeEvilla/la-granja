"use client";
import { formatCOP, formatDate, formatQuantity, idTypeLabels } from "@/app/utils/clientInvoice";
import { ProviderWithProducts } from "@/types/Provider";
import { InfoGrid, PdfDocument, PdfDownloadButton, PdfTable, SectionTitle, TotalsBox } from "./theme";

type Props = { provider: ProviderWithProducts, price: number }

// payout statement ("liquidación") of the milk a provider delivered in a period
export default function PDFView({ provider, price }: Props) {
    const name = `${provider.firstName} ${provider.lastName}`;
    const totalLiters = provider.products.reduce((total, product) => total + product.quantity, 0);
    const dates = provider.products.map((product) => product.createdAt);
    const period = dates.length ? `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}` : "—";

    const document = (
        <PdfDocument
            title={`Liquidación ${name}`}
            docLabel="Liquidación"
            meta={[
                { label: "Período", value: period },
                { label: "Fecha", value: new Date().toLocaleDateString("es-CO") },
            ]}
        >
            <InfoGrid
                columns={2}
                items={[
                    { label: "Proveedor", value: name },
                    { label: idTypeLabels[provider.idType], value: new Intl.NumberFormat("es-CO").format(provider.idNum) },
                    { label: "Teléfono", value: `(+57) ${provider.phone}` },
                    provider.email && { label: "Correo", value: provider.email },
                ]}
            />

            {/* the amount to pay goes first, so a long month never leaves it alone on the last page */}
            <TotalsBox
                rows={[
                    { label: "Litros entregados", value: `${formatQuantity(totalLiters)} L` },
                    { label: "Precio por litro", value: formatCOP(price) },
                    { label: "Total a pagar", value: formatCOP(totalLiters * price), emphasis: true },
                ]}
            />

            <SectionTitle>Entregas de leche</SectionTitle>
            <PdfTable
                columns={[
                    { label: "Fecha de ingreso", flex: 1.2 },
                    { label: "Producto", flex: 1.6 },
                    { label: "Litros", flex: 1, align: "right" },
                    { label: "Precio por litro", flex: 1.2, align: "right" },
                    { label: "Total", flex: 1.2, align: "right" },
                ]}
                rows={provider.products.map((product) => [
                    formatDate(product.createdAt),
                    "Leche entera",
                    formatQuantity(product.quantity),
                    formatCOP(price),
                    formatCOP(product.quantity * price),
                ])}
                footer={["Total", "", `${formatQuantity(totalLiters)} L`, "", formatCOP(totalLiters * price)]}
                empty="No hay entregas en este período"
            />

        </PdfDocument>
    );

    return <PdfDownloadButton document={document} fileName={`Liquidación ${name}.pdf`} />;
}
