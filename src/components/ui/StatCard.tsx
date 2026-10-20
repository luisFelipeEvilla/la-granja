import { ReactNode } from "react";

type Tone = "default" | "emerald" | "blue" | "red" | "amber" | "violet";

const tones: Record<Tone, { icon: string, value: string }> = {
    default: { icon: "bg-slate-100 text-slate-600", value: "text-slate-900" },
    emerald: { icon: "bg-emerald-50 text-emerald-600", value: "text-slate-900" },
    blue: { icon: "bg-blue-50 text-blue-600", value: "text-slate-900" },
    red: { icon: "bg-red-50 text-red-600", value: "text-red-600" },
    amber: { icon: "bg-amber-50 text-amber-600", value: "text-slate-900" },
    violet: { icon: "bg-violet-50 text-violet-600", value: "text-slate-900" },
};

type Props = { label: ReactNode, value: ReactNode, icon?: ReactNode, tone?: Tone, hint?: ReactNode, className?: string };

export default function StatCard({ label, value, icon, tone = "default", hint, className = "" }: Props) {
    return (
        <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-5 ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                {icon && <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${tones[tone].icon}`}>{icon}</span>}
            </div>
            {/* sized to fit two cards per row on phones with amounts in the millions */}
            <p className={`mt-2 text-lg font-bold tracking-tight tabular-nums wrap-anywhere min-[420px]:text-xl sm:text-2xl xl:text-[28px] ${tones[tone].value}`}>{value}</p>
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}
