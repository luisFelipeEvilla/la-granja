import { createProduct, deleteProduct, getProducts, updateProduct } from "@/controllers/product";
import { NextRequest, NextResponse } from "next/server";

export async function GET(){
    try {
        const products = await getProducts();

        return NextResponse.json(products);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error, status: 500 })
    }
}

export async function POST(req: NextRequest, res: NextResponse){
    try {
        const body = await req.json();

        const newProduct = await createProduct(body);

        return NextResponse.json(newProduct);
    } catch (error) {
        console.error(error);   
        return NextResponse.json({ error: error, status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: any){
    try {
        const body = await req.json();
        const updatedProduct = await updateProduct(params.id, body);

        return NextResponse.json(updatedProduct);
    } catch (error) {
        return NextResponse.json({ error: error, status: 500 })
    }
}

export async function DELETE({ params }: any){
    try {
        const deletedProduct = await deleteProduct(params.id);

        return NextResponse.json(deletedProduct);
    } catch (error) {
        return NextResponse.json({ error: error, status: 500 })
    }
}