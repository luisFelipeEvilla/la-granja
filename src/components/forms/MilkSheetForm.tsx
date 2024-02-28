"use client";

import providers from "@/app/providers";
import { createMilkLogDto } from "@/dto/MilkLog/createMilkLog.dto";
import { MilkRouteLog, Provider } from "@prisma/client";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextInput,
  Title,
  Text,
} from "@tremor/react";
import { useState } from "react";

type PropsType = {
    logs: createMilkLogDto[];

};

export default function MilkSheetForm(props: PropsType) {

//   function handleQuantityChange(e: any, providerId: string) {
//     const newMilkSheet = milkSheet.map((milkLog) => {
//       if (milkLog.provider.id === providerId) {
//         return { ...milkLog, quantity: e.target.value };
//       }
//       return milkLog;
//     });
//     setMilkSheet(newMilkSheet);
//   }
  return (
    <Card className="w-[70%] m-auto overflow-x-scroll md:overflow-auto md:w-[600px]">
      <Title>Planilla de recolección</Title>

      <Table className="max-h-[400px] overflow-y-scroll">
        <TableHead>
          <TableRow>
            <TableCell>Proveedor</TableCell>
            <TableCell>Litros</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {props.logs.map((milkLog, index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  {milkLog.provider.firstName} {milkLog.provider?.lastName}
                </TableCell>
                <TableCell>
                  <TextInput
                    // onChange={(e) =>
                    //   handleQuantityChange(e, milkLog.provider.id)
                    // }
                    placeholder="Litros de leche"
                    className="w-[100px]"
                    value={milkLog.quantity.toString()}
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
            {props.logs.reduce((acc, milkLog) => acc + milkLog.quantity, 0)}
          </span>
        </Text>
      </div>
    </Card>
  );
}
