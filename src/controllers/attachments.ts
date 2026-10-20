import prisma from "@/db/client";
import { getStorage } from "@/lib/storage";
import { randomUUID } from "crypto";
import { HttpError } from "./client";

// images are compressed in the browser before upload; this also keeps requests under Vercel's 4.5 MB limit
const MAX_SIZE = 4 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// magic bytes of the accepted image formats
export function detectImageType(data: Buffer) {
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
    if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
    if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return null;
}

export async function addAttachment(invoiceId: string, file: File | null) {
    if (!file || typeof file === 'string') throw new HttpError(400, 'Selecciona una imagen');
    const extension = extensions[file.type];
    if (!extension) throw new HttpError(400, 'Solo se permiten imágenes JPG, PNG o WebP');
    if (file.size > MAX_SIZE) throw new HttpError(400, 'La imagen supera los 4 MB');

    const invoice = await prisma.clientInvoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (!invoice) throw new HttpError(404, 'Factura no encontrada');

    // check the real file signature, not just the type the browser declares
    const data = Buffer.from(await file.arrayBuffer());
    if (detectImageType(data) !== file.type) throw new HttpError(400, 'El archivo no es una imagen válida');

    const key = `invoices/${invoiceId}/evidence/${randomUUID()}.${extension}`;
    await getStorage().put(key, data, file.type);

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
