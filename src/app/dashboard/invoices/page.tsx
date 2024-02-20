"use client";
import { Provider } from "@prisma/client";
import { Card, DateRangePicker, DateRangePickerValue, Select, SelectItem, TextInput, Title } from "@tremor/react";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { ProviderWithProducts } from "@/types/Provider";
import dynamic from "next/dynamic";

const InvoicePDF = dynamic(() => import("../componeents/pdfs/invoice"), {
    ssr: false
});

export default function Invoices() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date()
    });
    const [price, setPrice] = useState<number>(0);
    const [providerSelected, setProviderSelected] = useState<string | null>(null);

    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [providerWithProducts, setProviderWithProducts] = useState<ProviderWithProducts>();

    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);
            })
    }, [])

    const handleGenerateInvoice = async (e: any) => {
        e.preventDefault();

        if (!providerSelected || !dates.from || !dates.to || !price) return alert('Todos los campos son requeridos');

        const startDate = new Date(dates.from).toISOString().split('T')[0];
        const endDate = new Date(dates.to).toISOString().split('T')[0];

        // const url = `/invoices/pdf/?providerId=${providerSelected}&startDate=${startDate}&endDate=${endDate}&price=${price}`;
        // window.location.href = url;

        const url = `/api/providers/${providerSelected}?startDate=${startDate}&endDate=${endDate}`;

        const res = await fetch(url);

        const data = await res.json();

        setProviderWithProducts(data);
    }

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full py-5">
            <Title className="text-center mb-3">Facturación</Title>

            <Card className="w-[400px] mb-4 ">
                <form className="grid gap-3" onSubmit={handleGenerateInvoice}>
                    <Select placeholder="Seleccionar proveedor"
                        value={providerSelected ? providerSelected : undefined}
                        onValueChange={(value) => setProviderSelected(value)}
                    >
                        {
                            providers.map((provider, index) =>
                                <SelectItem value={provider.id} key={provider.id}> {`${provider.firstName} ${provider.lastName}`} </SelectItem>
                            )
                        }
                    </Select>

                    <DateRangePicker
                        value={dates}
                        onValueChange={setDates}
                        locale={es}
                        selectPlaceholder="Fechas"
                    />

                    <TextInput onChange={(e) => setPrice(parseInt(e.target.value) || 0)} placeholder="Precio" />

                    <button className="rounded-md px-4 py-2 bg-green-500 text-white hover:bg-green-600">
                        Generar factura
                    </button>

                    {
                        providerWithProducts && 
                            <InvoicePDF
                                price={price} 
                                provider={providerWithProducts} 
                            />                     
                    }
                </form>
            </Card>
        </div>
    )
}