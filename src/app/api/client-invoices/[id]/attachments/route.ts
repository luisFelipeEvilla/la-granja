import { addAttachment } from "@/controllers/attachments";
import { handleError } from "@/controllers/clientInvoice";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const form = await req.formData();
        const attachment = await addAttachment(params.id, form.get('file') as File | null);
        return NextResponse.json(attachment, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
