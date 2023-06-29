import { Prisma } from "@prisma/client"

export type ProductWithProvider = Prisma.ProductGetPayload<{
    include: { provider: true }
}>