"use client";
import { ProviderWithProducts } from "@/types/Provider";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const InvoicePDF = dynamic(() => import("../../componeents/pdfs/invoice"), {
    ssr: false
});

export default function InvoicesPdf({ searchParams }: any) {
    const [provider, setProvider] = useState<ProviderWithProducts>({} as ProviderWithProducts);
    const [loading, setLoading] = useState(true);
    const { provider: providerId, startDate, endDate, price } = searchParams;

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