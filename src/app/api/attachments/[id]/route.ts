import { deleteAttachment } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        return NextResponse.json(await deleteAttachment(params.id));
    } catch (error) {
        return handleError(error);
    }
}
