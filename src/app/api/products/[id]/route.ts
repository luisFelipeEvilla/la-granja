import { handleError } from "@/controllers/clientInvoice";
import { parseProduct, updateProduct } from "@/controllers/product";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        return NextResponse.json(await updateProduct(id, parseProduct(await req.json())));
    } catch (error) {
        return handleError(error);
    }
}
