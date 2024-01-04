import { createProductLogs, getProductLogs, updateProductLog } from "@/controllers/productLog";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        const dateString = req.nextUrl.searchParams.get('date');

        if (!dateString) return NextResponse.json({ status: 400, message: 'Date not provided' });

        const date = new Date(dateString);
        const afterDate = new Date(dateString);
        afterDate.setDate(afterDate.getDate() + 1);
        
        const productLogs = await getProductLogs(date, afterDate);

        return NextResponse.json(productLogs);
    } catch (error) {
        return NextResponse.json({ error: error, status: 500 })
    }
}

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const body = await req.json();

        const productsLogs = await body.products.map((product: any) => { return { ...product, createdAt: body.date } });
        
        const newProductLog = await createProductLogs(productsLogs);

        return NextResponse.json(newProductLog);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error, status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: any) {
    try {
        const body = await req.json();
        
        const updatedProductLog = await updateProductLog(params.id, body);

        return NextResponse.json(updatedProductLog);
    } catch (error) {
        return NextResponse.json({ error: error, status: 500 })
    }
}