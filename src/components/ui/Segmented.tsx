"use client";

type Option<T extends string> = { value: T, label: string, count?: number };

type Props<T extends string> = { value: T, onChange: (value: T) => void, options: Option<T>[], className?: string, label?: string };

// pill tabs used as quick filters ("Todos", "Activos", ...)
export default function Segmented<T extends string>({ value, onChange, options, className = "", label }: Props<T>) {
    return (
        <div role="tablist" aria-label={label} className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 scrollbar-hide ${className}`}>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={`inline-flex min-h-[32px] pointer-coarse:min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors
                            ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        {option.label}
                        {option.count !== undefined && (
                            <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-slate-100 text-slate-700" : "bg-slate-200/70 text-slate-500"}`}>
                                {option.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
