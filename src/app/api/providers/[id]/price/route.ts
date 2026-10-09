import prisma from "@/db/client";
import { NextRequest, NextResponse } from "next/server";

// Actualiza el precio de compra de los registros de leche del proveedor en un rango de fechas
export async function PATCH(req: NextRequest, { params }: any) {
    const { id } = params;
    const { startDate, endDate, price } = await req.json();

    const parsedPrice = Number(price);

    if (!startDate || !endDate || !Number.isInteger(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
            { message: 'startDate, endDate y un precio entero mayor a 0 son requeridos' },
            { status: 400 }
        );
    }

    try {
        // Mismo filtro de fechas que GET /api/providers/[id], para que coincida con los registros facturados
        const result = await prisma.milkRouteLog.updateMany({
            where: {
                providerId: id,
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            data: { price: parsedPrice }
        });

        return NextResponse.json({ updated: result.count });
    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json({ message: 'Error al actualizar el precio' }, { status: 500 });
    }
}
