"use client";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ReactNode, useState } from "react";
import { HiCheck, HiChevronUpDown, HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { fieldClasses, ItemProps, normalize, panelClasses, readOptions } from "./utils";

export type MultiSelectProps = {
    value?: string[],
    onValueChange?: (values: string[]) => void,
    // shown when nothing is selected
    placeholder?: string,
    // placeholder of the search box inside the panel
    placeholderSearch?: string,
    disabled?: boolean,
    className?: string,
    id?: string,
    children?: ReactNode
};

export function MultiSelectItem(_props: ItemProps) {
    return null;
}

const MAX_CHIPS = 2;

export function MultiSelect({
    value = [], onValueChange, placeholder = "Seleccionar", placeholderSearch = "Buscar", disabled, className = "", id, children
}: MultiSelectProps) {
    const [query, setQuery] = useState("");
    const options = readOptions(children);
    const selected = options.filter((option) => value.includes(option.value));
    const filtered = query ? options.filter((option) => normalize(option.text).includes(normalize(query))) : options;

    const toggle = (optionValue: string) => onValueChange?.(
        value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]
    );

    return (
        <Popover className={`relative w-full min-w-0 ${className}`}>
            <PopoverButton
                id={id}
                disabled={disabled}
                className={`${fieldClasses(false, disabled)} flex h-10 pointer-coarse:min-h-[44px] min-w-0 items-center gap-1.5 pl-3 ${selected.length ? "pr-16" : "pr-9"} text-left`}
            >
                {selected.length === 0 ? (
                    <span className="truncate text-slate-400">{placeholder}</span>
                ) : (
                    // chips stay inside the button so a long selection never widens the page
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                        {selected.slice(0, MAX_CHIPS).map((option) => (
                            <span key={option.value} className="min-w-0 max-w-[45%] truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                {option.text}
                            </span>
                        ))}
                        {selected.length > MAX_CHIPS && (
                            <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                +{selected.length - MAX_CHIPS}
                            </span>
                        )}
                    </span>
                )}
            </PopoverButton>
            {selected.length > 0 && !disabled && (
                <button
                    type="button"
                    onClick={() => onValueChange?.([])}
                    aria-label="Quitar todos"
                    className="absolute right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                    <HiXMark className="h-4 w-4" />
                </button>
            )}
            <HiChevronUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />

            <PopoverPanel anchor="bottom start" transition className={`${panelClasses} w-(--button-width) min-w-60`}>
                <div className="relative mb-1">
                    <HiMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholderSearch}
                        aria-label={placeholderSearch}
                        className="h-9 pointer-coarse:min-h-[44px] w-full rounded-md bg-slate-50 pl-8 pr-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 [&::-webkit-search-cancel-button]:hidden"
                    />
                </div>
                <div role="listbox" aria-multiselectable="true">
                    {filtered.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Sin resultados</p>}
                    {filtered.map((option) => {
                        const checked = value.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={checked}
                                disabled={option.disabled}
                                onClick={() => toggle(option.value)}
                                className="flex min-h-[40px] pointer-coarse:min-h-[44px] w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-hidden disabled:opacity-50"
                            >
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`}>
                                    {checked && <HiCheck className="h-3 w-3" />}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </PopoverPanel>
        </Popover>
    );
}

export default MultiSelect;
