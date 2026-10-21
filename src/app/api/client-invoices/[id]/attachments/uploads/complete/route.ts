import { completeAttachmentUpload } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

// confirms a direct upload once the file is in storage
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const { ticket } = await req.json().catch(() => ({}));
        return NextResponse.json(await completeAttachmentUpload(id, ticket), { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
