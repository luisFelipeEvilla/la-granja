"use client";
import { Switch } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineCheckCircle, HiOutlinePauseCircle, HiOutlinePlus, HiOutlineTruck } from "react-icons/hi2";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchInput from "@/components/ui/SearchInput";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

type Filter = "all" | "active" | "inactive";

export default function Providers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [providers, setProviders] = useState<Provider[]>();
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/providers").then(async (res) => {
      setProviders(res.ok ? await res.json() : []);
    });
  }, []);

  if (!providers) return <PageSkeleton />;

  const handleChangeProviderState = async (provider: Provider) => {
    const active = !provider.active;
    try {
      setUpdating(provider.id);
      await axios.patch(`/api/providers/${provider.id}`, { active });

      setProviders(providers.map((p) => p.id === provider.id ? { ...p, active } : p));
      toast.success(active ? "Proveedor activado" : "Proveedor desactivado");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado del proveedor");
    } finally {
      setUpdating(null);
    }
  }

  const activeCount = providers.filter((provider) => provider.active).length;
  const query = search.trim().toLocaleLowerCase();
  const filteredProviders = providers.filter((provider) =>
    (filter === "active" ? provider.active : filter === "inactive" ? !provider.active : true) &&
    `${provider.firstName} ${provider.lastName} ${provider.idNum} ${provider.phone}`.toLocaleLowerCase().includes(query)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Productores que entregan leche a la planta"
        actions={<ButtonLink href="/dashboard/providers/create" icon={<HiOutlinePlus className="h-4 w-4" />}>Nuevo proveedor</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Proveedores" value={providers.length} icon={<HiOutlineTruck />} tone="emerald" />
        <StatCard label="Activos" value={activeCount} icon={<HiOutlineCheckCircle />} tone="blue" hint="Aparecen en la planilla" />
        <StatCard className="col-span-2 md:col-span-1" label="Inactivos" value={providers.length - activeCount} icon={<HiOutlinePauseCircle />} />
      </div>

      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Segmented
            label="Filtrar proveedores"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Todos", count: providers.length },
              { value: "active", label: "Activos", count: activeCount },
              { value: "inactive", label: "Inactivos", count: providers.length - activeCount },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, documento o teléfono" className="sm:w-80" />
        </div>

        {filteredProviders.length > 0 ? (
          <Table>
            <THead>
              <TH>Proveedor</TH>
              <TH className="hidden md:table-cell">Teléfono</TH>
              <TH className="hidden lg:table-cell">Correo</TH>
              <TH align="right">Activo</TH>
            </THead>
            <TBody>
              {filteredProviders.map((provider) => (
                <TR key={provider.id} href={`/dashboard/providers/${provider.id}`}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:flex
                        ${provider.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {`${provider.firstName.charAt(0)}${provider.lastName.charAt(0)}`.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className={`line-clamp-2 wrap-anywhere font-medium ${provider.active ? "text-slate-900" : "text-slate-500"}`}>
                          {provider.firstName} {provider.lastName}
                        </p>
                        <p className="wrap-anywhere text-xs text-slate-500">
                          {provider.idType} {provider.idNum}
                          <span className="md:hidden"> · {provider.phone}</span>
                        </p>
                        {provider.email && <p className="wrap-anywhere text-xs text-slate-500 lg:hidden">{provider.email}</p>}
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell tabular-nums">{provider.phone}</TD>
                  <TD className="hidden lg:table-cell text-slate-500 wrap-anywhere">{provider.email || "—"}</TD>
                  <TD align="right">
                    {/* toggling must not open the provider */}
                    <div className="inline-flex justify-end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <Switch
                        checked={provider.active}
                        onChange={() => handleChangeProviderState(provider)}
                        disabled={updating === provider.id}
                        color="emerald"
                        aria-label={provider.active ? "Desactivar proveedor" : "Activar proveedor"}
                      />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={<HiOutlineTruck />}
            title="Aún no tienes proveedores"
            description="Registra a los productores que entregan leche para llevar su planilla."
            action={<ButtonLink href="/dashboard/providers/create" icon={<HiOutlinePlus className="h-4 w-4" />}>Nuevo proveedor</ButtonLink>}
          />
        ) : (
          <EmptyState icon={<HiOutlineTruck />} title="Sin resultados" description="Ningún proveedor coincide con la búsqueda o el filtro." />
        )}
      </Panel>
    </div>
  );
}
