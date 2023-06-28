import { PrismaClient, Product } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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
