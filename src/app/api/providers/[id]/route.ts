import { handleError } from "@/controllers/clientInvoice";
import { getProvider, updateProvider } from "@/controllers/provider";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: Params) {
    try {
        const { id } = await props.params;
        const { searchParams } = req.nextUrl;
        return NextResponse.json(await getProvider(id, searchParams.get('startDate'), searchParams.get('endDate')));
    } catch (error) {
        return handleError(error);
    }
}

export async function PATCH(req: NextRequest, props: Params) {
    try {
        const { id } = await props.params;
        return NextResponse.json(await updateProvider(id, await req.json()));
    } catch (error) {
        return handleError(error);
    }
}
