"use client";
import { Provider } from "@prisma/client";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const InvoicePDF = dynamic(() => import("../../componeents/pdfs/invoice"), {
    ssr: false
});

export default function InvoicesPdf({ searchParams }: any) {
    const [provider, setProvider] = useState<Provider>();

    useEffect(() => {
        const { provider, startDate, endDate, price } = searchParams;

        fetch(`/api/providers/${provider}`)
    }, [])

    
    return (
        <InvoicePDF/>
    )
}