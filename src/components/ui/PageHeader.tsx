import NextLink from "next/link";
import { ReactNode } from "react";
import { HiChevronLeft } from "react-icons/hi";

type Props = {
    title: ReactNode,
    description?: ReactNode,
    // small link above the title back to the parent page
    back?: { href: string, label: string },
    badge?: ReactNode,
    actions?: ReactNode,
    children?: ReactNode
};

export default function PageHeader({ title, description, back, badge, actions, children }: Props) {
    return (
        <header className="space-y-4">
            {back && (
                <NextLink
                    href={back.href}
                    className="-ml-1 inline-flex min-h-0 min-w-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                    <HiChevronLeft className="h-4 w-4" />
                    {back.label}
                </NextLink>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
                        {badge}
                    </div>
                    {description && <div className="mt-1 text-sm text-slate-500 sm:text-base">{description}</div>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
            </div>
            {children}
        </header>
    );
}
