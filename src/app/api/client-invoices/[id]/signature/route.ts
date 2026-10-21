import { handleError } from "@/controllers/clientInvoice";
import { getRequestMeta, revokeSignature } from "@/controllers/signatures";
import { getSession } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

// voids the client's signature (admin only, enforced by proxy.ts) so the invoice can be signed again
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const session = await getSession();
        const { reason } = await req.json().catch(() => ({}));
        const request = await revokeSignature(id, session?.username ?? 'desconocido', typeof reason === 'string' ? reason : undefined, getRequestMeta(req.headers));
        return NextResponse.json(request);
    } catch (error) {
        return handleError(error);
    }
}
