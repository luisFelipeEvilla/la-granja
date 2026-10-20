import { handleError } from "@/controllers/clientInvoice";
import { createReminder } from "@/controllers/sales";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const reminder = await createReminder(params.id, await req.json());
        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
