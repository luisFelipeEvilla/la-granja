"use client";
import { SalesProvider } from "@/components/sales/SalesContext";
import { ButtonLink } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

const tabs = [
    { href: "/dashboard/sales", label: "Resumen" },
    { href: "/dashboard/sales/invoices", label: "Facturas" },
    { href: "/dashboard/sales/receivables", label: "Cartera" },
    { href: "/dashboard/sales/reminders", label: "Recordatorios" },
];

export default function SalesLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    // the new invoice page has its own header
    const isForm = pathname.endsWith("/new");

    return (
        <SalesProvider>
            <div className="space-y-6">
                {!isForm && (
                    <>
                        <PageHeader
                            title="Facturación y ventas"
                            description="Ventas, facturas, cartera y cobros de tus clientes"
                            actions={
                                <ButtonLink href="/dashboard/sales/invoices/new" icon={<HiOutlinePlus className="h-4 w-4" />}>
                                    Nueva factura
                                </ButtonLink>
                            }
                        />
                        <nav aria-label="Secciones de facturación" className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
                            <div className="flex min-w-max gap-1 border-b border-slate-200">
                                {tabs.map((tab) => {
                                    const active = tab.href === "/dashboard/sales" ? pathname === tab.href : pathname.startsWith(tab.href);
                                    return (
                                        <NextLink
                                            key={tab.href}
                                            href={tab.href}
                                            aria-current={active ? "page" : undefined}
                                            className={`-mb-px inline-flex min-h-[44px] items-center border-b-2 px-4 text-sm font-semibold transition-colors
                                                ${active ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
                                        >
                                            {tab.label}
                                        </NextLink>
                                    );
                                })}
                            </div>
                        </nav>
                    </>
                )}
                {children}
            </div>
        </SalesProvider>
    );
}
