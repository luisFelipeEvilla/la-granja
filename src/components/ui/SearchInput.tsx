"use client";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

type Props = { value: string, onChange: (value: string) => void, placeholder?: string, className?: string };

export default function SearchInput({ value, onChange, placeholder = "Buscar...", className = "" }: Props) {
    return (
        <div className={`relative ${className}`}>
            <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-10 w-full rounded-lg border-0 bg-white pl-9 pr-9 text-sm text-slate-900 shadow-xs ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-700"
                >
                    <HiXMark className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
