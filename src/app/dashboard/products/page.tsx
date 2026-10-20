"use client";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchInput from "@/components/ui/SearchInput";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { Product, unit } from "@prisma/client";
import { Select, SelectItem, TextInput } from "@tremor/react";
import { useEffect, useState } from "react";
import { HiOutlineCheck, HiOutlineCube, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import toast from "react-hot-toast";

const unitLabels: Record<unit, string> = {
    Lts: 'Litros (Lts)',
    Kg: 'Kilos (Kg)',
    Und: 'Unidades (Und)'
};

type Draft = { name: string, unit: string };

function UnitSelect({ value, onChange, error }: { value: string, onChange: (value: string) => void, error?: boolean }) {
    return (
        <Select value={value} onValueChange={onChange} placeholder="Seleccionar unidad" enableClear={false} error={error}>
            {Object.entries(unitLabels).map(([value, label]) =>
                <SelectItem value={value} key={value}>{label}</SelectItem>
            )}
        </Select>
    );
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>();
    const [newProduct, setNewProduct] = useState<Draft>({ name: '', unit: '' });
    const [showErrors, setShowErrors] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState<Draft>({ name: '', unit: '' });
    const [saving, setSaving] = useState<'new' | 'edit' | null>(null);
    const [search, setSearch] = useState('');

    const loadProducts = async () => {
        const res = await fetch('/api/products');
        setProducts(res.ok ? await res.json() : []);
    };

    useEffect(() => { loadProducts() }, []);

    const saveProduct = async (url: string, method: string, body: Draft, kind: 'new' | 'edit') => {
        if (!body.name.trim() || !body.unit) {
            toast.error('Nombre y unidad son requeridos');
            return false;
        }

        setSaving(kind);
        const res = await fetch(url, { method, body: JSON.stringify(body) });
        setSaving(null);

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
        setShowErrors(true);
        if (await saveProduct('/api/products', 'POST', newProduct, 'new')) {
            setNewProduct({ name: '', unit: '' });
            setShowErrors(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (await saveProduct(`/api/products/${id}`, 'PATCH', draft, 'edit')) setEditing(null);
    };

    const startEditing = (product: Product) => {
        setEditing(product.id);
        setDraft({ name: product.name, unit: product.unit });
    };

    if (!products) return <PageSkeleton stats={0} />;

    const query = search.trim().toLocaleLowerCase();
    const filteredProducts = products.filter((product) => product.name.toLocaleLowerCase().includes(query));

    return (
        <div className="space-y-6">
            <PageHeader title="Productos" description="Catálogo de productos que vendes a tus clientes en las facturas" />

            <form onSubmit={handleCreate} noValidate>
                <Panel title="Nuevo producto" description="El precio se define en cada factura.">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-start">
                        <Field label="Nombre" htmlFor="new-product-name" required error={showErrors && !newProduct.name.trim() && 'Ingresa un nombre'}>
                            <TextInput
                                id="new-product-name"
                                value={newProduct.name}
                                onValueChange={(name) => setNewProduct({ ...newProduct, name })}
                                placeholder="Ej: Queso costeño"
                                error={showErrors && !newProduct.name.trim()}
                            />
                        </Field>
                        <Field label="Unidad" required error={showErrors && !newProduct.unit && 'Elige una unidad'}>
                            <UnitSelect
                                value={newProduct.unit}
                                onChange={(unit) => setNewProduct({ ...newProduct, unit })}
                                error={showErrors && !newProduct.unit}
                            />
                        </Field>
                        <div className="md:pt-[26px]">
                            <Button type="submit" loading={saving === 'new'} icon={<HiOutlinePlus className="h-4 w-4" />} fullWidth>
                                Agregar
                            </Button>
                        </div>
                    </div>
                </Panel>
            </form>

            <Panel flush>
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Catálogo</h2>
                        <p className="text-sm text-slate-500">{products.length} producto(s)</p>
                    </div>
                    <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto" className="sm:w-72" />
                </div>

                {filteredProducts.length > 0 ? (
                    <Table>
                        <THead>
                            <TH>Producto</TH>
                            <TH className="hidden sm:table-cell">Unidad</TH>
                            <TH align="right"><span className="sr-only">Acciones</span></TH>
                        </THead>
                        <TBody>
                            {filteredProducts.map((product) => editing === product.id ? (
                                <TR key={product.id} className="bg-emerald-50/40">
                                    {/* inline editor spans the whole row */}
                                    <td colSpan={3} className="px-4 py-3.5 sm:px-6">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-center">
                                            <TextInput
                                                value={draft.name}
                                                onValueChange={(name) => setDraft({ ...draft, name })}
                                                aria-label="Nombre del producto"
                                                autoFocus
                                            />
                                            <UnitSelect value={draft.unit} onChange={(unit) => setDraft({ ...draft, unit })} />
                                            <div className="flex gap-2">
                                                <Button variant="secondary" onClick={() => setEditing(null)} icon={<HiOutlineXMark className="h-4 w-4" />} className="flex-1 md:flex-none">
                                                    Cancelar
                                                </Button>
                                                <Button onClick={() => handleUpdate(product.id)} loading={saving === 'edit'} icon={<HiOutlineCheck className="h-4 w-4" />} className="flex-1 md:flex-none">
                                                    Guardar
                                                </Button>
                                            </div>
                                        </div>
                                    </td>
                                </TR>
                            ) : (
                                <TR key={product.id}>
                                    <TD>
                                        <div className="flex items-center gap-3">
                                            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:flex">
                                                <HiOutlineCube className="h-5 w-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900">{product.name}</p>
                                                <p className="text-xs text-slate-500 sm:hidden">{unitLabels[product.unit]}</p>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD className="hidden sm:table-cell"><Badge tone="gray" dot={false}>{unitLabels[product.unit]}</Badge></TD>
                                    <TD align="right">
                                        <Button variant="ghost" size="sm" onClick={() => startEditing(product)} icon={<HiOutlinePencilSquare className="h-4 w-4" />}>
                                            Editar
                                        </Button>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={<HiOutlineCube />}
                        title="Aún no hay productos"
                        description="Agrega los productos que vendes para poder usarlos en las facturas."
                    />
                ) : (
                    <EmptyState icon={<HiOutlineCube />} title="Sin resultados" description="Ningún producto coincide con la búsqueda." />
                )}
            </Panel>
        </div>
    )
}
