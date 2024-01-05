import { createProductLogs, getProductLogs, updateProductLog } from "@/controllers/productLog";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        let startDateString = req.nextUrl.searchParams.get('startDate')
        let endDateString = req.nextUrl.searchParams.get('endDate')
        
        if (!startDateString || !endDateString) return NextResponse.json({ error: 'startDate and endDate are required', status: 400 });

        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);

        console.log(startDate, endDate);

        const productLogs = await getProductLogs(startDate, endDate);

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