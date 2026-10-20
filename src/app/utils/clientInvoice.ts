import { ClientInvoice, InvoiceItem } from "@prisma/client";
import { ClientSummary, PaymentStatus } from "@/types/Client";

type InvoiceAmounts = Pick<ClientInvoice, 'amount' | 'paidAmount' | 'status'>;

export const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

// invoice and payment dates are calendar days stored at UTC midnight
export const formatDate = (date: Date | string | null) =>
    date ? new Date(date).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '-';

// local calendar day as YYYY-MM-DD, the format the API expects for dates
export const toDateString = (date: Date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const formatQuantity = (quantity: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(quantity);

// short description of an invoice for tables, e.g. "Queso 2,5 Kg, Suero 10 Lts"
export const getItemsSummary = (items: Pick<InvoiceItem, 'name' | 'quantity' | 'unit'>[]) =>
    items.map((item) => `${item.name} ${formatQuantity(item.quantity)} ${item.unit}`).join(', ');

export function getInvoiceBalance(invoice: Pick<ClientInvoice, 'amount' | 'paidAmount'>) {
    return invoice.amount - invoice.paidAmount;
}

export function getPaymentStatus(invoice: InvoiceAmounts): PaymentStatus {
    if (invoice.status === 'ANULADA') return 'ANULADA';

    const balance = getInvoiceBalance(invoice);
    if (balance <= 0) return 'PAGADA';

    return invoice.paidAmount > 0 ? 'PARCIAL' : 'PENDIENTE';
}

// voided invoices are left out of the client totals
export function getClientSummary(invoices: Pick<ClientInvoice, 'amount' | 'paidAmount' | 'status'>[]): ClientSummary {
    return invoices
        .filter((invoice) => invoice.status === 'ACTIVA')
        .reduce((summary, invoice) => ({
            invoiced: summary.invoiced + invoice.amount,
            paid: summary.paid + invoice.paidAmount,
            balance: summary.balance + getInvoiceBalance(invoice)
        }), { invoiced: 0, paid: 0, balance: 0 });
}

export const paymentMethodLabels = {
    EFECTIVO: 'Efectivo',
    TRANSFERENCIA: 'Transferencia',
    OTRO: 'Otro'
};

export const idTypeLabels = {
    CC: 'Cédula de ciudadanía',
    NIT: 'NIT',
    CE: 'Cédula de extranjería',
    TI: 'Tarjeta de identidad'
};
