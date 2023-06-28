import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const providers = await prisma.providers.findMany();
        
        return NextResponse.json(providers)
    } catch (error: any) {
        console.error(error.message);
        return new Response(error.message, { status: 500 })
    }
};

export async function POST(req: any, res: any) {
    const { ...provider }  = await req.json();

    try {
        const newProvider = await prisma.providers.create({
            data: { ...provider }
        });
    
        return NextResponse.json(newProvider);
    } catch (error: any) {
        console.error(error.message);
        return new Response(error.message, { status: 500 })
    }
}