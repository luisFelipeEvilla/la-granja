import prisma from "@/db/client";
import { getClientSummary } from "@/app/utils/clientInvoice";
import { Client, Prisma } from "@prisma/client";

export type ClientInput = Pick<Client, 'name' | 'idType' | 'idNum'> &
    Partial<Pick<Client, 'phone' | 'email' | 'address' | 'active'>>;

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

// P2002 = unique constraint violation, P2034 = transaction write conflict
export const isConcurrencyError = (error: any) =>
    error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code);

const isDuplicateIdError = (error: any) =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const pickClientFields = (data: Partial<ClientInput>): Partial<ClientInput> => ({
    name: data.name?.trim(),
    idType: data.idType,
    idNum: data.idNum?.toString().trim(),
    phone: data.phone?.toString().trim() || null,
    email: data.email?.trim() || null,
    address: data.address?.trim() || null,
    active: data.active
});

export async function getClients(search?: string | null) {
    const clients = await prisma.client.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { idNum: { contains: search } }
            ]
        } : undefined,
        include: {
            invoices: { select: { amount: true, paidAmount: true, status: true } }
        },
        orderBy: { name: 'asc' }
    });

    return clients.map(({ invoices, ...client }) => ({ ...client, summary: getClientSummary(invoices) }));
}

export async function getClient(id: string) {
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            invoices: {
                include: { payments: { orderBy: { date: 'asc' } } },
                orderBy: { number: 'desc' }
            },
            receipts: {
                include: { payments: { include: { invoice: { select: { number: true } } } } },
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
            }
        }
    });

    if (!client) throw new HttpError(404, 'Cliente no encontrado');

    return { ...client, summary: getClientSummary(client.invoices) };
}

export async function createClient(data: ClientInput) {
    const client = pickClientFields(data);
    if (!client.name || !client.idType || !client.idNum) {
        throw new HttpError(400, 'Nombre, tipo y número de identificación son requeridos');
    }

    try {
        return await prisma.client.create({ data: client as ClientInput });
    } catch (error) {
        if (isDuplicateIdError(error)) throw new HttpError(409, 'Ya existe un cliente con esa identificación');
        throw error;
    }
}

export async function updateClient(id: string, data: Partial<ClientInput>) {
    // only update the fields that were sent
    const fields = Object.fromEntries(
        Object.entries(pickClientFields(data)).filter(([key]) => key in data)
    );

    try {
        return await prisma.client.update({ where: { id }, data: fields });
    } catch (error) {
        if (isDuplicateIdError(error)) throw new HttpError(409, 'Ya existe un cliente con esa identificación');
        throw error;
    }
}
