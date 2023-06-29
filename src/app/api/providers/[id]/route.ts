import prisma from "@/db/client";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: any) {
    const { id } = params;

    try {
        const provider = await prisma.provider.findUnique({
            where: {
                id
            }
        })

        if (!provider) return NextResponse.json({
            statusCode: 404,
            messagge: 'Provider not found'
        })

        return NextResponse.json(provider);

    } catch (error: any) {
        console.log(error);
        return NextResponse.json({
            statusCode: 500,
            message: 'Client errror'
        })
    }
}

export async function PATCH(req: Request, { params }: any) {    
    const { ...provider } = await req.json();
    const { id } = params;

    try {
        const updatedProvider = await prisma.provider.update({
            where: {
                id
            },
            data: { ...provider }
        });

        return NextResponse.json({});
    }   catch (error: any) {
        console.error(error.message);
        return new Response(error.message, { status: 500 })
    }
}