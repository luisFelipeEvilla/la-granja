import { ClientInvoice, ClientPayment, InvoiceItem } from "@prisma/client";
import { formatCOP, formatDate, formatQuantity, getInvoiceBalance, getItemsSummary, getPaymentStatus, toDateString } from "./clientInvoice";

type Dated = Date | string;

export type SalesClient = { id: string, name: string, phone: string | null, idType: string, idNum: string, active: boolean };

export type SalesInvoice = Omit<ClientInvoice, 'issueDate' | 'createdAt'> & {
    issueDate: Dated,
    createdAt: Dated,
    items: InvoiceItem[],
    client: SalesClient,
    payments: (Omit<ClientPayment, 'date' | 'createdAt'> & { date: Dated })[]
};

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';
export const agingBuckets: { key: AgingBucket, label: string }[] = [
    { key: '0-30', label: '0 a 30 días' },
    { key: '31-60', label: '31 a 60 días' },
    { key: '61-90', label: '61 a 90 días' },
    { key: '90+', label: 'Más de 90 días' },
];

// stored dates are calendar days at UTC midnight
export const toDay = (date: Dated) => new Date(date).toISOString().slice(0, 10);

const inPeriod = (day: string, from?: string, to?: string) => (!from || day >= from) && (!to || day <= to);

export const isActive = (invoice: SalesInvoice) => invoice.status === 'ACTIVA';

export function daysSince(date: Dated, today = toDateString()) {
    const ms = new Date(`${today}T00:00:00Z`).getTime() - new Date(`${toDay(date)}T00:00:00Z`).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
}

export function getAgingBucket(days: number): AgingBucket {
    if (days <= 30) return '0-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
}

// sales = active invoices issued in the period; collected = payments dated in the period
export function getPeriodMetrics(invoices: SalesInvoice[], from?: string, to?: string) {
    const sold = invoices.filter((invoice) => isActive(invoice) && inPeriod(toDay(invoice.issueDate), from, to));
    const payments = invoices.filter(isActive).flatMap((invoice) => invoice.payments).filter((payment) => inPeriod(toDay(payment.date), from, to));

    const soldAmount = sold.reduce((total, invoice) => total + invoice.amount, 0);
    const collected = payments.reduce((total, payment) => total + payment.amount, 0);
    const receivable = invoices.filter(isActive).reduce((total, invoice) => total + getInvoiceBalance(invoice), 0);

    return {
        soldAmount,
        collected,
        receivable,
        invoiceCount: sold.length,
        averageTicket: sold.length ? Math.round(soldAmount / sold.length) : 0,
        // share of what was sold in the period that is already paid
        collectionRate: soldAmount ? sold.reduce((total, invoice) => total + invoice.paidAmount, 0) / soldAmount : 0,
        clientsServed: new Set(sold.map((invoice) => invoice.clientId)).size
    };
}

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// "2026-10" -> "Oct 26"
const monthLabel = (key: string) => `${monthNames[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`;

// last `months` months (current included) with sales and collections
export function getMonthlySeries(invoices: SalesInvoice[], months = 12, today = toDateString()) {
    const [year, month] = today.split('-').map(Number);
    const keys = Array.from({ length: months }, (_, i) => {
        const date = new Date(Date.UTC(year, month - 1 - (months - 1 - i), 1));
        return date.toISOString().slice(0, 7);
    });

    const series = new Map(keys.map((key) => [key, { Ventas: 0, Cobros: 0 }]));
    invoices.filter(isActive).forEach((invoice) => {
        const sale = series.get(toDay(invoice.issueDate).slice(0, 7));
        if (sale) sale.Ventas += invoice.amount;
        invoice.payments.forEach((payment) => {
            const collection = series.get(toDay(payment.date).slice(0, 7));
            if (collection) collection.Cobros += payment.amount;
        });
    });

    return keys.map((key) => ({ key, month: monthLabel(key), ...series.get(key)! }));
}

export function getSalesByProduct(invoices: SalesInvoice[], from?: string, to?: string) {
    const products = new Map<string, { name: string, unit: string, quantity: number, amount: number }>();
    invoices.filter((invoice) => isActive(invoice) && inPeriod(toDay(invoice.issueDate), from, to)).forEach((invoice) => {
        invoice.items.forEach((item) => {
            const product = products.get(item.productId) ?? { name: item.name, unit: item.unit, quantity: 0, amount: 0 };
            product.quantity += item.quantity;
            product.amount += item.total;
            products.set(item.productId, product);
        });
    });
    return Array.from(products.values()).sort((a, b) => b.amount - a.amount);
}

