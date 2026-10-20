"use client";
import { SalesInvoice } from "@/app/utils/sales";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export type Reminder = {
    id: string,
    clientId: string,
    client: { id: string, name: string },
    channel: 'WHATSAPP',
    balance: number,
    invoiceNumbers: number[],
    message: string,
    sentAt: string
};

type SalesData = {
    invoices?: SalesInvoice[],
    reminders?: Reminder[],
    reload: () => Promise<void>
};

const SalesContext = createContext<SalesData>({ reload: async () => {} });

// loaded once for the whole sales section, so switching tabs is instant
export function SalesProvider({ children }: { children: ReactNode }) {
    const [invoices, setInvoices] = useState<SalesInvoice[]>();
    const [reminders, setReminders] = useState<Reminder[]>();

    const reload = useCallback(async () => {
        const [salesRes, remindersRes] = await Promise.all([fetch('/api/sales'), fetch('/api/reminders')]);
        if (!salesRes.ok || !remindersRes.ok) toast.error('No se pudieron cargar las ventas');
        setInvoices(salesRes.ok ? await salesRes.json() : []);
        setReminders(remindersRes.ok ? await remindersRes.json() : []);
    }, []);

    useEffect(() => { reload() }, [reload]);

    return <SalesContext.Provider value={{ invoices, reminders, reload }}>{children}</SalesContext.Provider>;
}

export const useSales = () => useContext(SalesContext);
