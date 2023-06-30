"use client";
import { Provider } from "@prisma/client";
import { Card, DateRangePicker, DateRangePickerValue, Select, SelectItem, TextInput, Title } from "@tremor/react";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import PrimaryButton from "../componeents/buttons/PrimaryButton";

export default function Invoices() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date()
    });
    const [price, setPrice] = useState<number>(0);
    const [providerSelected, setProviderSelected] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);
            })
    }, [])

    const handleGenerateInvoice = (e: any) => {
        e.preventDefault();

        if (!providerSelected || !dates.from || !dates.to || !price) return alert('Todos los campos son requeridos');    

        const startDate = new Date(dates.from).toISOString().split('T')[0];
        const endDate = new Date(dates.to).toISOString().split('T')[0];

        const url = `/invoices/pdf/?providerId=${providerSelected}&startDate=${startDate}&endDate=${endDate}&price=${price}`;

        window.location.href = url;
    }

    return (
        <div className="flex flex-col justify-center items-center h-full w-full py-5">
            <Title className="text-center mb-3">Facturación</Title>

            <Card className="w-[400px] h-fit mb-4 ">
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

                    <button  className="rounded-md px-4 py-2 bg-green-500 text-white hover:bg-green-600">
                        Generar factura
                    </button>
                </form>
            </Card>
        </div>
    )
}