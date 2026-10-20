import { handleError } from "@/controllers/clientInvoice";
import { getSalesInvoices } from "@/controllers/sales";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        return NextResponse.json(await getSalesInvoices());
    } catch (error) {
        return handleError(error);
    }
}
