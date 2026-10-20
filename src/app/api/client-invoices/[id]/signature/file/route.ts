import { handleError } from "@/controllers/clientInvoice";
import { getSignatureFile } from "@/controllers/signatures";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const file = await getSignatureFile(params.id);
        return new Response(new Uint8Array(file.data), {
            headers: { 'Content-Type': file.contentType, 'Cache-Control': 'private, max-age=86400, immutable' }
        });
    } catch (error) {
        return handleError(error);
    }
}
