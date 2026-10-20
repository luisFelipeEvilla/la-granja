import { createInvoice, handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const invoice = await createInvoice(params.id, await req.json());
        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
