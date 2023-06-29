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