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
  });

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
    <div className="flex flex-col w-full py-5 gap-4">
      <Title className="text-4xl text-center">Proveedores</Title>

      <div className="flex justify-end w-full pr-10">
        <a
          href="/providers/create"
          className="rounded-md px-4 py-2 bg-[#22c55e] text-white"
        >
          Agregar
        </a>
      </div>

      <div className="flex justify-end mx-32">
        <Card className="mr-8 w-fit" decoration="top" decorationColor="green">
          <Text>Proveedores activos</Text>
          <Metric>{providers.length}</Metric>
        </Card>
      </div>

      <section className="flex w-full justify-center h-fit">
        <div className="flex flex-col w-fit">
          <div className="mb-3">
            <TextInput
              className="w-[240px]"
              icon={SearchIcon}
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card className="w-[800px]">
            <Title>Lista de proveedores</Title>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Telefono</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProviders.map((provider, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {provider.firstName} {provider.lastName}
                    </TableCell>
                    <TableCell>{provider.phone}</TableCell>
                    <TableCell>{provider.email}</TableCell>
                    <TableCell>
                      {/* {provider.active ? (
                        <Badge color="green">Activo</Badge>
                      ) : (
                        <Badge color="red">Inactivo</Badge>
                      )} */}
                      <Switch 
                        checked={provider.active} 
                        onChange={(value: boolean) => handleChangeProviderState(provider)}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/providers/${provider.id}`}
                        className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Editar
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>
    </div>
  );
}
