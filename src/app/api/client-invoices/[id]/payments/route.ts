import { addPayment, handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const payment = await addPayment(params.id, await req.json());
        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
