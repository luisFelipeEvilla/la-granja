"use client";
import { ProviderWithProducts } from "@/types/Provider";
import { renderToFile, renderToStream } from "@react-pdf/renderer";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const InvoicePDF = dynamic(() => import("../../../../components/pdfs/invoice"), {
    ssr: false
});

// import InvoicePDF from "../../componeents/pdfs/invoice";

export default function InvoicesPdf({ searchParams }: any) {
    const [provider, setProvider] = useState<ProviderWithProducts>({} as ProviderWithProducts);
    const [loading, setLoading] = useState(true);
    const { providerId, startDate, endDate, price } = searchParams;

    useEffect(() => {

        const url = `/api/providers/${providerId}?startDate=${startDate}&endDate=${endDate}`;

        fetch(url)
            .then(async (res) => {
                const data = await res.json();
                setProvider(data);
                setLoading(false);
            });
    }, [])

    return loading ? <p>Cargando...</p> : <InvoicePDF price={price} provider={provider}/>
    
}