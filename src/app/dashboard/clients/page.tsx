"use client";
import { useEffect, useState } from "react";
import { HiOutlineBanknotes, HiOutlinePlus, HiOutlineUserGroup, HiOutlineUsers } from "react-icons/hi2";
import { ClientWithSummary } from "@/types/Client";
import { formatCOP } from "@/app/utils/clientInvoice";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchInput from "@/components/ui/SearchInput";
import Segmented from "@/components/ui/Segmented";
import { PageSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";

type Filter = "all" | "debt" | "inactive";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [clients, setClients] = useState<ClientWithSummary[]>();

  useEffect(() => {
    fetch("/api/clients").then(async (res) => {
      setClients(res.ok ? await res.json() : []);
    });
  }, []);

  if (!clients) return <PageSkeleton />;

  const query = search.trim().toLocaleLowerCase();
  const matchesFilter = (client: ClientWithSummary) =>
    filter === "debt" ? client.summary.balance > 0 : filter === "inactive" ? !client.active : true;

  const filteredClients = clients.filter((client) =>
    matchesFilter(client) && `${client.name} ${client.idNum}`.toLocaleLowerCase().includes(query)
  );

  const totalBalance = clients.reduce((acc, client) => acc + client.summary.balance, 0);
  const withDebt = clients.filter((client) => client.summary.balance > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cuentas por cobrar de los clientes a los que les vendes"
        actions={<ButtonLink href="/dashboard/clients/create" icon={<HiOutlinePlus className="h-4 w-4" />}>Nuevo cliente</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Clientes" value={clients.length} icon={<HiOutlineUsers />} tone="emerald" />
        <StatCard label="Con saldo pendiente" value={withDebt} icon={<HiOutlineUserGroup />} tone="amber" />
        <StatCard
          className="col-span-2 md:col-span-1"
          label="Cartera por cobrar"
          value={formatCOP(totalBalance)}
          icon={<HiOutlineBanknotes />}
          tone={totalBalance > 0 ? "red" : "default"}
        />
      </div>

      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Segmented
            label="Filtrar clientes"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Todos", count: clients.length },
              { value: "debt", label: "Con saldo", count: withDebt },
              { value: "inactive", label: "Inactivos", count: clients.filter((client) => !client.active).length },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o documento" className="sm:w-72" />
        </div>

        {filteredClients.length > 0 ? (
          <Table>
            <THead>
              <TH>Cliente</TH>
              <TH className="hidden lg:table-cell">Contacto</TH>
              <TH align="right" className="hidden md:table-cell">Facturado</TH>
              <TH align="right">Saldo</TH>
            </THead>
            <TBody>
              {filteredClients.map((client) => (
                <TR key={client.id} href={`/dashboard/clients/${client.id}`}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 sm:flex">
                        {client.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-slate-900">
                          <span className="line-clamp-2 [overflow-wrap:anywhere]">{client.name}</span>
                          {!client.active && <Badge tone="gray" dot={false}>Inactivo</Badge>}
                        </p>
                        <p className="text-xs text-slate-500">{client.idType} {client.idNum}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden lg:table-cell text-slate-500">
                    {client.phone || client.email || "—"}
                  </TD>
                  <TD align="right" className="hidden md:table-cell tabular-nums">{formatCOP(client.summary.invoiced)}</TD>
                  <TD align="right" className={`tabular-nums font-semibold ${client.summary.balance > 0 ? "text-red-600" : "text-slate-400"}`}>
                    {formatCOP(client.summary.balance)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<HiOutlineUsers />}
            title="Aún no tienes clientes"
            description="Crea tu primer cliente para empezar a facturarle y llevar su cartera."
            action={<ButtonLink href="/dashboard/clients/create" icon={<HiOutlinePlus className="h-4 w-4" />}>Nuevo cliente</ButtonLink>}
          />
        ) : (
          <EmptyState icon={<HiOutlineUsers />} title="Sin resultados" description="Ningún cliente coincide con la búsqueda o el filtro." />
        )}
      </Panel>
    </div>
  );
}
