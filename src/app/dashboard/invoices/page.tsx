"use client";
import { Provider } from "@prisma/client";
import { Card, DateRangePicker, DateRangePickerValue, Select, SelectItem, TextInput, Title } from "@tremor/react";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { ProviderWithProducts } from "@/types/Provider";
import dynamic from "next/dynamic";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { toast } from "react-hot-toast";

const InvoicePDF = dynamic(() => import("../../../components/pdfs/invoice"), {
    ssr: false
});

type PricePrompt = { startDate: string, endDate: string, count: number, total: number };

export default function Invoices() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [dates, setDates] = useState<DateRangePickerValue>({
        from: new Date(), to: new Date()
    });
    const [price, setPrice] = useState<number>(0);
    const [providerSelected, setProviderSelected] = useState<string | null>(null);

    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [providerWithProducts, setProviderWithProducts] = useState<ProviderWithProducts>();

    const [pricePrompt, setPricePrompt] = useState<PricePrompt | null>(null);
    const [savingPrice, setSavingPrice] = useState(false);

    useEffect(() => {
        fetch('/api/providers')
            .then(async (res) => {
                const data = await res.json();
                setProviders(data);
            })
    }, [])

    const handleGenerateInvoice = async (e: any) => {
        e.preventDefault();

        if (!providerSelected || !dates.from || !dates.to || !price) return toast.error('Todos los campos son requeridos');

        const startDate = new Date(dates.from).toISOString().split('T')[0];
        const endDate = new Date(dates.to).toISOString().split('T')[0];

        // const url = `/invoices/pdf/?providerId=${providerSelected}&startDate=${startDate}&endDate=${endDate}&price=${price}`;
        // window.location.href = url;

        const url = `/api/providers/${providerSelected}?startDate=${startDate}&endDate=${endDate}`;

        const res = await fetch(url);

        const data: ProviderWithProducts = await res.json();

        setProviderWithProducts(data);

        // Preguntar si se quiere guardar el precio solo cuando algún registro tiene un precio distinto
        const logsToUpdate = data.products?.filter((product) => product.price !== price) ?? [];
        if (logsToUpdate.length > 0) {
            setPricePrompt({ startDate, endDate, count: logsToUpdate.length, total: data.products.length });
        }
    }

    const handleSavePrice = async () => {
        if (!pricePrompt || !providerSelected) return;

        setSavingPrice(true);
        try {
            const res = await fetch(`/api/providers/${providerSelected}/price`, {
                method: 'PATCH',
                body: JSON.stringify({ startDate: pricePrompt.startDate, endDate: pricePrompt.endDate, price }),
            });

            if (!res.ok) throw new Error(await res.text());

            const { updated } = await res.json();
            toast.success(`Precio de compra actualizado en ${updated} registro(s)`);

            setProviderWithProducts((current) => current && {
                ...current,
                products: current.products.map((product) => ({ ...product, price })),
            });
            setPricePrompt(null);
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar el precio de compra');
        } finally {
            setSavingPrice(false);
        }
    }

    const formatDate = (date: string) => date.split('-').reverse().join('/');
    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <Title className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Facturación</Title>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
                    <form className="space-y-6" onSubmit={handleGenerateInvoice}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Proveedor</label>
                                <Select 
                                    placeholder="Seleccionar proveedor"
                                    value={providerSelected ? providerSelected : undefined}
                                    onValueChange={(value) => setProviderSelected(value)}
                                >
                                    {providers.map((provider) =>
                                        <SelectItem value={provider.id} key={provider.id}>
                                            {`${provider.firstName} ${provider.lastName}`}
                                        </SelectItem>
                                    )}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Precio por litro</label>
                                <TextInput 
                                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)} 
                                    placeholder="Precio por litro"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Período de facturación</label>
                            <DateRangePicker
                                value={dates}
                                onValueChange={setDates}
                                locale={es}
                                selectPlaceholder="Seleccionar fechas"
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-center pt-4">
                            <button 
                                type="submit"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                Generar Factura
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Invoice Preview */}
            {providerWithProducts && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <Title className="text-lg font-semibold">Vista previa de la factura</Title>
                    </div>
                    <div className="p-4 sm:p-6">
                        <InvoicePDF
                            price={price} 
                            provider={providerWithProducts} 
                        />
                    </div>
                </div>
            )}

            {/* Confirmación para guardar el precio de compra del período facturado */}
            <Modal
                isOpen={pricePrompt !== null}
                onClose={() => setPricePrompt(null)}
                isDismissable={!savingPrice}
                placement="center"
                className="mx-4"
            >
                <ModalContent>
                    {pricePrompt && (
                        <>
                            <ModalHeader>¿Actualizar precio de compra?</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-gray-700">
                                    ¿Desea guardar el precio de <strong>{formatPrice(price)}</strong> por litro
                                    para los registros del <strong>{formatDate(pricePrompt.startDate)}</strong> al <strong>{formatDate(pricePrompt.endDate)}</strong>?
                                </p>
                                <p className="text-sm text-gray-500">
                                    {pricePrompt.count} de {pricePrompt.total} registro(s) tienen un precio distinto o sin registrar.
                                </p>
                            </ModalBody>
                            <ModalFooter className="flex-col-reverse sm:flex-row">
                                <Button variant="flat" onPress={() => setPricePrompt(null)} isDisabled={savingPrice}>
                                    No, solo facturar
                                </Button>
                                <Button color="success" className="text-white" onPress={handleSavePrice} isLoading={savingPrice}>
                                    Sí, guardar precio
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}