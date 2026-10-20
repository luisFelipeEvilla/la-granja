import prisma from "@/db/client";
import { getStorage } from "@/lib/storage";
import { Prisma } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { HttpError } from "./client";

export type RequestMeta = { ip: string | null, userAgent: string | null };

// a reload or a double render within this window is the same visit
const SAME_VISIT_MS = 60_000;
const MAX_SIGNATURE_BYTES = 1024 * 1024;

const newToken = () => randomBytes(24).toString('base64url');

export function getRequestMeta(headers: Headers): RequestMeta {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return {
        ip: forwarded || headers.get('x-real-ip') || null,
        userAgent: headers.get('user-agent')?.slice(0, 300) ?? null
    };
}

export async function getOrCreateSignatureRequest(invoiceId: string) {
    const invoice = await prisma.clientInvoice.findUnique({ where: { id: invoiceId }, include: { signatureRequest: true } });
    if (!invoice) throw new HttpError(404, 'Factura no encontrada');
    if (invoice.signatureRequest) return invoice.signatureRequest;
    if (invoice.status === 'ANULADA') throw new HttpError(409, 'La factura está anulada');

    try {
        return await prisma.invoiceSignatureRequest.create({ data: { invoiceId, token: newToken() } });
    } catch (error) {
        // created at the same time by another request
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return prisma.invoiceSignatureRequest.findUniqueOrThrow({ where: { invoiceId } });
        }
        throw error;
    }
}

export async function markSignatureRequestSent(invoiceId: string, meta: RequestMeta) {
    const request = await getOrCreateSignatureRequest(invoiceId);
    return prisma.invoiceSignatureRequest.update({
        where: { id: request.id },
        data: { events: { push: { type: 'SENT', at: new Date(), ...meta } } }
    });
}

// what the client sees on the public signing page (no internal ids or balances)
async function getPublicInvoice(token: string) {
    const request = await prisma.invoiceSignatureRequest.findUnique({
        where: { token },
        include: {
            invoice: {
                select: {
                    number: true, issueDate: true, items: true, amount: true, notes: true, status: true,
                    client: { select: { name: true, idType: true, idNum: true } }
                }
            }
        }
    });
    if (!request) throw new HttpError(404, 'Este enlace no es válido');
    return request;
}

export async function openSignatureRequest(token: string, meta: RequestMeta) {
    const request = await getPublicInvoice(token);
    const now = new Date();

    const lastOpen = [...request.events].reverse().find((event) => event.type === 'OPENED');
    const sameVisit = lastOpen && lastOpen.ip === meta.ip && lastOpen.userAgent === meta.userAgent
        && now.getTime() - lastOpen.at.getTime() < SAME_VISIT_MS;

    if (!sameVisit) {
        await prisma.invoiceSignatureRequest.update({
            where: { id: request.id },
            data: {
                events: { push: { type: 'OPENED', at: now, ...meta } },
                openCount: { increment: 1 },
                firstOpenedAt: request.firstOpenedAt ?? now,
                lastOpenedAt: now
            }
        });
    }

    return { invoice: request.invoice, signedAt: request.signedAt };
}

export async function signInvoice(token: string, signature: string, meta: RequestMeta) {
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(signature ?? '');
    if (!match) throw new HttpError(400, 'Firma inválida');
    const image = Buffer.from(match[1], 'base64');
    if (image.length < 200 || image.length > MAX_SIGNATURE_BYTES) throw new HttpError(400, 'Firma inválida');

    const request = await getPublicInvoice(token);
    if (request.signedAt) throw new HttpError(409, 'Esta factura ya fue firmada');
    if (request.invoice.status === 'ANULADA') throw new HttpError(409, 'Esta factura fue anulada');

    const key = `invoices/${request.invoiceId}/signature/${randomUUID()}.png`;
    await getStorage().put(key, image, 'image/png');

    const signedAt = new Date();
    // conditional update: two simultaneous signatures can't both win
    const { count } = await prisma.invoiceSignatureRequest.updateMany({
        where: { id: request.id, OR: [{ signedAt: null }, { signedAt: { isSet: false } }] },
        data: { signedAt, signatureKey: key, signerIp: meta.ip, signerUserAgent: meta.userAgent }
    });
    if (count === 0) {
        await getStorage().delete(key);
        throw new HttpError(409, 'Esta factura ya fue firmada');
    }

    await prisma.$transaction([
        prisma.invoiceSignatureRequest.update({
            where: { id: request.id },
            data: { events: { push: { type: 'SIGNED', at: signedAt, ...meta } } }
        }),
        prisma.clientInvoice.update({ where: { id: request.invoiceId }, data: { signedAt } })
    ]);

    return { signedAt };
}

export async function getSignatureFile(invoiceId: string) {
    const request = await prisma.invoiceSignatureRequest.findUnique({ where: { invoiceId } });
    if (!request?.signatureKey) throw new HttpError(404, 'La factura no está firmada');
    return getStorage().get(request.signatureKey);
}
