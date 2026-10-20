import { handleError } from "@/controllers/clientInvoice";
import { createProduct, getProducts, parseProduct } from "@/controllers/product";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        return NextResponse.json(await getProducts());
    } catch (error) {
        return handleError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        return NextResponse.json(await createProduct(parseProduct(await req.json())), { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
