import { Prisma } from "@prisma/client"

export type MilkRouteLogWithProvider = Prisma.MilkRouteLogGetPayload<{
    include: { provider: true }
}>