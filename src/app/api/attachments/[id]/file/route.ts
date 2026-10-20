import { getAttachmentFile } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest } from "next/server";

// files are served through the app, so pages and PDFs never depend on the storage provider's URLs
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const file = await getAttachmentFile(params.id);
        return new Response(new Uint8Array(file.data), {
            headers: { 'Content-Type': file.contentType, 'Cache-Control': 'private, max-age=86400, immutable' }
        });
    } catch (error) {
        return handleError(error);
    }
}
