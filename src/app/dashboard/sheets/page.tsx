"use client";
import { useContext, useEffect, useState } from "react";
import { MilkRouteLog, Product, ProductLog, Provider, user_role } from "@prisma/client";
import { MilkRouteLogWithProvider } from "@/types/Product";
import { toast } from "react-hot-toast";
import axios from "axios";
import { HiOutlineChartBar } from "react-icons/hi2";
import { AuthContext } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchInput from "@/components/ui/SearchInput";
import StatCard from "@/components/ui/StatCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import MilkSheetList, { SheetProgress } from "@/components/dashboard/MilkSheetList";

// today's local calendar day at UTC midnight, the format the sheets API uses
const today = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const formatLiters = (value: number) => `${new Intl.NumberFormat("es-CO").format(value)} L`;

export default function Sheet() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [milkSheet, setMilkSheet] = useState<MilkRouteLogWithProvider[]>([]);
  const [date, setDate] = useState<Date>(today);
  const [saving, setSaving] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsSheet, setProductsSheet] = useState<ProductLog[]>([]);

  const { user } = useContext(AuthContext);
  const readOnly = user?.role === user_role.USER;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (providers.length > 0) fetchSheet();
  }, [date, providers]);

  async function fetchData() {
    try {
      const [providersRequest, products] = await Promise.all([
        axios.get("/api/providers"),
        axios.get("/api/products"),
      ]);

      const activeProviders = providersRequest.data.filter(
        (provider: Provider) => provider.active
      );
      setProviders(activeProviders);

      setMilkSheet(activeProviders.map((provider: Provider) => ({ providerId: provider.id, quantity: 0 })));

      setProducts(products.data);
      setProductsSheet(products.data.map((product: Product) => ({ productId: product.id, quantity: 0 })));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los proveedores");
    } finally {
      setLoaded(true);
    }
  }

  const fetchSheet = async () => {
    try {
      const realDate = date.toISOString().split("T")[0];
      const MilkLogs = await axios.get(`/api/sheets?date=${realDate}`);

      // update sheet with the saved quantities of that day (functional update: the request may
      // finish after the providers were loaded, so never map over a stale copy of the sheet)
      setMilkSheet((current) => current.map((product) => {
        const saved = MilkLogs.data.find((p: MilkRouteLog) => p.providerId === product.providerId);
        return { ...product, quantity: saved ? saved.quantity : 0 };
      }));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la planilla");
    }
  };

  const handleDateChange = (e: any) => {
    if (!e.target.value) return;
    setDate(new Date(e.target.value));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setMilkSheet((current) => current.map((product) =>
      product.providerId === id ? { ...product, quantity } : product
    ));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // avoid duplicate submissions (double click) while a save is in flight
    if (saving) return;
    setSaving(true);

    //  remove time zone from date
    const aux = date.toISOString().split("T")[0];

    try {
      await axios.post("/api/sheets", {
        date: new Date(aux),
        products: milkSheet,
      });

      toast.success("Planilla guardada con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la planilla");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <PageSkeleton stats={2} rows={8} />;

  const rows = milkSheet.map((product) => {
    const provider = providers.find((provider) => provider.id === product.providerId);
    return { id: product.providerId, name: `${provider?.firstName ?? ""} ${provider?.lastName ?? ""}`.trim(), quantity: product.quantity };
  });
  const totalLiters = milkSheet.reduce((acc, product) => acc + product.quantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planilla de recolección"
        description="Litros de leche recibidos de cada proveedor en el día"
        actions={
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            Fecha
            <input
              type="date"
              value={date.toISOString().split("T")[0]}
              onChange={handleDateChange}
              disabled={readOnly}
              className="h-11 rounded-lg border-0 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total del día" value={formatLiters(totalLiters)} icon={<HiOutlineChartBar />} tone="emerald" />
        <SheetProgress rows={rows} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel
          flush
          title="Proveedores"
          description={readOnly ? "Solo lectura" : "Toca un campo y usa “Siguiente” en el teclado para pasar al próximo proveedor"}
          actions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar proveedor" className="w-full sm:w-64" />}
        >
          <MilkSheetList rows={rows} onChange={handleQuantityChange} disabled={readOnly} search={search} />
        </Panel>

        {/* save button stays reachable at the bottom of long sheets */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white px-4 py-3 safe-bottom sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">{formatLiters(totalLiters)}</p>
            </div>
            <Button type="submit" size="lg" loading={saving}>
              {saving ? "Guardando..." : "Guardar planilla"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
