"use client";
import { formatCOP, formatDate, formatQuantity, idTypeLabels } from "@/app/utils/clientInvoice";
import SignaturePad, { SignaturePadHandle } from "@/components/signature/SignaturePad";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { HiCheck, HiOutlineArrowPath, HiOutlineCheckBadge, HiOutlineLink, HiOutlineNoSymbol } from "react-icons/hi2";

type PublicInvoice = {
    number: number,
    issueDate: string,
    items: { name: string, unit: string, quantity: number, unitPrice: number, total: number }[],
    amount: number,
    notes: string | null,
    status: "ACTIVA" | "ANULADA",
    client: { name: string, idType: keyof typeof idTypeLabels, idNum: string }
};

type State =
    | { kind: "loading" }
    | { kind: "invalid" }
    | { kind: "ready", invoice: PublicInvoice, signedAt: string | null }
    | { kind: "done", invoice: PublicInvoice, signedAt: string, signature: string };

const formatDateTime = (date: string) =>
    // "p. m." already ends with a period: drop it so sentences don't end with ".."
    new Date(date).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" }).replace(/\.$/, "");

export default function SignInvoicePage({ params }: { params: { token: string } }) {
    const [state, setState] = useState<State>({ kind: "loading" });
    const [empty, setEmpty] = useState(true);
    const [signing, setSigning] = useState(false);
    const pad = useRef<SignaturePadHandle>(null);

    // each GET records an "opened" event: load once per visit (React may run effects twice in development)
    const loaded = useRef(false);
    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;
        fetch(`/api/signatures/${params.token}`, { cache: "no-store" })
            .then(async (res) => {
                if (!res.ok) return setState({ kind: "invalid" });
                const data = await res.json();
                setState({ kind: "ready", invoice: data.invoice, signedAt: data.signedAt });
            })
            .catch(() => setState({ kind: "invalid" }));
    }, [params.token]);

    const sign = async () => {
        if (state.kind !== "ready" || !pad.current || pad.current.isEmpty()) return;
        const signature = pad.current.toDataURL();

        setSigning(true);
        try {
            const res = await fetch(`/api/signatures/${params.token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? "No pudimos guardar la firma. Intenta de nuevo");
                return;
            }
            setState({ kind: "done", invoice: state.invoice, signedAt: data.signedAt, signature });
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
            toast.error("Revisa tu conexión e intenta de nuevo");
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="min-h-dvh bg-slate-50 pb-safe">
            <Toaster position="top-center" toastOptions={{ className: "rounded-xl! text-sm! font-medium!" }} />

            <header className="border-b border-slate-200 bg-white safe-top">
                <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
                    <Image src="/images/logo.jpg" alt="" width={80} height={80} priority className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200" />
                    <p className="font-semibold text-slate-900">Lácteos La Granja</p>
                </div>
            </header>

            <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
                {state.kind === "loading" && <LoadingState />}

                {state.kind === "invalid" && (
                    <Panel>
                        <EmptyState
                            icon={<HiOutlineLink />}
                            title="Este enlace no es válido"
                            description="Puede que esté incompleto o haya cambiado. Pide a Lácteos La Granja que te lo envíe de nuevo."
                        />
                    </Panel>
                )}

                {state.kind === "done" && (
                    <Panel>
                        <div className="flex flex-col items-center px-2 py-6 text-center">
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <HiCheck className="h-9 w-9" />
                            </span>
                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">¡Factura firmada!</h1>
                            <p className="mt-1 text-sm text-slate-500">Firmaste la factura N° {state.invoice.number} el {formatDateTime(state.signedAt)}.</p>
                            <div className="mt-6 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={state.signature} alt="Tu firma" className="mx-auto max-h-32 w-full object-contain" />
                                <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">{state.invoice.client.name}</p>
                            </div>
                            <p className="mt-6 text-sm text-slate-500">Gracias. Ya puedes cerrar esta página.</p>
                        </div>
                    </Panel>
                )}

                {(state.kind === "ready" || state.kind === "done") && <InvoiceDocument invoice={state.invoice} />}

                {state.kind === "ready" && (
                    state.invoice.status === "ANULADA" ? (
                        <Notice tone="gray" icon={<HiOutlineNoSymbol className="h-5 w-5" />} title="Esta factura fue anulada">
                            Ya no es necesario firmarla.
                        </Notice>
                    ) : state.signedAt ? (
                        <Notice tone="emerald" icon={<HiOutlineCheckBadge className="h-5 w-5" />} title="Factura firmada">
                            Esta factura ya fue firmada el {formatDateTime(state.signedAt)}.
                        </Notice>
                    ) : (
                        <Panel title="Firma" description="Firma con tu dedo dentro del recuadro para confirmar que recibiste esta factura.">
                            <SignaturePad ref={pad} onChange={setEmpty} disabled={signing} />
                            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    icon={<HiOutlineArrowPath className="h-4 w-4" />}
                                    onClick={() => pad.current?.clear()}
                                    disabled={empty || signing}
                                >
                                    Borrar
                                </Button>
                                <Button size="lg" onClick={sign} disabled={empty} loading={signing}>
                                    {signing ? "Firmando..." : "Firmar factura"}
                                </Button>
                            </div>
                            <p className="mt-4 text-xs text-slate-400">
                                Al firmar se guardan la fecha, la hora y el dispositivo desde el que firmas.
                            </p>
                        </Panel>
                    )
                )}
            </main>
        </div>
    );
}

function InvoiceDocument({ invoice }: { invoice: PublicInvoice }) {
    return (
        <Panel flush>
            <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Factura de venta</p>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">N° {invoice.number}</h1>
                    <p className="text-sm text-slate-500">Emitida el {formatDate(invoice.issueDate)}</p>
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cliente</p>
                    <p className="mt-0.5 font-semibold text-slate-900 wrap-anywhere">{invoice.client.name}</p>
                    <p className="text-sm text-slate-500">{idTypeLabels[invoice.client.idType] ?? invoice.client.idType} {invoice.client.idNum}</p>
                </div>
            </div>

            {/* phones: one card per product */}
            <ul className="divide-y divide-slate-100 sm:hidden">
                {invoice.items.map((item, index) => (
                    <li key={index} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-slate-900 wrap-anywhere">{item.name}</p>
                            <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatCOP(item.total)}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
                            {formatQuantity(item.quantity)} {item.unit} × {formatCOP(item.unitPrice)}
                        </p>
                    </li>
                ))}
            </ul>

            {/* wider screens: table */}
            <div className="hidden sm:block">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80">
                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-6 py-3 text-left">Producto</th>
                            <th className="px-4 py-3 text-right">Cantidad</th>
                            <th className="px-4 py-3 text-right">Precio</th>
                            <th className="px-6 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-3 font-medium text-slate-900 wrap-anywhere">{item.name}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatQuantity(item.quantity)} {item.unit}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCOP(item.unitPrice)}</td>
                                <td className="whitespace-nowrap px-6 py-3 text-right font-semibold tabular-nums text-slate-900">{formatCOP(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-emerald-50/60 px-4 py-4 sm:px-6">
                <p className="font-semibold text-slate-900">Total</p>
                <p className="text-xl font-bold tabular-nums text-emerald-700">{formatCOP(invoice.amount)}</p>
            </div>

            {invoice.notes && (
                <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notas</p>
                    <p className="mt-1 text-sm text-slate-700 wrap-anywhere">{invoice.notes}</p>
                </div>
            )}
        </Panel>
    );
}

function Notice({ tone, icon, title, children }: { tone: "emerald" | "gray", icon: React.ReactNode, title: string, children: React.ReactNode }) {
    const styles = tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-100 text-slate-700";
    return (
        <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${styles}`}>
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm opacity-90">{children}</p>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-5" aria-busy="true" aria-label="Cargando factura">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
        </div>
    );
}
