import { updateProduct } from "@/controllers/product";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { name, unit } = await req.json();
        if (!name?.trim() || !unit) {
            return NextResponse.json({ message: 'Nombre y unidad son requeridos' }, { status: 400 });
        }

        return NextResponse.json(await updateProduct(params.id, { name: name.trim(), unit }));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
    }
}
