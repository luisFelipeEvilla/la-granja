import { Prisma, Provider } from "@prisma/client";

export type createMilkLogDto = { 
    provider: Provider;
    quantity: number;
}