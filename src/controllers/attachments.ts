import prisma from "@/db/client";
import { getStorage } from "@/lib/storage";
import { randomUUID } from "crypto";
import { HttpError } from "./client";

// images are compressed in the browser before upload; this also keeps requests under Vercel's 4.5 MB limit
const MAX_SIZE = 4 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function addAttachment(invoiceId: string, file: File | null) {
    if (!file || typeof file === 'string') throw new HttpError(400, 'Selecciona una imagen');
    const extension = extensions[file.type];
    if (!extension) throw new HttpError(400, 'Solo se permiten imágenes JPG, PNG o WebP');
    if (file.size > MAX_SIZE) throw new HttpError(400, 'La imagen supera los 4 MB');

    const invoice = await prisma.clientInvoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (!invoice) throw new HttpError(404, 'Factura no encontrada');

    const key = `invoices/${invoiceId}/evidence/${randomUUID()}.${extension}`;
    await getStorage().put(key, Buffer.from(await file.arrayBuffer()), file.type);

    return prisma.invoiceAttachment.create({
        data: { invoiceId, key, name: file.name || `evidencia.${extension}`, contentType: file.type, size: file.size }
    });
}

export async function getAttachmentFile(id: string) {
    const attachment = await prisma.invoiceAttachment.findUnique({ where: { id } });
    if (!attachment) throw new HttpError(404, 'Imagen no encontrada');
    return getStorage().get(attachment.key);
}

export async function deleteAttachment(id: string) {
    const attachment = await prisma.invoiceAttachment.findUnique({ where: { id } });
    if (!attachment) throw new HttpError(404, 'Imagen no encontrada');

    await getStorage().delete(attachment.key);
    return prisma.invoiceAttachment.delete({ where: { id } });
}
