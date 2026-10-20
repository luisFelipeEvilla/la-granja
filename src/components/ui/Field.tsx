import { ReactNode } from "react";

type Props = {
    label: ReactNode,
    htmlFor?: string,
    required?: boolean,
    hint?: ReactNode,
    error?: ReactNode,
    className?: string,
    children: ReactNode
};

// label + control + hint or error message, with consistent spacing
export default function Field({ label, htmlFor, required, hint, error, className = "", children }: Props) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
                {label}
                {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
            </label>
            {children}
            {error
                ? <p className="text-sm text-red-600" role="alert">{error}</p>
                : hint && <p className="text-sm text-slate-500">{hint}</p>}
        </div>
    );
}

export function FormSection({ title, description, children }: { title: ReactNode, description?: ReactNode, children: ReactNode }) {
    return (
        <div className="grid gap-x-8 gap-y-4 py-6 first:pt-0 last:pb-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <div className="space-y-5">{children}</div>
        </div>
    );
}
