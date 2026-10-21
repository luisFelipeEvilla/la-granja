import { createAttachmentUpload } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

// authorizes a direct upload to the storage provider (presigned URL)
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        return NextResponse.json(await createAttachmentUpload(id, await req.json().catch(() => ({}))));
    } catch (error) {
        return handleError(error);
    }
}
