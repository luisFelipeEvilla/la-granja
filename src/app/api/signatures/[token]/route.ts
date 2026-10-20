import { handleError } from "@/controllers/clientInvoice";
import { getRequestMeta, openSignatureRequest, signInvoice } from "@/controllers/signatures";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: { token: string } };

export const dynamic = 'force-dynamic';

// public: the client opens the link (recorded as an "opened" event)
export async function GET(req: NextRequest, { params }: Params) {
    try {
        return NextResponse.json(await openSignatureRequest(params.token, getRequestMeta(req.headers)));
    } catch (error) {
        return handleError(error);
    }
}

// public: the client signs (drawn signature as a PNG data URL)
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { signature } = await req.json();
        return NextResponse.json(await signInvoice(params.token, signature, getRequestMeta(req.headers)));
    } catch (error) {
        return handleError(error);
    }
}
