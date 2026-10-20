"use client";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { Product, unit } from "@prisma/client";
import { Select, SelectItem, Text, TextInput, Title } from "@tremor/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const unitLabels: Record<unit, string> = {
    Lts: 'Litros (Lts)',
    Kg: 'Kilos (Kg)',
    Und: 'Unidades (Und)'
};

type Draft = { name: string, unit: string };

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [newProduct, setNewProduct] = useState<Draft>({ name: '', unit: '' });
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState<Draft>({ name: '', unit: '' });
    const [saving, setSaving] = useState(false);

    const loadProducts = async () => {
        const res = await fetch('/api/products');
        if (res.ok) setProducts(await res.json());
    };

    useEffect(() => { loadProducts() }, []);

    const saveProduct = async (url: string, method: string, body: Draft) => {
        if (!body.name.trim() || !body.unit) {
            toast.error('Nombre y unidad son requeridos');
            return false;
        }

        setSaving(true);
        const res = await fetch(url, { method, body: JSON.stringify(body) });
        setSaving(false);

        if (!res.ok) {
            toast.error('Error al guardar el producto');
            return false;
        }

        toast.success('Producto guardado');
        loadProducts();
        return true;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await saveProduct('/api/products', 'POST', newProduct)) setNewProduct({ name: '', unit: '' });
    };

    const handleUpdate = async (id: string) => {
        if (await saveProduct(`/api/products/${id}`, 'PATCH', draft)) setEditing(null);
    };

    const startEditing = (product: Product) => {
        setEditing(product.id);
        setDraft({ name: product.name, unit: product.unit });
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Productos</Title>
                <Text className="mt-1">Productos que se venden a los clientes en las facturas</Text>
            </div>

            {/* New product */}
            <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold text-gray-900">Nuevo producto</Title>
                </div>
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_14rem_auto] gap-4 md:items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nombre *</label>
                        <TextInput
                            value={newProduct.name}
                            onValueChange={(name) => setNewProduct({ ...newProduct, name })}
                            placeholder="Ej: Queso costeño"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Unidad *</label>
                        <Select
                            value={newProduct.unit}
                            onValueChange={(unit) => setNewProduct({ ...newProduct, unit })}
                            placeholder="Seleccionar unidad"
                            enableClear={false}
                        >
                            {Object.entries(unitLabels).map(([value, label]) =>
                                <SelectItem value={value} key={value}>{label}</SelectItem>
                            )}
                        </Select>
                    </div>
                    <PrimaryButton text="Agregar" disabled={saving} />
                </div>
            </form>

            {/* Product list */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold">Lista de productos</Title>
                </div>
                <ul className="divide-y divide-gray-200">
                    {products.map((product) => (
                        <li key={product.id} className="p-4 sm:px-6">
                            {editing === product.id ? (
                                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_14rem_auto] gap-3 md:items-center">
                                    <TextInput value={draft.name} onValueChange={(name) => setDraft({ ...draft, name })} />
                                    <Select value={draft.unit} onValueChange={(unit) => setDraft({ ...draft, unit })} enableClear={false}>
                                        {Object.entries(unitLabels).map(([value, label]) =>
                                            <SelectItem value={value} key={value}>{label}</SelectItem>
                                        )}
                                    </Select>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(null)}
                                            className="min-h-[44px] flex-1 md:flex-none px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdate(product.id)}
                                            disabled={saving}
                                            className="min-h-[44px] flex-1 md:flex-none px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <Text className="text-sm text-gray-500">{unitLabels[product.unit]}</Text>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startEditing(product)}
                                        className="min-h-[44px] px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {products.length === 0 && (
                    <div className="p-8 text-center">
                        <Text className="text-gray-500">No hay productos registrados</Text>
                    </div>
                )}
            </div>
        </div>
    )
}
