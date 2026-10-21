import prisma from "@/db/client";
import { ClientInvoice, ClientPayment, Prisma } from "@prisma/client";
import { HttpError, isConcurrencyError } from "./client";
import { NextResponse } from "next/server";
import { formatCOP } from "@/app/utils/clientInvoice";
import { StorageConfigError } from "@/lib/storage";

const MAX_SAVE_ATTEMPTS = 3;
const INVOICE_COUNTER_ID = 'clientInvoice';

export type InvoiceItemInput = { productId: string, quantity: number, unitPrice: number };

export type InvoiceInput = { items: InvoiceItemInput[] } &
    Partial<Pick<ClientInvoice, 'issueDate' | 'notes'>>;

export type PaymentInput = Pick<ClientPayment, 'amount' | 'method'> &
    Partial<Pick<ClientPayment, 'date' | 'reference'>>;

// account payment (abono a cuenta) and how much of it goes to each invoice
export type ReceiptInput = PaymentInput & { allocations: { invoiceId: string, amount: number }[] };

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
        include: {
            client: true,
            payments: { orderBy: { date: 'asc' } },
            attachments: { orderBy: { createdAt: 'asc' } },
            signatureRequest: true
        }
    });

    if (!invoice) throw new HttpError(404, 'Factura no encontrada');

    return invoice;
}

// validates the lines against the product catalog and computes their totals on the server
async function buildItems(items: InvoiceItemInput[]) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new HttpError(400, 'Agrega al menos un producto a la factura');
    }

    const products = await prisma.product.findMany({
        where: { id: { in: items.map((item) => String(item.productId)) } }
    });

    return items.map((item) => {
        const product = products.find((product) => product.id === item.productId);
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (!product) throw new HttpError(400, 'Producto no encontrado');
        if (!(quantity > 0) || !Number.isFinite(quantity)) {
            throw new HttpError(400, `Cantidad inválida para ${product.name}`);
        }
        if (!isPositiveInt(unitPrice)) throw new HttpError(400, `Precio inválido para ${product.name}`);

        return {
            productId: product.id,
            name: product.name,
            unit: product.unit,
            quantity,
            unitPrice,
            total: Math.round(quantity * unitPrice)
        };
    });
}

export async function createInvoice(clientId: string, data: InvoiceInput) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new HttpError(404, 'Cliente no encontrado');

    const items = await buildItems(data.items);
    const amount = items.reduce((total, item) => total + item.total, 0);

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
                items,
                amount,
                issueDate: toCalendarDay(data.issueDate) ?? toCalendarDay(new Date().toISOString()),
                notes: data.notes?.trim() || null
            }
        });
    }));
}

// replaces the lines, date and notes of an active invoice; the new total can't go below what was already paid
export async function updateInvoice(id: string, data: InvoiceInput) {
    const items = await buildItems(data.items);
    const amount = items.reduce((total, item) => total + item.total, 0);

    // conditional update so a payment registered at the same time can't leave the invoice overpaid
    const { count } = await prisma.clientInvoice.updateMany({
        // invoices created before signatures existed have no signedAt field at all (isSet: false)
        where: { id, status: 'ACTIVA', OR: [{ signedAt: null }, { signedAt: { isSet: false } }], paidAmount: { lte: amount } },
        data: {
            items,
            amount,
            ...(data.issueDate ? { issueDate: toCalendarDay(data.issueDate) } : {}),
            notes: data.notes?.trim() || null
        }
    });

    if (count === 0) {
        const invoice = await getInvoice(id);
        if (invoice.status !== 'ACTIVA') throw new HttpError(409, 'La factura está anulada');
        if (invoice.signedAt) throw new HttpError(409, 'La factura ya fue firmada por el cliente y no se puede editar');

        throw new HttpError(409, `El total no puede ser menor a lo ya pagado (${formatCOP(invoice.paidAmount)})`);
    }

    return getInvoice(id);
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
        if (payment.receiptId) {
            throw new HttpError(409, 'Este pago es parte de un abono a cuenta; elimínalo desde la ficha del cliente');
        }

        await tx.clientPayment.delete({ where: { id } });

        await tx.clientInvoice.update({
            where: { id: payment.invoiceId },
            data: { paidAmount: { decrement: payment.amount } }
        });

        return payment;
    }));
}

