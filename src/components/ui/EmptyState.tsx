import { ReactNode } from "react";

type Props = { icon?: ReactNode, title: ReactNode, description?: ReactNode, action?: ReactNode };

export default function EmptyState({ icon, title, description, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">{icon}</div>}
            <p className="text-base font-semibold text-slate-900">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
