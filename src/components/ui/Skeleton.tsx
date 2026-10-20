export function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

// placeholder while a page loads its data
export function PageSkeleton({ stats = 3, rows = 5 }: { stats?: number, rows?: number }) {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Cargando">
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-72" />
            </div>
            {stats > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {Array.from({ length: stats }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
            )}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
                {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
        </div>
    );
}
