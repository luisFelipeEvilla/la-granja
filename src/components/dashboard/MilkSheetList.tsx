"use client";
import { KeyboardEvent } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineTruck } from "react-icons/hi2";
import EmptyState from "@/components/ui/EmptyState";

export type MilkSheetRow = { id: string, name: string, quantity: number };

// numeric keyboard on iPad/iPhone, select the value on tap so typing replaces the 0,
// and the keyboard "next" key moves to the following row instead of submitting the form
const quantityInputProps = {
    inputMode: "numeric" as const,
    enterKeyHint: "next" as const,
    onFocus: (e: any) => e.target.select(),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-quantity]"));
        const next = inputs[inputs.indexOf(e.currentTarget) + 1];
        next ? next.focus() : e.currentTarget.blur();
    },
    "data-quantity": true,
};

type Props = {
    rows: MilkSheetRow[],
    onChange: (id: string, quantity: number) => void,
    disabled?: boolean,
    search?: string,
    unit?: string
};

// declared at module level (not inside the page) so React keeps the inputs, and their focus, between renders
export default function MilkSheetList({ rows, onChange, disabled, search = "", unit = "L" }: Props) {
    const query = search.trim().toLocaleLowerCase();
    const visible = rows.filter((row) => row.name.toLocaleLowerCase().includes(query));

    if (rows.length === 0) {
        return <EmptyState icon={<HiOutlineTruck />} title="No hay proveedores activos" description="Activa proveedores para registrar sus litros." />;
    }

    if (visible.length === 0) {
        return <EmptyState icon={<HiOutlineMagnifyingGlass />} title="Sin resultados" description="Ningún proveedor coincide con la búsqueda." />;
    }

    return (
        <ul className="divide-y divide-slate-100">
            {visible.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                    <span
                        className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:flex
                            ${row.quantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                        {row.name.slice(0, 2).toUpperCase()}
                    </span>
                    <label htmlFor={`qty-${row.id}`} className="min-w-0 flex-1 truncate font-medium text-slate-900">
                        {row.name}
                    </label>
                    <div className="relative w-32 shrink-0 sm:w-36">
                        <input
                            id={`qty-${row.id}`}
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row.quantity ? row.quantity.toString() : ""}
                            onChange={(e) => onChange(row.id, parseInt(e.target.value || "0"))}
                            disabled={disabled}
                            {...quantityInputProps}
                            className={`h-12 w-full rounded-lg border-0 pl-3 pr-9 text-right text-lg font-semibold tabular-nums shadow-sm ring-1 ring-inset
                                focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500
                                ${row.quantity > 0 ? "bg-emerald-50/40 text-slate-900 ring-emerald-200" : "bg-white text-slate-900 ring-slate-300"}`}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{unit}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
}

// "12 de 33 con litros" with a progress bar
export function SheetProgress({ rows }: { rows: MilkSheetRow[] }) {
    const filled = rows.filter((row) => row.quantity > 0).length;
    const percent = rows.length ? Math.round((filled / rows.length) * 100) : 0;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">Avance de la planilla</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">{percent}%</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[28px]">
                {filled} <span className="text-base font-medium text-slate-500">de {rows.length} con litros</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
