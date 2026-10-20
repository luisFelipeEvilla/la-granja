import { handleError } from "@/controllers/clientInvoice";
import { getOrCreateSignatureRequest, getRequestMeta, markSignatureRequestSent } from "@/controllers/signatures";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// creates the signing link (or returns the existing one)
export async function POST(req: NextRequest, props: Params) {
    const params = await props.params;
    try {
        return NextResponse.json(await getOrCreateSignatureRequest(params.id));
    } catch (error) {
        return handleError(error);
    }
}

// records that the link was sent to the client
export async function PATCH(req: NextRequest, props: Params) {
    const params = await props.params;
    try {
        return NextResponse.json(await markSignatureRequestSent(params.id, getRequestMeta(req.headers)));
    } catch (error) {
        return handleError(error);
    }
}
