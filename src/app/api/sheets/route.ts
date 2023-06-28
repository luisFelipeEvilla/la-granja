import { PrismaClient, Product } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: any) {
    const { ...sheet }  = await req.json();

    try {
        const newProducts = await prisma.product.createMany({
            data: sheet.products
        });

        return NextResponse.json(newProducts); 
    } catch (error: any) {
        console.log(error);
        return error;
    }
}
