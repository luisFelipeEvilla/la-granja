import prisma from "@/db/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const providers = await prisma.provider.findMany(
            { include: { products: true }}
        );
        
        return NextResponse.json(providers)
    } catch (error: any) {
        console.error(error.message);
        return new Response(error.message, { status: 500 })
    }
};

export async function POST(req: any, res: any) {
    const { ...provider }  = await req.json();

    try {
        const newProvider = await prisma.provider.create({
            data: { ...provider }
        });
    
        return NextResponse.json(newProvider);
    } catch (error: any) {
        console.error(error.message);
        return new Response(error.message, { status: 500 })
    }
}