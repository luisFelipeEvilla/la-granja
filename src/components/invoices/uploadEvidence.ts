// uploads one evidence image: straight to the storage provider with a presigned URL when it supports
// it (no Vercel 4.5 MB limit), otherwise through the app's API

const PROXY_MAX_SIZE = 4 * 1024 * 1024;

const errorMessage = async (res: Response, fallback: string) =>
    (await res.json().catch(() => null))?.message ?? fallback;

async function uploadThroughApp(invoiceId: string, file: File) {
    if (file.size > PROXY_MAX_SIZE) throw new Error("La imagen supera los 4 MB");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/client-invoices/${invoiceId}/attachments`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await errorMessage(res, "Error al subir la imagen"));
}

// XMLHttpRequest instead of fetch to report upload progress; resolves with the HTTP status (0 = network/CORS error)
function put(url: string, headers: Record<string, string>, file: File, onProgress: (percent: number) => void) {
    return new Promise<number>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
        xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
        xhr.onload = () => resolve(xhr.status);
        xhr.onerror = () => resolve(0);
        xhr.send(file);
    });
}

export async function uploadEvidence(invoiceId: string, file: File, onProgress: (percent: number) => void) {
    const init = await fetch(`/api/client-invoices/${invoiceId}/attachments/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size })
    });
    if (!init.ok) throw new Error(await errorMessage(init, "No se pudo preparar la subida"));
    const upload = await init.json();

    if (upload.mode !== "direct") return uploadThroughApp(invoiceId, file);

    const status = await put(upload.url, upload.headers, file, onProgress);
    // the bucket may not allow browser uploads yet (CORS): small images can still go through the app
    if (status === 0) return uploadThroughApp(invoiceId, file);
    if (status < 200 || status >= 300) throw new Error("El almacenamiento rechazó la imagen");

    const done = await fetch(`/api/client-invoices/${invoiceId}/attachments/uploads/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: upload.ticket })
    });
    if (!done.ok) throw new Error(await errorMessage(done, "No se pudo confirmar la imagen"));
}
