import { getInvoice, handleError, voidInvoice } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        return NextResponse.json(await getInvoice(params.id));
    } catch (error) {
        return handleError(error);
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { status } = await req.json();
        if (status !== 'ANULADA') {
            return NextResponse.json({ message: 'Solo se permite anular la factura' }, { status: 400 });
        }

        return NextResponse.json(await voidInvoice(params.id));
    } catch (error) {
        return handleError(error);
    }
}
