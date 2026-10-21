"use client";
import { formatCOP } from "@/app/utils/clientInvoice";
import { getWhatsappUrl, toWhatsappPhone } from "@/app/utils/sales";
import { InvoiceWithClient, SignatureRequest } from "@/types/Client";
import Badge from "@/components/ui/Badge";
import Button, { ButtonLink } from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/form";
import { useState } from "react";
import {
    HiOutlineArrowUturnLeft,
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineCheckBadge,
    HiOutlineClipboardDocument,
    HiOutlineExclamationTriangle,
    HiOutlineEye,
    HiOutlinePaperAirplane
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { formatDateTime } from "./EvidencePanel";

type Props = { invoice: InvoiceWithClient, onChange: () => void };

type EventType = SignatureRequest["events"][number]["type"];

const eventLabels: Record<EventType, string> = {
    SENT: "Enviada al cliente",
    OPENED: "Abierta por el cliente",
    SIGNED: "Firmada",
    REVOKED: "Firma anulada",
};

// rough "iPad · Safari" summary of a user agent, enough for an audit trail
export function describeDevice(userAgent?: string | null) {
    if (!userAgent) return "Dispositivo desconocido";
    const device = /iPad/.test(userAgent) ? "iPad"
        : /iPhone/.test(userAgent) ? "iPhone"
        : /Android/.test(userAgent) ? "Android"
        : /Windows/.test(userAgent) ? "Windows"
        : /Macintosh|Mac OS X/.test(userAgent) ? "Mac"
        : /Linux/.test(userAgent) ? "Linux" : "Otro dispositivo";
    const browser = /Edg\//.test(userAgent) ? "Edge"
        : /OPR\//.test(userAgent) ? "Opera"
        : /CriOS|Chrome\//.test(userAgent) ? "Chrome"
        : /FxiOS|Firefox\//.test(userAgent) ? "Firefox"
        : /Safari\//.test(userAgent) ? "Safari" : null;
    return browser ? `${device} · ${browser}` : device;
}

const signingLink = (token: string) => `${window.location.origin}/firmar/${token}`;

// events since the signature was last voided (a voided signature starts a new round with a new link)
const currentRound = (request: SignatureRequest | null) => {
    const events = request?.events ?? [];
    const lastRevoked = events.map((event) => event.type).lastIndexOf("REVOKED");
    return events.slice(lastRevoked + 1);
};

function getStatus(request: SignatureRequest | null) {
    if (request?.signedAt) return { label: "Firmada", tone: "emerald" as const };
    if (request?.openCount) return { label: "Abierta", tone: "amber" as const };
    if (currentRound(request).some((event) => event.type === "SENT")) return { label: "Enviada", tone: "blue" as const };
    return { label: "Sin enviar", tone: "gray" as const };
}

export default function SignaturePanel({ invoice, onChange }: Props) {
    const request = invoice.signatureRequest;
    const [dialog, setDialog] = useState<{ link: string, message: string } | null>(null);
    const [preparing, setPreparing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [revoking, setRevoking] = useState<{ reason: string } | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    const status = getStatus(request);
    const canRequest = invoice.status === "ACTIVA" && !request?.signedAt;
    const phone = toWhatsappPhone(invoice.client.phone);

    // creates the signing link the first time
    const ensureLink = async () => {
        if (request) return signingLink(request.token);
        const res = await fetch(`/api/client-invoices/${invoice.id}/signature-request`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "No se pudo crear el enlace");
        onChange();
        return signingLink(json.token);
    };

    const openSendDialog = async () => {
        setPreparing(true);
        try {
            const link = await ensureLink();
            setDialog({
                link,
                message: `Hola ${invoice.client.name}, le compartimos la factura N° ${invoice.number} de Lácteos La Granja por ${formatCOP(invoice.amount)}.\n\n`
                    + `Por favor revísela y fírmela aquí:\n${link}\n\n¡Muchas gracias!`
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setPreparing(false);
        }
    };

    const copyLink = async (link?: string) => {
        try {
            const url = link ?? await ensureLink();
            await navigator.clipboard.writeText(url);
            toast.success("Enlace copiado");
        } catch (error: any) {
            toast.error(error.message ?? "No se pudo copiar el enlace");
        }
    };

    const sendWhatsapp = async () => {
        if (!dialog || !phone) return;
        // opened synchronously inside the tap, otherwise iPad Safari blocks it as a popup
        window.open(getWhatsappUrl(phone, dialog.message), "_blank", "noopener");

        setSaving(true);
        const res = await fetch(`/api/client-invoices/${invoice.id}/signature-request`, { method: "PATCH" });
        setSaving(false);
        if (!res.ok) return toast.error("No se pudo registrar el envío");

        toast.success("Envío registrado");
        setDialog(null);
        onChange();
    };

    const revokeSignature = async () => {
        if (!revoking) return;
        setRevokeLoading(true);
        const res = await fetch(`/api/client-invoices/${invoice.id}/signature`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: revoking.reason })
        });
        const json = await res.json().catch(() => ({}));
        setRevokeLoading(false);
        if (!res.ok) return toast.error(json.message ?? "No se pudo anular la firma");

        toast.success("Firma anulada. Envía el nuevo enlace para que la firme de nuevo");
        setRevoking(null);
        onChange();
    };

    const events = [...(request?.events ?? [])].reverse();

    return (
        <Panel
            title="Firma del cliente"
            description={request?.signedAt ? "La factura quedó firmada y ya no se puede editar" : "Envía la factura para que el cliente la revise y la firme"}
            actions={<Badge tone={status.tone}>{status.label}</Badge>}
        >
            <div className="space-y-5">
                {request?.signedAt && (
                    <div className="rounded-xl border border-emerald-200 bg-white p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/client-invoices/${invoice.id}/signature/file`}
                            alt="Firma del cliente"
                            className="mx-auto h-32 w-full max-w-md object-contain"
                        />
                        <div className="mt-3 border-t border-slate-100 pt-3 text-center text-sm">
                            <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                <HiOutlineCheckBadge className="h-5 w-5" />
                                Firmada el {formatDateTime(request.signedAt)}
                            </p>
                            <p className="mt-1 text-slate-500">
                                {describeDevice(request.signerUserAgent)}{request.signerIp ? ` · IP ${request.signerIp}` : ""}
                            </p>
                        </div>
                        {invoice.status === "ACTIVA" && (
                            <div className="mt-3 flex justify-center border-t border-slate-100 pt-3">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setRevoking({ reason: "" })}
                                    icon={<HiOutlineArrowUturnLeft className="h-4 w-4" />}
                                >
                                    Anular firma
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {!request?.signedAt && request && request.openCount > 0 && (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                        <HiOutlineEye className="h-4 w-4 text-amber-600" />
                        Abierta {request.openCount} {request.openCount === 1 ? "vez" : "veces"}
                        {request.lastOpenedAt && ` · última el ${formatDateTime(request.lastOpenedAt)}`}
                    </p>
                )}

                {canRequest && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            onClick={openSendDialog}
                            loading={preparing}
                            icon={<HiOutlineChatBubbleLeftEllipsis className="h-4 w-4" />}
                        >
                            {request?.events.some((event) => event.type === "SENT") ? "Reenviar para firmar" : "Enviar para firmar por WhatsApp"}
                        </Button>
                        <Button variant="secondary" onClick={() => copyLink()} icon={<HiOutlineClipboardDocument className="h-4 w-4" />}>
                            Copiar enlace
                        </Button>
                    </div>
                )}

                {events.length > 0 && (
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Registro</p>
                        <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                            {events.map((event, index) => (
                                <li key={index} className="relative">
                                    <span className={`absolute left-[-1.6rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white
                                        ${event.type === "SIGNED" ? "bg-emerald-500" : event.type === "OPENED" ? "bg-amber-400" : event.type === "REVOKED" ? "bg-red-500" : "bg-blue-500"}`}>
                                        {event.type === "SIGNED"
                                            ? <HiOutlineCheckBadge className="h-3 w-3 text-white" />
                                            : event.type === "OPENED" ? <HiOutlineEye className="h-3 w-3 text-white" />
                                            : event.type === "REVOKED" ? <HiOutlineArrowUturnLeft className="h-3 w-3 text-white" />
                                            : <HiOutlinePaperAirplane className="h-3 w-3 text-white" />}
                                    </span>
                                    <p className="text-sm font-medium text-slate-900">
                                        {eventLabels[event.type]}
                                        {event.type === "REVOKED" && event.actor && <span className="font-normal text-slate-500"> por {event.actor}</span>}
                                    </p>
                                    {event.type === "REVOKED" && event.reason && (
                                        <p className="text-sm text-slate-600 [overflow-wrap:anywhere]">Motivo: {event.reason}</p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        {formatDateTime(event.at)} · {describeDevice(event.userAgent)}{event.ip ? ` · IP ${event.ip}` : ""}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {invoice.status !== "ACTIVA" && !request?.signedAt && (
                    <p className="text-sm text-slate-500">Las facturas anuladas no se pueden enviar a firmar.</p>
                )}
            </div>

            <Modal isOpen={revoking !== null} onClose={() => !revokeLoading && setRevoking(null)} backdrop="blur" size="md">
                <ModalContent>
                    {revoking && (
                        <>
                            <ModalHeader className="text-lg font-semibold text-slate-900">¿Anular la firma del cliente?</ModalHeader>
                            <ModalBody className="space-y-4">
                                <p className="text-sm text-slate-600">
                                    La factura #{invoice.number} quedará sin firmar y se podrá editar. Se generará un enlace nuevo
                                    (el anterior dejará de funcionar) para que {invoice.client.name} la firme otra vez.
                                    La firma anulada queda guardada en el registro.
                                </p>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Motivo (opcional)</label>
                                    <Textarea
                                        value={revoking.reason}
                                        onValueChange={(reason) => setRevoking({ reason })}
                                        placeholder="Ej: El cliente firmó sin revisar las cantidades"
                                        rows={3}
                                        maxLength={300}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="secondary" onClick={() => setRevoking(null)} disabled={revokeLoading}>Cancelar</Button>
                                <Button
                                    variant="dark"
                                    className="bg-red-600! hover:bg-red-700!"
                                    onClick={revokeSignature}
                                    loading={revokeLoading}
                                    icon={<HiOutlineArrowUturnLeft className="h-4 w-4" />}
                                >
                                    Anular firma
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={dialog !== null} onClose={() => !saving && setDialog(null)} placement="center" backdrop="blur" size="lg" scrollBehavior="inside">
                <ModalContent>
                    {dialog && (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <span className="text-lg font-semibold text-slate-900">Enviar factura para firmar</span>
                                <span className="text-sm font-normal text-slate-500">
                                    {invoice.client.name} · Factura #{invoice.number} · {formatCOP(invoice.amount)}
                                </span>
                            </ModalHeader>
                            <ModalBody className="space-y-4">
                                {phone ? (
                                    <p className="text-sm text-slate-600">Se enviará a <span className="font-semibold text-slate-900">+{phone.slice(0, 2)} {phone.slice(2)}</span></p>
                                ) : (
                                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0" />
                                        <div className="space-y-2">
                                            <p>El cliente no tiene un celular válido para WhatsApp. Puedes copiar el enlace y enviarlo por otro medio.</p>
                                            <ButtonLink href={`/dashboard/clients/${invoice.clientId}/edit`} variant="secondary" size="sm">Editar cliente</ButtonLink>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Mensaje</label>
                                    <Textarea value={dialog.message} onValueChange={(message) => setDialog({ ...dialog, message })} rows={7} />
                                    <p className="text-sm text-slate-500">Puedes editarlo antes de enviarlo.</p>
                                </div>
                            </ModalBody>
                            <ModalFooter className="flex-wrap">
                                <Button variant="ghost" onClick={() => setDialog(null)} disabled={saving}>Cancelar</Button>
                                <Button variant="secondary" onClick={() => copyLink(dialog.link)} icon={<HiOutlineClipboardDocument className="h-4 w-4" />}>
                                    Copiar enlace
                                </Button>
                                <Button
                                    onClick={sendWhatsapp}
                                    loading={saving}
                                    disabled={!phone || !dialog.message.trim()}
                                    icon={<HiOutlineChatBubbleLeftEllipsis className="h-4 w-4" />}
                                >
                                    Abrir WhatsApp
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </Panel>
    );
}
