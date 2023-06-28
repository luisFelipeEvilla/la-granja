import { Prisma } from "@prisma/client";

export type ProviderWithProducts = Prisma.ProviderGetPayload<{
    include: { products: true }
}>;