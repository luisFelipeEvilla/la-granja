import prisma from "@/db/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: any) {
    const { id } = params;
    const startDate = req.nextUrl.searchParams.get('startDate') 
    const endDate = req.nextUrl.searchParams.get('endDate')

    const today = new Date();
    const todayMinus30 = new Date();
    todayMinus30.setDate(todayMinus30.getDate() - 30);

    try {
        const provider = await prisma.provider.findUnique({
            where: {
                id,
            }, include: {
                products: {
                    where: {
                        createdAt: {
                            gte: startDate ? new Date(startDate) : todayMinus30,
                            lte: endDate ? new Date(endDate) : today
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
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

    console.log(provider);
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