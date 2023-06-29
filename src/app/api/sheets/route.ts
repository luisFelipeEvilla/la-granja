import prisma from "@/db/client";
import { Product } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { ...params }: any) {
    const dateString = req.nextUrl.searchParams.get('date');

    if (!dateString) return NextResponse.json({ status: 400, message: 'Date not provided' });

    const date = new Date(dateString);
    const afterDate = new Date(dateString);
    afterDate.setDate(afterDate.getDate() + 1);

    try {
        const products = await prisma.product.findMany({
            where: {
                createdAt: {
                    gte: date,
                    lt: afterDate
                }
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ status: 500, message: 'Server error' });
    }
}

export async function POST(req: any) {
    const { ...sheet } = await req.json();

    const products = sheet.products.map((product: Product) => { return { ...product, createdAt: sheet.date } });
    try {
        // first delete all products from the same day
        const deletedProducts = await prisma.product.deleteMany({
            where: {
                createdAt: sheet.date
            }
        });

        const newProducts = await prisma.product.createMany({
            data: products
        });

        return NextResponse.json(newProducts);
    } catch (error: any) {
        console.log(error);
        return error;
    }
}
