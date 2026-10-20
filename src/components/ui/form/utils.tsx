import { Children, isValidElement, ReactElement, ReactNode } from "react";

// shared look of every input, select button and textarea
export const fieldClasses = (error?: boolean, disabled?: boolean) => `
    w-full rounded-lg bg-white text-sm text-slate-900 shadow-xs ring-1 ring-inset transition-shadow
    placeholder:text-slate-400 focus:outline-hidden focus:ring-2
    ${error ? "ring-red-400 focus:ring-red-500" : "ring-slate-300 focus:ring-emerald-500"}
    ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""}
`;

export const optionClasses = `
    group flex min-h-[40px] pointer-coarse:min-h-[44px] cursor-pointer select-none items-center gap-2
    rounded-md px-3 py-2 text-sm text-slate-700
    data-focus:bg-emerald-50 data-focus:text-emerald-900 data-selected:font-semibold data-disabled:opacity-50
`;

export const panelClasses = `
    z-50 max-h-72 overflow-auto rounded-lg bg-white p-1 shadow-lg ring-1 ring-slate-900/10
    [--anchor-gap:4px] focus:outline-hidden
    transition duration-100 ease-out data-closed:opacity-0 data-closed:-translate-y-1
`;

// plain text of a React node, used to show the selected label and to filter options
export function nodeText(node: ReactNode): string {
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(nodeText).join("");
    if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
    return "";
}

// case and accent insensitive comparison ("Panadería" matches "panaderia")
export const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type ItemProps = { value: string, children?: ReactNode, icon?: React.ElementType, disabled?: boolean };

export type Option = { value: string, label: ReactNode, text: string, icon?: React.ElementType, disabled?: boolean };

// options declared as <XItem value="..">label</XItem> children
export function readOptions(children: ReactNode): Option[] {
    return Children.toArray(children)
        .filter((child): child is ReactElement<ItemProps> => isValidElement<ItemProps>(child) && child.props.value !== undefined)
        .map((child) => ({
            value: String(child.props.value),
            label: child.props.children ?? child.props.value,
            text: nodeText(child.props.children) || String(child.props.value),
            icon: child.props.icon,
            disabled: child.props.disabled
        }));
}

export function ErrorMessage({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-red-600" role="alert">{message}</p>;
}
