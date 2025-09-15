"use client";
import {
  Card,
  Metric,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextInput,
  Text,
  Title,
} from "@tremor/react";
import PrimaryButton from "../../../components/buttons/PrimaryButton";
import { useContext, useEffect, useState } from "react";
import { MilkRouteLog, Product, ProductLog, Provider, user_role } from "@prisma/client";
import { MilkRouteLogWithProvider } from "@/types/Product";
import { toast } from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "@/contexts/AuthContext";

export default function Sheet() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [milkSheet, setMilkSheet] = useState<MilkRouteLogWithProvider[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [total, setTotal] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsSheet, setProductsSheet] = useState<ProductLog[]>([]);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSheet();
  }, [date, providers]);

  async function fetchData() {
    try {
      // fetch providers data
      const [providersRequest, products] = await Promise.all([
        axios.get("/api/providers"),
        axios.get("/api/products"),
      ]);

      const activeProviders = providersRequest.data.filter(
        (provider: Provider) => provider.active
      );
      setProviders(activeProviders);

      const aux = activeProviders.map((provider: Provider) => {
        return { providerId: provider.id, quantity: 0 };
      });
      setMilkSheet(aux);

      setProducts(products.data);

      const auxProducts = products.data.map((product: Product) => {
        return { productId: product.id, quantity: 0 };
      });      

      setProductsSheet(auxProducts);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los productos");
    }
  }

  const fetchSheet = async () => {
    try {
      const realDate = date.toISOString().split("T")[0];

      const [MilkLogs] = await Promise.all([
        axios.get(`/api/sheets?date=${realDate}`),
        // axios.get(`/api/productLog?date=${realDate}`)
      ]);
  
      // update sheet with products
      const newSheet = milkSheet.map((product) => {
        const newProduct = MilkLogs.data.find(
          (p: MilkRouteLog) => p.providerId === product.providerId
        );
        return newProduct
          ? { ...product, quantity: newProduct.quantity }
          : { ...product, quantity: 0 };
      });
      setMilkSheet(newSheet);


      // update product sheet
      // const newProductSheet = productsSheet.map((product) => {
      //   const newProduct = productsLogs.data.find(
      //     (p: ProductLog) => p.productId === product.productId
      //   );
      //   return newProduct
      //     ? { ...product, quantity: newProduct.quantity }
      //     : { ...product, quantity: 0 };
      // });

      // setProductsSheet(newProductSheet);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la planilla");
    }
    
  };

  const handleDateChange = async (e: any) => {
    setDate(new Date(e.target.value));
  };

  const handleQuantityChange = (e: any, id: string) => {
    const quantity = parseInt(e.target.value || "0");

    const newSheet = milkSheet.map((product) =>
      product.providerId === id ? { ...product, quantity } : product
    );

    setMilkSheet(newSheet);
  };

  const handleProductQuantityChange = (e: any, id: string) => {
    const quantity = parseInt(e.target.value || "0");

    const newSheet = productsSheet.map((product) =>
      product.productId === id ? { ...product, quantity } : product
    );

    setProductsSheet(newSheet);
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    //  remove time zone from date
    const aux = date.toISOString().split("T")[0];

    try {
      const milkSheetRequest = await axios.post("/api/sheets", {
        date: new Date(aux),
        products: milkSheet,
      });

      // const productsSheetRequest = await axios.post("/api/productLog", {
      //   date: new Date(aux),
      //   products: productsSheet,
      // });

      // console.log(productsSheetRequest.status)

      toast.success("Planilla guardada con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la planilla");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Planillas de Recolección</Title>
          <div className="flex items-center gap-2">
            <Text className="text-sm font-medium text-gray-600 hidden sm:block">Fecha:</Text>
            <input
              type="date"
              value={date.toISOString().split("T")[0]}
              onChange={handleDateChange}
              disabled={user?.role === user_role.USER}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <MilkLogTable />
        {/* <ProductionLogTable /> */}

        <div className="flex justify-center">
          <PrimaryButton text="Guardar Planilla" />
        </div>
      </form>
    </div>
  );

  function MilkLogTable() {
    const totalLiters = milkSheet.reduce((acc, product) => acc + product.quantity, 0);
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Title className="text-lg sm:text-xl font-semibold">Planilla de recolección</Title>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Total:</Text>
              <Metric className="text-xl font-bold text-green-600">{totalLiters} L</Metric>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHead>
              <TableRow>
                <TableCell className="whitespace-nowrap font-medium text-gray-900">Proveedor</TableCell>
                <TableCell className="whitespace-nowrap font-medium text-gray-900">Litros</TableCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-gray-200">
              {milkSheet.map((product, index) => {
                const provider = providers.find(
                  (provider) => provider.id === product.providerId
                );
                return (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                      {provider?.firstName} {provider?.lastName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TextInput
                          onChange={(e) =>
                            handleQuantityChange(e, provider?.id as string)
                          }
                          placeholder="0"
                          className="w-20 sm:w-24"
                          type="number"
                          min="0"
                          disabled={user?.role === user_role.USER}
                          value={milkSheet
                            .find((product) => product.providerId === provider?.id)
                            ?.quantity.toString()}
                        />
                        <Text className="text-sm text-gray-500">L</Text>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {milkSheet.length === 0 && (
          <div className="p-8 text-center">
            <Text className="text-gray-500">No hay proveedores activos</Text>
          </div>
        )}
      </div>
    );
  }

  function ProductionLogTable() {
    const totalProduction = productsSheet.reduce((acc, product) => acc + product.quantity, 0);
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Title className="text-lg sm:text-xl font-semibold">Producción del día</Title>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Total:</Text>
              <Metric className="text-xl font-bold text-blue-600">{totalProduction}</Metric>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHead>
              <TableRow>
                <TableCell className="whitespace-nowrap font-medium text-gray-900">Producto</TableCell>
                <TableCell className="whitespace-nowrap font-medium text-gray-900">Producción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-gray-200">
              {products.map((product) => {
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                      {product.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TextInput
                          onChange={(e) =>
                            handleProductQuantityChange(e, product.id as string)
                          }
                          placeholder="0"
                          className="w-20 sm:w-24"
                          type="number"
                          min="0"
                          disabled={user?.role === user_role.USER}
                          value={productsSheet
                            .find((p) => p.productId === product.id)
                            ?.quantity.toString()}
                        />
                        <Text className="text-sm text-gray-500">{product.unit}</Text>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {products.length === 0 && (
          <div className="p-8 text-center">
            <Text className="text-gray-500">No hay productos registrados</Text>
          </div>
        )}
      </div>
    );
  }
}
