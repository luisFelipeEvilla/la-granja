import { createInvoice, handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const invoice = await createInvoice(params.id, await req.json());
        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
