"use client";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Title,
  Text,
  TextInput,
  Metric,
  Switch
} from "@tremor/react";
import { SearchIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";
import { ClientWithSummary } from "@/types/Client";
import { formatCOP } from "@/app/utils/clientInvoice";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

export default function Clients() {
  const [search, setSearch] = useState<string>("");
  const [clients, setClients] = useState<ClientWithSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/clients").then(async (res) => {
      if (res.ok) setClients(await res.json());
    });
  }, []);

  const filteredClients = clients.filter((client) =>
    `${client.name} ${client.idNum}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  const totalBalance = clients.reduce((acc, client) => acc + client.summary.balance, 0);

  const handleChangeClientState = async (client: ClientWithSummary) => {
    try {
      setLoading(true);
      await axios.patch(`/api/clients/${client.id}`, { active: !client.active });

      setClients(clients.map((c) => c.id === client.id ? { ...c, active: !client.active } : c));
      toast.success("Estado del cliente actualizado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado del cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</Title>
          <a
            href="/dashboard/clients/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 sm:w-auto w-full"
          >
            Agregar Cliente
          </a>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4" decoration="top" decorationColor="green">
          <Text className="text-sm font-medium text-gray-600">Clientes</Text>
          <Metric className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">
            {clients.length}
          </Metric>
        </Card>
        <Card className="p-4" decoration="top" decorationColor="red">
          <Text className="text-sm font-medium text-gray-600">Cartera por cobrar</Text>
          <Metric className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">
            {formatCOP(totalBalance)}
          </Metric>
        </Card>
      </div>

      {/* Search and Table Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Title className="text-lg sm:text-xl font-semibold">Lista de clientes</Title>
            <TextInput
              className="w-full sm:w-64"
              icon={SearchIcon}
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHead>
              <TableRow>
                <TableCell className="whitespace-nowrap">Nombre</TableCell>
                <TableCell className="whitespace-nowrap hidden sm:table-cell">Identificación</TableCell>
                <TableCell className="whitespace-nowrap hidden md:table-cell">Facturado</TableCell>
                <TableCell className="whitespace-nowrap">Saldo</TableCell>
                <TableCell className="whitespace-nowrap">Activo</TableCell>
                <TableCell className="whitespace-nowrap">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="whitespace-nowrap font-medium">
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      <span className="sm:hidden text-xs text-gray-500">{client.idType} {client.idNum}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap hidden sm:table-cell">{client.idType} {client.idNum}</TableCell>
                  <TableCell className="whitespace-nowrap hidden md:table-cell">{formatCOP(client.summary.invoiced)}</TableCell>
                  <TableCell className={`whitespace-nowrap font-medium ${client.summary.balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCOP(client.summary.balance)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={client.active}
                      onChange={() => handleChangeClientState(client)}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredClients.length === 0 && (
          <div className="p-8 text-center">
            <Text className="text-gray-500">No se encontraron clientes</Text>
          </div>
        )}
      </div>
    </div>
  );
}
