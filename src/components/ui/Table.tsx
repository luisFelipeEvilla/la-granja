"use client";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, KeyboardEvent } from "react";

type Align = "left" | "right" | "center";
const alignClass = (align: Align = "left") => align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

export function Table({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <div className="overflow-x-auto">
            <table className={`w-full border-collapse text-sm ${className}`}>{children}</table>
        </div>
    );
}

export function THead({ children }: { children: ReactNode }) {
    return <thead className="bg-slate-50/80"><tr className="border-b border-slate-200">{children}</tr></thead>;
}

export function TH({ children, align, className = "" }: { children?: ReactNode, align?: Align, className?: string }) {
    return (
        <th scope="col" className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6 ${alignClass(align)} ${className}`}>
            {children}
        </th>
    );
}

export function TBody({ children }: { children: ReactNode }) {
    return <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>;
}

// a row with `href` is fully tappable, which is friendlier than a small "Ver" button on iPad
export function TR({ children, href, className = "" }: { children: ReactNode, href?: string | null, className?: string }) {
    const router = useRouter();
    const open = () => href && router.push(href);

    return (
        <tr
            onClick={href ? open : undefined}
            onKeyDown={href ? (e: KeyboardEvent) => { if (e.key === "Enter") open() } : undefined}
            tabIndex={href ? 0 : undefined}
            className={`${href ? "cursor-pointer hover:bg-slate-50 active:bg-slate-100 focus-visible:bg-slate-50 focus-visible:outline-none" : ""} transition-colors ${className}`}
        >
            {children}
        </tr>
    );
}

type TDProps = { children?: ReactNode, align?: Align, className?: string } & Omit<ComponentProps<"td">, "align">;

export function TD({ children, align, className = "", ...props }: TDProps) {
    return (
        <td {...props} className={`px-4 py-3.5 align-middle first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6 ${alignClass(align)} ${className}`}>
            {children}
        </td>
    );
}
