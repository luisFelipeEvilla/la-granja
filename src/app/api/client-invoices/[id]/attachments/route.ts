import { addAttachment } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const form = await req.formData();
        const attachment = await addAttachment(params.id, form.get('file') as File | null);
        return NextResponse.json(attachment, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
