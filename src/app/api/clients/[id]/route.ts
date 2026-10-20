import { getClient, updateClient } from "@/controllers/client";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: Params) {
    const params = await props.params;
    try {
        return NextResponse.json(await getClient(params.id));
    } catch (error) {
        return handleError(error);
    }
}

export async function PATCH(req: NextRequest, props: Params) {
    const params = await props.params;
    try {
        return NextResponse.json(await updateClient(params.id, await req.json()));
    } catch (error) {
        return handleError(error);
    }
}
