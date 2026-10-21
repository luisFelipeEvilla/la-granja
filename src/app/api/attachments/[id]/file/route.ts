import { getAttachmentDownloadUrl, getAttachmentFile } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

// redirects to a short-lived link on the storage provider (no Vercel size limit); `?proxy=1` or
// providers without presigned links serve the bytes through the app (used by the PDF, which
// fetches images from the browser and would otherwise need CORS on the bucket)
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        if (req.nextUrl.searchParams.get('proxy') !== '1') {
            const url = await getAttachmentDownloadUrl(id);
            // the redirect itself is never cached (a stale one would point to an expired link); the image
            // behind it is, because the link stays the same for an hour
            if (url) return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'no-store' } });
        }

        const file = await getAttachmentFile(id);
        return new Response(new Uint8Array(file.data), {
            headers: { 'Content-Type': file.contentType, 'Cache-Control': 'private, max-age=86400, immutable' }
        });
    } catch (error) {
        return handleError(error);
    }
}
