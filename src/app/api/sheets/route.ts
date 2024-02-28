import { getProductLogs } from "@/controllers/productLog";
import prisma from "@/db/client";
import { MilkRouteLog } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { ...params }: any) {
    const dateString = req.nextUrl.searchParams.get('date');

    if (!dateString) return NextResponse.json({ status: 400, message: 'Date not provided' });

    const date = new Date(dateString);
    const afterDate = new Date(dateString);
    afterDate.setDate(afterDate.getDate() + 1);

    try {
        const milkLogs = await prisma.milkRouteLog.findMany({
            where: {
                createdAt: {
                    gte: date,
                    lt: afterDate
                }
            }
        });

        const productLogs = await getProductLogs(date, afterDate);

        console.log(productLogs);

        return NextResponse.json({milkLogs, productLogs});
    } catch (error) {
        console.log(error);
        return NextResponse.json({ status: 500, message: 'Server error' });
    }
}

export async function POST(req: any) {
    const { date, milk, products } = await req.json();

    const milkLog = milk.map((product: MilkRouteLog) => { return { ...product, createdAt: date } });
    try {
        // first delete all products from the same day
        const deletedProducts = await prisma.milkRouteLog.deleteMany({
            where: {
                createdAt: date
            }
        });

        const newProducts = await prisma.milkRouteLog.createMany({
            data: milkLog
        });

        return NextResponse.json(newProducts);
    } catch (error: any) {
        console.log(error);
        return error;
    }
}
