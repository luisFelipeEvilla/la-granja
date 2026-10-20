import { handleError } from "@/controllers/clientInvoice";
import { getProductLogs } from "@/controllers/productLog";
import { parseDateRange } from "@/controllers/provider";
import { NextRequest, NextResponse } from "next/server";

// read-only: production logs are shown on the dashboard
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const range = parseDateRange(searchParams.get('startDate'), searchParams.get('endDate'), 30);
        return NextResponse.json(await getProductLogs(range.gte, range.lte));
    } catch (error) {
        return handleError(error);
    }
}
