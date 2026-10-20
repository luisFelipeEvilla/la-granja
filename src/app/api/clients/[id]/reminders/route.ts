import { handleError } from "@/controllers/clientInvoice";
import { createReminder } from "@/controllers/sales";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const reminder = await createReminder(params.id, await req.json());
        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
