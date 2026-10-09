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
  BarChart,
  Badge,
  Switch
} from "@tremor/react";
import { SearchIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";
import { Provider } from "@prisma/client";
import { ProviderWithProducts } from "@/types/Provider";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

export default function Providers() {
  const [search, setSearch] = useState<string>("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/providers").then(async (res) => {
      const data = await res.json();
      setProviders(data);

      const aux = data.map((provider: ProviderWithProducts) => {
        const cantidad = provider.products.reduce(
          (acc, product) => acc + product.quantity,
          0
        );
        return {
          provider: `${provider.firstName} ${provider.lastName}`,
          Cantidad: cantidad,
        };
      });

      setProducts(aux);
    });
  }, []);

  useEffect(() => {
    const filtered = providers.filter((provider) =>
      `${provider.firstName} ${provider.lastName}`
        .toLocaleLowerCase()
        .includes(search)
    );
    setFilteredProviders(filtered);
  }, [search, providers]);

  const handleChangeProviderState = async (provider: Provider) => {
    try {
        setLoading(true);
        provider.active = !provider.active

        const res = await axios.patch(`/api/providers/${provider.id}`, { active: provider.active });

        toast.success("Estado del Proveedor actualizado correctamente");
    } catch (error) {
        console.error(error);
        toast.error("Error al actualizar el estado del Proveedor");
    } finally {
        setLoading(false);
    }
   
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Proveedores</Title>
          <a
            href="/dashboard/providers/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 sm:w-auto w-full"
          >
            Agregar Proveedor
          </a>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4" decoration="top" decorationColor="green">
          <Text className="text-sm font-medium text-gray-600">Proveedores activos</Text>
          <Metric className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">
            {providers.length}
          </Metric>
        </Card>
      </div>

      {/* Search and Table Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Title className="text-lg sm:text-xl font-semibold">Lista de proveedores</Title>
            <TextInput
              className="w-full sm:w-64"
              icon={SearchIcon}
              placeholder="Buscar proveedores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile: lista de tarjetas */}
        <ul className="md:hidden divide-y divide-gray-200">
          {filteredProviders.map((provider) => (
            <li key={provider.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {provider.firstName} {provider.lastName}
                </p>
                {provider.phone && (
                  <a href={`tel:${provider.phone}`} className="block text-sm text-blue-600 truncate min-h-0 min-w-0">
                    {provider.phone}
                  </a>
                )}
                {provider.email && (
                  <p className="text-sm text-gray-500 truncate">{provider.email}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    id={`active-${provider.id}`}
                    checked={provider.active}
                    onChange={() => handleChangeProviderState(provider)}
                    disabled={loading}
                  />
                  <label htmlFor={`active-${provider.id}`} className="text-sm text-gray-600">
                    {provider.active ? "Activo" : "Inactivo"}
                  </label>
                </div>
              </div>
              <Link
                href={`/dashboard/providers/${provider.id}`}
                className="shrink-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>

        {/* Tablet / Desktop: tabla con scroll horizontal */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="min-w-full">
            <TableHead>
              <TableRow>
                <TableCell className="whitespace-nowrap">Nombre</TableCell>
                <TableCell className="whitespace-nowrap">Teléfono</TableCell>
                <TableCell className="whitespace-nowrap hidden lg:table-cell">Correo</TableCell>
                <TableCell className="whitespace-nowrap">Estado</TableCell>
                <TableCell className="whitespace-nowrap">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProviders.map((provider, index) => (
                <TableRow key={index}>
                  <TableCell className="whitespace-nowrap font-medium">
                    <div className="flex flex-col">
                      <span>{provider.firstName} {provider.lastName}</span>
                      <span className="lg:hidden text-xs text-gray-500">{provider.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{provider.phone}</TableCell>
                  <TableCell className="whitespace-nowrap hidden lg:table-cell text-gray-600">
                    {provider.email}
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={provider.active} 
                      onChange={() => handleChangeProviderState(provider)}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/providers/${provider.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                    >
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredProviders.length === 0 && (
          <div className="p-8 text-center">
            <Text className="text-gray-500">No se encontraron proveedores</Text>
          </div>
        )}
      </div>
    </div>
  );
}