export function getSalesByClient(invoices: SalesInvoice[], from?: string, to?: string) {
    const clients = new Map<string, { client: SalesClient, amount: number, invoices: number }>();
    invoices.filter((invoice) => isActive(invoice) && inPeriod(toDay(invoice.issueDate), from, to)).forEach((invoice) => {
        const entry = clients.get(invoice.clientId) ?? { client: invoice.client, amount: 0, invoices: 0 };
        entry.amount += invoice.amount;
        entry.invoices += 1;
        clients.set(invoice.clientId, entry);
    });
    return Array.from(clients.values()).sort((a, b) => b.amount - a.amount);
}

export type ClientReceivable = {
    client: SalesClient,
    balance: number,
    buckets: Record<AgingBucket, number>,
    oldestDays: number,
    pending: { invoice: SalesInvoice, balance: number, days: number }[]
};

// pending balance per client split by age since issue (no due dates: aging only)
export function getReceivables(invoices: SalesInvoice[], today = toDateString()) {
    const clients = new Map<string, ClientReceivable>();
    const totals: Record<AgingBucket, number> = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

    invoices.filter(isActive).forEach((invoice) => {
        const balance = getInvoiceBalance(invoice);
        if (balance <= 0) return;

        const days = daysSince(invoice.issueDate, today);
        const bucket = getAgingBucket(days);
        const entry = clients.get(invoice.clientId) ?? {
            client: invoice.client, balance: 0, oldestDays: 0, pending: [],
            buckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
        };

        entry.balance += balance;
        entry.buckets[bucket] += balance;
        entry.oldestDays = Math.max(entry.oldestDays, days);
        entry.pending.push({ invoice, balance, days });
        totals[bucket] += balance;
        clients.set(invoice.clientId, entry);
    });

    const list = Array.from(clients.values())
        .map((entry) => ({ ...entry, pending: entry.pending.sort((a, b) => b.days - a.days) }))
        .sort((a, b) => b.balance - a.balance);
    const total = list.reduce((sum, entry) => sum + entry.balance, 0);
    // average age of the money owed, weighted by balance
    const weightedDays = total
        ? Math.round(list.flatMap((entry) => entry.pending).reduce((sum, row) => sum + row.days * row.balance, 0) / total)
        : 0;

    return { clients: list, totals, total, weightedDays };
}

// Colombian mobiles are 10 digits starting with 3; WhatsApp needs the 57 country code
export function toWhatsappPhone(phone?: string | null) {
    const digits = (phone ?? '').replace(/\D/g, '');
    if (/^3\d{9}$/.test(digits)) return `57${digits}`;
    if (/^573\d{9}$/.test(digits)) return digits;
    return null;
}

export function getReminderMessage(receivable: Pick<ClientReceivable, 'client' | 'balance' | 'pending'>) {
    const lines = receivable.pending
        .map(({ invoice, balance }) => `• Factura #${invoice.number} del ${formatDate(invoice.issueDate)}: ${formatCOP(balance)}`)
        .join('\n');

    return `Hola ${receivable.client.name}, le saludamos de Lácteos La Granja.\n\n`
        + `Le recordamos que tiene un saldo pendiente de ${formatCOP(receivable.balance)}:\n${lines}\n\n`
        + `¿Nos confirma por favor la fecha de pago? ¡Muchas gracias!`;
}

export const getWhatsappUrl = (phone: string, message: string) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

const csvCell = (value: string | number) => {
    const text = String(value);
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const statusLabels = { PENDIENTE: 'Pendiente', PARCIAL: 'Abonada', PAGADA: 'Pagada', ANULADA: 'Anulada' };

// semicolon separated, opens correctly in Excel with Spanish settings
export function invoicesToCsv(invoices: SalesInvoice[]) {
    const header = ['Factura', 'Fecha', 'Cliente', 'Documento', 'Productos', 'Total', 'Pagado', 'Saldo', 'Estado'];
    const rows = invoices.map((invoice) => [
        invoice.number,
        formatDate(invoice.issueDate),
        invoice.client.name,
        `${invoice.client.idType} ${invoice.client.idNum}`,
        getItemsSummary(invoice.items),
        invoice.amount,
        invoice.paidAmount,
        invoice.status === 'ANULADA' ? 0 : getInvoiceBalance(invoice),
        statusLabels[getPaymentStatus(invoice)],
    ]);
    return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\n');
}

export { formatQuantity };
