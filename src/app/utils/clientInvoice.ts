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

export type StatementMovement = {
    date: string,
    description: string,
    charge: number,
    credit: number,
    balance: number
};

type StatementInvoice = Pick<ClientInvoice, 'number' | 'amount' | 'paidAmount' | 'status'> & {
    issueDate: Date | string,
    items: Pick<InvoiceItem, 'name' | 'quantity' | 'unit'>[],
    payments: { amount: number, date: Date | string, method: keyof typeof paymentMethodLabels }[]
};

// calendar day of a stored date ("YYYY-MM-DD"), dates are kept at UTC midnight
const toDay = (date: Date | string) => new Date(date).toISOString().slice(0, 10);

// a payment that settles the invoice is a "Pago", any earlier partial one an "Abono"
function getPaymentMovements(invoice: StatementInvoice) {
    let paid = 0;

    return [...invoice.payments]
        .sort((a, b) => toDay(a.date).localeCompare(toDay(b.date)))
        .map((payment, index) => {
            paid += payment.amount;
            const kind = paid >= invoice.amount ? 'Pago' : 'Abono';

            return {
                date: toDay(payment.date),
                order: 1 + index,
                number: invoice.number,
                description: `${kind} factura #${invoice.number} · ${paymentMethodLabels[payment.method]}`,
                charge: 0,
                credit: payment.amount
            };
        });
}

// account statement for a period ("YYYY-MM-DD" bounds, both optional and inclusive):
// balance before the period, the invoices (charges) and payments (credits) in it with a
// running balance, and the invoices still owing today. Voided invoices are left out
export function getAccountStatement(invoices: StatementInvoice[], from?: string, to?: string) {
    const active = invoices.filter((invoice) => invoice.status === 'ACTIVA');

    const all = active.flatMap((invoice) => [
        {
            date: toDay(invoice.issueDate),
            order: 0,
            number: invoice.number,
            description: `Factura #${invoice.number} · ${getItemsSummary(invoice.items)}`,
            charge: invoice.amount,
            credit: 0
        },
        ...getPaymentMovements(invoice)
    ]).sort((a, b) => a.date.localeCompare(b.date) || a.number - b.number || a.order - b.order);

    const before = all.filter((movement) => from && movement.date < from);
    const inPeriod = all.filter((movement) => (!from || movement.date >= from) && (!to || movement.date <= to));

    const openingBalance = before.reduce((balance, movement) => balance + movement.charge - movement.credit, 0);

    let balance = openingBalance;
    const movements: StatementMovement[] = inPeriod.map(({ date, description, charge, credit }) => {
        balance += charge - credit;
        return { date, description, charge, credit, balance };
    });

    return {
        openingBalance,
        movements,
        totalCharges: movements.reduce((total, movement) => total + movement.charge, 0),
        totalCredits: movements.reduce((total, movement) => total + movement.credit, 0),
        closingBalance: balance,
        // oldest first, the order in which they are collected
        pendingInvoices: active
            .filter((invoice) => getInvoiceBalance(invoice) > 0)
            .sort((a, b) => toDay(a.issueDate).localeCompare(toDay(b.issueDate)) || a.number - b.number)
    };
}

export const getPeriodLabel = (from?: string, to?: string) =>
    from || to ? `${from ? formatDate(from) : 'Inicio'} - ${to ? formatDate(to) : 'Hoy'}` : 'Todo el historial';
