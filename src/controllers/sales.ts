import prisma from "@/db/client";
import { HttpError } from "./client";

export type ReminderInput = { balance: number, invoiceNumbers: number[], message: string };

const clientFields = { id: true, name: true, phone: true, idType: true, idNum: true, active: true };

// every invoice with its client and payments: the sales section computes its metrics from this
export async function getSalesInvoices() {
    return prisma.clientInvoice.findMany({
        include: {
            client: { select: clientFields },
            payments: { orderBy: { date: 'asc' } }
        },
        orderBy: { number: 'desc' }
    });
}

export async function getReminders() {
    return prisma.clientReminder.findMany({
        include: { client: { select: { id: true, name: true } } },
        orderBy: { sentAt: 'desc' },
        take: 200
    });
}

export async function createReminder(clientId: string, data: ReminderInput) {
    const balance = Number(data.balance);
    if (!Number.isInteger(balance) || balance < 0 || !data.message?.trim()) {
        throw new HttpError(400, 'Saldo y mensaje son requeridos');
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new HttpError(404, 'Cliente no encontrado');

    return prisma.clientReminder.create({
        data: {
            clientId,
            balance,
            invoiceNumbers: Array.isArray(data.invoiceNumbers) ? data.invoiceNumbers.map(Number).filter(Number.isInteger) : [],
            message: data.message.trim()
        }
    });
}
