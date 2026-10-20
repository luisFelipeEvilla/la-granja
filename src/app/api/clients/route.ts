import { createClient, getClients } from "@/controllers/client";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const clients = await getClients(req.nextUrl.searchParams.get('search'));
        return NextResponse.json(clients);
    } catch (error) {
        return handleError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const client = await createClient(await req.json());
        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
