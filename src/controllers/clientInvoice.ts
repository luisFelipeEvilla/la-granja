import prisma from "@/db/client";
import { ClientInvoice, ClientPayment } from "@prisma/client";
import { HttpError, isConcurrencyError } from "./client";
import { NextResponse } from "next/server";

const MAX_SAVE_ATTEMPTS = 3;
const INVOICE_COUNTER_ID = 'clientInvoice';

export type InvoiceInput = Pick<ClientInvoice, 'concept' | 'amount'> &
    Partial<Pick<ClientInvoice, 'issueDate' | 'notes'>>;

export type PaymentInput = Pick<ClientPayment, 'amount' | 'method'> &
    Partial<Pick<ClientPayment, 'date' | 'reference'>>;

const isPositiveInt = (value: any) => Number.isInteger(value) && value > 0;

// dates are calendar days: "YYYY-MM-DD" is stored at UTC midnight
const toCalendarDay = (value: Date | string | null | undefined) => {
    if (!value) return undefined;

    const date = new Date(String(value).slice(0, 10));
    if (isNaN(date.getTime())) throw new HttpError(400, 'Fecha inválida');

    return date;
};

async function withRetries<T>(save: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await save();
        } catch (error) {
            if (!isConcurrencyError(error) || attempt >= MAX_SAVE_ATTEMPTS) throw error;
        }
    }
}

export async function getInvoice(id: string) {
    const invoice = await prisma.clientInvoice.findUnique({
        where: { id },
        include: { client: true, payments: { orderBy: { date: 'asc' } } }
    });

    if (!invoice) throw new HttpError(404, 'Factura no encontrada');

    return invoice;
}

export async function createInvoice(clientId: string, data: InvoiceInput) {
    const amount = Number(data.amount);
    if (!data.concept?.trim() || !isPositiveInt(amount)) {
        throw new HttpError(400, 'Concepto y un monto mayor a cero son requeridos');
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new HttpError(404, 'Cliente no encontrado');

    // the counter increment and the invoice are created together so numbers are never skipped or repeated
    return withRetries(() => prisma.$transaction(async (tx) => {
        const counter = await tx.counter.upsert({
            where: { id: INVOICE_COUNTER_ID },
            update: { value: { increment: 1 } },
            create: { id: INVOICE_COUNTER_ID, value: 1 }
        });

        return tx.clientInvoice.create({
            data: {
                number: counter.value,
                clientId,
                concept: data.concept.trim(),
                amount,
                issueDate: toCalendarDay(data.issueDate) ?? toCalendarDay(new Date().toISOString()),
                notes: data.notes?.trim() || null
            }
        });
    }));
}

export async function voidInvoice(id: string) {
    const { count } = await prisma.clientInvoice.updateMany({
        where: { id, status: 'ACTIVA', paidAmount: 0 },
        data: { status: 'ANULADA' }
    });

    if (count === 0) {
        await getInvoice(id);
        throw new HttpError(409, 'Solo se pueden anular facturas activas sin pagos registrados');
    }

    return getInvoice(id);
}

export async function addPayment(invoiceId: string, data: PaymentInput) {
    const amount = Number(data.amount);
    if (!isPositiveInt(amount) || !data.method) {
        throw new HttpError(400, 'Monto mayor a cero y método de pago son requeridos');
    }

    const invoice = await getInvoice(invoiceId);
    if (invoice.status !== 'ACTIVA') throw new HttpError(409, 'La factura está anulada');

    return withRetries(() => prisma.$transaction(async (tx) => {
        // conditional increment: fails if a concurrent payment already used up the balance
        const { count } = await tx.clientInvoice.updateMany({
            where: { id: invoiceId, status: 'ACTIVA', paidAmount: { lte: invoice.amount - amount } },
            data: { paidAmount: { increment: amount } }
        });

        if (count === 0) throw new HttpError(409, 'El pago supera el saldo pendiente de la factura');

        return tx.clientPayment.create({
            data: {
                invoiceId,
                amount,
                method: data.method,
                date: toCalendarDay(data.date) ?? toCalendarDay(new Date().toISOString()),
                reference: data.reference?.trim() || null
            }
        });
    }));
}

export async function deletePayment(id: string) {
    return withRetries(() => prisma.$transaction(async (tx) => {
        const payment = await tx.clientPayment.findUnique({ where: { id } });
        if (!payment) throw new HttpError(404, 'Pago no encontrado');

        await tx.clientPayment.delete({ where: { id } });

        await tx.clientInvoice.update({
            where: { id: payment.invoiceId },
            data: { paidAmount: { decrement: payment.amount } }
        });

        return payment;
    }));
}

export function handleError(error: any) {
    if (error instanceof HttpError) {
        return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
}
