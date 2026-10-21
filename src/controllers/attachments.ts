import prisma from "@/db/client";
import { signUploadTicket, verifyUploadTicket } from "@/lib/auth/uploadToken";
import { getStorage } from "@/lib/storage";
import { randomUUID } from "crypto";
import { HttpError } from "./client";

// uploads through the app are limited by Vercel's 4.5 MB request body; direct uploads go straight
// to the storage provider with a presigned URL, so they can be bigger
const MAX_SIZE = 4 * 1024 * 1024;
const MAX_DIRECT_SIZE = 25 * 1024 * 1024;
const UPLOAD_URL_TTL = 10 * 60;
const DOWNLOAD_URL_TTL = 60 * 60;
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

const findInvoice = async (invoiceId: string) => {
    const invoice = await prisma.clientInvoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (!invoice) throw new HttpError(404, 'Factura no encontrada');
};

const fileName = (name: unknown, extension: string) =>
    (typeof name === 'string' && name.trim() ? name.trim() : `evidencia.${extension}`).slice(0, 120);

// step 1 of a direct upload: authorizes one exact file and returns where to PUT it.
// mode "proxy" means the provider doesn't support it and the file must go through the app
export async function createAttachmentUpload(invoiceId: string, body: any) {
    const storage = getStorage();
    if (!storage.presignUpload) return { mode: 'proxy' as const };

    const contentType = String(body?.contentType ?? '');
    const size = Number(body?.size);
    const extension = extensions[contentType];
    if (!extension) throw new HttpError(400, 'Solo se permiten imágenes JPG, PNG o WebP');
    if (!Number.isInteger(size) || size <= 0) throw new HttpError(400, 'Tamaño de archivo inválido');
    if (size > MAX_DIRECT_SIZE) throw new HttpError(400, 'La imagen supera los 25 MB');
    await findInvoice(invoiceId);

    const key = `invoices/${invoiceId}/evidence/${randomUUID()}.${extension}`;
    const upload = await storage.presignUpload(key, contentType, size, UPLOAD_URL_TTL);
    const ticket = await signUploadTicket({ invoiceId, key, contentType, size, name: fileName(body?.name, extension) }, UPLOAD_URL_TTL + 5 * 60);
    return { mode: 'direct' as const, url: upload.url, headers: upload.headers, ticket };
}

// step 2: the file is already in storage; check it really is what was authorized before saving it
export async function completeAttachmentUpload(invoiceId: string, ticketToken: unknown) {
    const ticket = typeof ticketToken === 'string' ? await verifyUploadTicket(ticketToken) : null;
    if (!ticket || ticket.invoiceId !== invoiceId) throw new HttpError(400, 'La autorización de subida no es válida o venció');

    const storage = getStorage();
    if (!storage.head || !storage.getRange) throw new HttpError(400, 'Este almacenamiento no admite subida directa');

    const existing = await prisma.invoiceAttachment.findFirst({ where: { key: ticket.key } });
    if (existing) return existing;

    const object = await storage.head(ticket.key);
    if (!object) throw new HttpError(400, 'El archivo no llegó al almacenamiento');

    const header = object.size === ticket.size ? await storage.getRange(ticket.key, 0, 15) : Buffer.alloc(0);
    if (object.size !== ticket.size || detectImageType(header) !== ticket.contentType) {
        await storage.delete(ticket.key);
        throw new HttpError(400, 'El archivo no es una imagen válida');
    }
    await findInvoice(invoiceId);

    return prisma.invoiceAttachment.create({
        data: { invoiceId, key: ticket.key, name: ticket.name, contentType: ticket.contentType, size: ticket.size }
    });
}

// short-lived link straight to the provider, or null when files must be served through the app
export async function getAttachmentDownloadUrl(id: string) {
    const storage = getStorage();
    if (!storage.presignDownload) return null;
    const attachment = await prisma.invoiceAttachment.findUnique({ where: { id } });
    if (!attachment) throw new HttpError(404, 'Imagen no encontrada');
    return storage.presignDownload(attachment.key, DOWNLOAD_URL_TTL);
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
