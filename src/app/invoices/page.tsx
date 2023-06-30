"use client";
import { Provider } from "@prisma/client";
import { Card, DateRangePicker, DateRangePickerValue, Select, SelectItem, TextInput, Title } from "@tremor/react";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";

export default function Invoices() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date() 
    });
    const [price, setPrice] = useState<number>(0);

    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);
            })
    }, [])
    
    return (
        <div className="flex flex-col justify-center items-center h-full w-full py-5">
            <Title className="text-center mb-3">Facturación</Title>

            <Card className="grid gap-3 w-[400px] h-fit ">
                <Select placeholder="Seleccionar proveedor">
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

                <TextInput placeholder="Precio"  />
            </Card>
        </div>
    )
}