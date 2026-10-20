"use client";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { ElementType, ReactNode, useState } from "react";
import { HiCheck, HiChevronUpDown, HiXMark } from "react-icons/hi2";
import { ErrorMessage, fieldClasses, ItemProps, normalize, optionClasses, panelClasses, readOptions } from "./utils";

export type SearchSelectProps = {
    value?: string,
    onValueChange?: (value: string) => void,
    placeholder?: string,
    enableClear?: boolean,
    disabled?: boolean,
    error?: boolean,
    errorMessage?: string,
    icon?: ElementType,
    className?: string,
    id?: string,
    children?: ReactNode
};

export function SearchSelectItem(_props: ItemProps) {
    return null;
}

// select with a search box: typing filters the options (ignores case and accents)
export function SearchSelect({
    value = "", onValueChange, placeholder = "Buscar...", enableClear = true, disabled, error, errorMessage, icon: Icon, className = "", id, children
}: SearchSelectProps) {
    const [query, setQuery] = useState("");
    const options = readOptions(children);
    const selected = options.find((option) => option.value === value) ?? null;
    const filtered = query ? options.filter((option) => normalize(option.text).includes(normalize(query))) : options;
    const showClear = enableClear && !!selected && !disabled;

    return (
        <div className={`w-full ${className}`}>
            <Combobox
                value={selected}
                onChange={(option) => { onValueChange?.(option?.value ?? ""); setQuery(""); }}
                onClose={() => setQuery("")}
                disabled={disabled}
                immediate
                by="value"
            >
                <div className="relative">
                    {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
                    <ComboboxInput
                        id={id}
                        aria-invalid={error || undefined}
                        placeholder={placeholder}
                        autoComplete="off"
                        displayValue={(option: typeof selected) => option?.text ?? ""}
                        onChange={(e) => setQuery(e.target.value)}
                        className={`${fieldClasses(error, disabled)} h-10 pointer-coarse:min-h-[44px] ${Icon ? "pl-9" : "pl-3"} ${showClear ? "pr-16" : "pr-9"}`}
                    />
                    {showClear && (
                        <button
                            type="button"
                            onClick={() => { onValueChange?.(""); setQuery(""); }}
                            aria-label="Limpiar selección"
                            className="absolute right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <HiXMark className="h-4 w-4" />
                        </button>
                    )}
                    <ComboboxButton className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400" aria-label="Ver opciones">
                        <HiChevronUpDown className="h-4 w-4" />
                    </ComboboxButton>
                </div>
                <ComboboxOptions anchor="bottom start" transition className={`${panelClasses} w-(--input-width) min-w-48 empty:invisible`}>
                    {filtered.length === 0
                        ? <p className="px-3 py-2 text-sm text-slate-500">Sin resultados</p>
                        : filtered.map((option) => (
                            <ComboboxOption key={option.value} value={option} disabled={option.disabled} className={optionClasses}>
                                {option.icon && <option.icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
                                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                <HiCheck className="invisible h-4 w-4 shrink-0 text-emerald-600 group-data-selected:visible" aria-hidden="true" />
                            </ComboboxOption>
                        ))}
                </ComboboxOptions>
            </Combobox>
            {error && <ErrorMessage message={errorMessage} />}
        </div>
    );
}

export default SearchSelect;
