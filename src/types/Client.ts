import { Prisma } from "@prisma/client";

export type ClientInvoiceWithPayments = Prisma.ClientInvoiceGetPayload<{
    include: { payments: true }
}>;

export type ClientWithInvoices = Prisma.ClientGetPayload<{
    include: { invoices: { include: { payments: true } } }
}>;

export type InvoiceWithClient = Prisma.ClientInvoiceGetPayload<{
    include: { client: true, payments: true }
}>;

export type ClientSummary = {
    invoiced: number,
    paid: number,
    balance: number
};

export type ClientWithSummary = Prisma.ClientGetPayload<{}> & { summary: ClientSummary };

export type PaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ANULADA';
