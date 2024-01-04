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
import PrimaryButton from "../componeents/buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { MilkRouteLog, Product, ProductLog, Provider } from "@prisma/client";
import { MilkRouteLogWithProvider } from "@/types/Product";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function Sheet() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [milkSheet, setMilkSheet] = useState<MilkRouteLogWithProvider[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [total, setTotal] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsSheet, setProductsSheet] = useState<ProductLog[]>([]);

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

      const [MilkLogs, productsLogs] = await Promise.all([
        axios.get(`/api/sheets?date=${realDate}`),
        axios.get(`/api/productLog?date=${realDate}`)
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
      const newProductSheet = productsSheet.map((product) => {
        const newProduct = productsLogs.data.find(
          (p: ProductLog) => p.productId === product.productId
        );
        return newProduct
          ? { ...product, quantity: newProduct.quantity }
          : { ...product, quantity: 0 };
      });

      setProductsSheet(newProductSheet);
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
      // const milkSheetRequest = await axios.post("/api/sheets", {
      //   date: new Date(aux),
      //   products: milkSheet,
      // });

      const productsSheetRequest = await axios.post("/api/productLog", {
        date: new Date(aux),
        products: productsSheet,
      });

      console.log(productsSheetRequest.status)

      toast.success("Planilla guardada con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la planilla");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen ">
      <div className="mb-4 rounded-md bg-white border shadow-sm cursor-pointer px-3 py-1 focus:outline-none ring-0">
        <input
          type="date"
          value={date.toISOString().split("T")[0]}
          onChange={handleDateChange}
          placeholder="Selecciona una fecha"
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <MilkLogTable />
        <ProductionLogTable />

        <div className="w-full flex mt-2 justify-center">
          <PrimaryButton text="Guardar"></PrimaryButton>
        </div>
      </form>
    </div>
  );

  function MilkLogTable() {
    return (
      <Card className="w-[70%] m-auto overflow-x-scroll md:overflow-hidden md:w-[600px]">
        <Title>Planilla de recolección</Title>

        <Table className="max-h-[400px] overflow-y-scroll">
          <TableHead>
            <TableRow>
              <TableCell>Proveedor</TableCell>
              <TableCell>Litros</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {milkSheet.map((product, index) => {
              const provider = providers.find(
                (provider) => provider.id === product.providerId
              );
              return (
                <TableRow key={index}>
                  <TableCell>
                    {provider?.firstName} {provider?.lastName}
                  </TableCell>
                  <TableCell>
                    <TextInput
                      onChange={(e) =>
                        handleQuantityChange(e, provider?.id as string)
                      }
                      placeholder="Litros de leche"
                      className="w-[100px]"
                      value={milkSheet
                        .find((product) => product.providerId === provider?.id)
                        ?.quantity.toString()}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center">
          <Text>
            Total:{" "}
            <span className="font-bold">
              {milkSheet.reduce((acc, product) => acc + product.quantity, 0)}
            </span>
          </Text>
        </div>
      </Card>
    );
  }

  function ProductionLogTable() {
    return (
      <Card className="w-[70%] m-auto overflow-x-scroll md:overflow-hidden md:w-[600px]">
        <Title>Producción del día</Title>

        <Table className="max-h-[400px] overflow-y-scroll">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Producción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {products.map((product) => {
              return (
                <TableRow>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <TextInput
                      onChange={(e) =>
                        handleProductQuantityChange(e, product.id as string)
                      }
                      placeholder={`Producido del día ${product.unit}`}
                      className="w-[100px]"
                      value={productsSheet
                        .find((p) => p.productId === product.id)
                        ?.quantity.toString()}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    );
  }
}
