import { handleError } from "@/controllers/clientInvoice";
import { createProvider, getProviders } from "@/controllers/provider";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        return NextResponse.json(await getProviders(searchParams.get('startDate'), searchParams.get('endDate')));
    } catch (error) {
        return handleError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        return NextResponse.json(await createProvider(await req.json()), { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
