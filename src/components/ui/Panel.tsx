import { ReactNode } from "react";

type Props = {
    title?: ReactNode,
    description?: ReactNode,
    actions?: ReactNode,
    // remove the body padding (tables, lists that go edge to edge)
    flush?: boolean,
    footer?: ReactNode,
    className?: string,
    children?: ReactNode
};

export default function Panel({ title, description, actions, flush, footer, className = "", children }: Props) {
    return (
        <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${className}`}>
            {(title || actions) && (
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                        {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
                        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={flush ? "" : "p-4 sm:p-6"}>{children}</div>
            {footer && <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">{footer}</div>}
        </section>
    );
}