// registers a payment against the client's total balance, split over the invoices in `allocations`
export async function addClientReceipt(clientId: string, data: ReceiptInput) {
    const amount = Number(data.amount);
    if (!isPositiveInt(amount) || !data.method) {
        throw new HttpError(400, 'Monto mayor a cero y método de pago son requeridos');
    }

    const allocations = (Array.isArray(data.allocations) ? data.allocations : [])
        .map((allocation) => ({ invoiceId: String(allocation.invoiceId), amount: Number(allocation.amount) }))
        .filter((allocation) => allocation.amount !== 0);

    if (allocations.length === 0) throw new HttpError(400, 'Aplica el abono al menos a una factura');
    if (allocations.some((allocation) => !isPositiveInt(allocation.amount))) {
        throw new HttpError(400, 'Los montos aplicados deben ser mayores a cero');
    }
    if (new Set(allocations.map((allocation) => allocation.invoiceId)).size !== allocations.length) {
        throw new HttpError(400, 'Una factura aparece más de una vez en el abono');
    }
    if (allocations.reduce((total, allocation) => total + allocation.amount, 0) !== amount) {
        throw new HttpError(400, 'Lo aplicado a las facturas debe sumar el monto del abono');
    }

    const invoices = await prisma.clientInvoice.findMany({
        where: { id: { in: allocations.map((allocation) => allocation.invoiceId) }, clientId }
    });
    if (invoices.length !== allocations.length) throw new HttpError(400, 'Factura no encontrada para este cliente');

    const date = toCalendarDay(data.date) ?? toCalendarDay(new Date().toISOString());
    const reference = data.reference?.trim() || null;

    return withRetries(() => prisma.$transaction(async (tx) => {
        for (const allocation of allocations) {
            const invoice = invoices.find((invoice) => invoice.id === allocation.invoiceId)!;

            // conditional increment: fails if the share is more than the invoice still owes
            const { count } = await tx.clientInvoice.updateMany({
                where: { id: invoice.id, status: 'ACTIVA', paidAmount: { lte: invoice.amount - allocation.amount } },
                data: { paidAmount: { increment: allocation.amount } }
            });

            if (count === 0) {
                throw new HttpError(409, invoice.status === 'ACTIVA'
                    ? `El abono supera el saldo pendiente de la factura #${invoice.number}`
                    : `La factura #${invoice.number} está anulada`);
            }
        }

        const receipt = await tx.clientReceipt.create({
            data: { clientId, amount, method: data.method, date, reference }
        });

        await tx.clientPayment.createMany({
            data: allocations.map((allocation) => ({
                invoiceId: allocation.invoiceId,
                receiptId: receipt.id,
                amount: allocation.amount,
                method: data.method,
                date,
                reference
            }))
        });

        return receipt;
    }));
}

// removes an account payment and gives the invoices back what it had paid
export async function deleteReceipt(id: string) {
    return withRetries(() => prisma.$transaction(async (tx) => {
        const receipt = await tx.clientReceipt.findUnique({ where: { id }, include: { payments: true } });
        if (!receipt) throw new HttpError(404, 'Abono no encontrado');

        for (const payment of receipt.payments) {
            await tx.clientInvoice.update({
                where: { id: payment.invoiceId },
                data: { paidAmount: { decrement: payment.amount } }
            });
        }

        await tx.clientPayment.deleteMany({ where: { receiptId: id } });
        await tx.clientReceipt.delete({ where: { id } });

        return receipt;
    }));
}

export function handleError(error: any) {
    if (error instanceof HttpError) {
        return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (error instanceof StorageConfigError) {
        console.error(error);
        return NextResponse.json({ message: 'El almacenamiento de archivos no está configurado. Contacta al administrador.' }, { status: 503 });
    }

    // P2023: malformed id in the URL
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        return NextResponse.json({ message: 'No encontrado' }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 });
}
