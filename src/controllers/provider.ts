import prisma from "@/db/client";
import { idType, Provider } from "@prisma/client";
import { HttpError } from "./client";

type ProviderInput = Pick<Provider, 'firstName' | 'lastName' | 'email' | 'idType' | 'idNum' | 'phone' | 'active'>;

const ID_TYPES = Object.values(idType);
const MAX_TEXT = 120;

// only known fields with the right types are saved (no mass assignment of arbitrary fields)
function parseProvider(body: any, partial: boolean): Partial<ProviderInput> {
    if (!body || typeof body !== 'object') throw new HttpError(400, 'Datos inválidos');
    const data: Partial<ProviderInput> = {};
    const has = (key: string) => key in body;

    for (const key of ['firstName', 'lastName'] as const) {
        if (!has(key)) { if (!partial) throw new HttpError(400, 'Nombres y apellidos son requeridos'); continue; }
        const value = String(body[key] ?? '').trim();
        if (!value || value.length > MAX_TEXT) throw new HttpError(400, 'Nombre o apellido inválido');
        data[key] = value;
    }
    if (has('email') || !partial) {
        const email = String(body.email ?? '').trim();
        if (email && (email.length > MAX_TEXT || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new HttpError(400, 'Correo inválido');
        data.email = email;
    }
    if (has('idType') || !partial) {
        if (!ID_TYPES.includes(body.idType)) throw new HttpError(400, 'Tipo de identificación inválido');
        data.idType = body.idType;
    }
    for (const key of ['idNum', 'phone'] as const) {
        if (!has(key)) { if (!partial) throw new HttpError(400, 'Identificación y teléfono son requeridos'); continue; }
        const value = Number(body[key]);
        if (!Number.isSafeInteger(value) || value < 0) throw new HttpError(400, 'Identificación o teléfono inválido');
        data[key] = value;
    }
    if (has('active')) {
        if (typeof body.active !== 'boolean') throw new HttpError(400, 'Estado inválido');
        data.active = body.active;
    }
    return data;
}

// optional YYYY-MM-DD range from the query string
export function parseDateRange(start: string | null, end: string | null, defaultDaysBack: number) {
    const parse = (value: string | null) => {
        if (!value) return undefined;
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new HttpError(400, 'Fecha inválida');
        return date;
    };
    const from = parse(start) ?? new Date(Date.now() - defaultDaysBack * 86_400_000);
    return { gte: from, lte: parse(end) ?? new Date() };
}

export async function getProviders(start: string | null, end: string | null) {
    return prisma.provider.findMany({
        include: { products: { where: { createdAt: parseDateRange(start, end, 1) } } },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });
}

export async function getProvider(id: string, start: string | null, end: string | null) {
    const provider = await prisma.provider.findUnique({
        where: { id },
        include: { products: { where: { createdAt: parseDateRange(start, end, 30) }, orderBy: { createdAt: 'asc' } } }
    });
    if (!provider) throw new HttpError(404, 'Proveedor no encontrado');
    return provider;
}

export const createProvider = (body: unknown) =>
    prisma.provider.create({ data: parseProvider(body, false) as ProviderInput });

export const updateProvider = (id: string, body: unknown) =>
    prisma.provider.update({ where: { id }, data: parseProvider(body, true) });
