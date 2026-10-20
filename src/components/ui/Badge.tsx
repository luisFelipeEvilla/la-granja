import { ReactNode } from "react";

export type BadgeTone = "gray" | "emerald" | "blue" | "amber" | "red";

const tones: Record<BadgeTone, string> = {
    gray: "bg-slate-100 text-slate-600 ring-slate-500/10",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
};

const dots: Record<BadgeTone, string> = {
    gray: "bg-slate-400", emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", red: "bg-red-500",
};

export default function Badge({ tone = "gray", children, dot = true }: { tone?: BadgeTone, children: ReactNode, dot?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
            {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />}
            {children}
        </span>
    );
}
