import prisma from "@/db/client";
import { Product } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { ...params }: any) {
    const dateString = req.nextUrl.searchParams.get('date');

    if (!dateString) return NextResponse.json({ status: 400, message: 'Date not provided' });

    const date = new Date(dateString);

    try {
        const products = await prisma.product.findMany({
            where: {
                createdAt: {
                    gte: date,
                    lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
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
    const { ...sheet }  = await req.json();

    const products = sheet.products.map((product: Product) =>   { return {...product, createdAt: sheet.date} } );

    try {
        const newProducts = await prisma.product.createMany({
            data: products
        });

        return NextResponse.json(newProducts); 
    } catch (error: any) {
        console.log(error);
        return error;
    }
}
