import { deleteAttachment } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        return NextResponse.json(await deleteAttachment(params.id));
    } catch (error) {
        return handleError(error);
    }
}
