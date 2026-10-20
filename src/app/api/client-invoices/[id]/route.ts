import { getInvoice, handleError, updateInvoice, voidInvoice } from "@/controllers/clientInvoice";
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
        const body = await req.json();

        // { status: 'ANULADA' } voids the invoice, anything else edits it
        if (body.status === 'ANULADA') return NextResponse.json(await voidInvoice(params.id));

        return NextResponse.json(await updateInvoice(params.id, body));
    } catch (error) {
        return handleError(error);
    }
}
