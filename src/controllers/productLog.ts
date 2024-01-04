import prisma from "@/db/client";

type createProductLogODT = {
    productId: string;
    quantity: number;
    createdAt: Date;
}

export async function getProductLogs(gte: Date, lt: Date) {
    const productLogs = await prisma.productLog.findMany({
        where: {
            createdAt: {
                gte,
                lt
            }
        }
    });

    return productLogs;
}

export async function getProductLog(id: string) {
    const productLog = await prisma.productLog.findUnique({
        where: {
            id: id
        }
    });

    return productLog;
}

export async function createProductLogs(productLog: createProductLogODT) {
    const newProductLog = await prisma.productLog.createMany({
        data: productLog
    });

    return newProductLog;
}

export async function updateProductLog(id: string, productLog: any) {
    const updatedProductLog = await prisma.productLog.update({
        where: {
            id: id
        },
        data: productLog
    });

    return updatedProductLog;
}