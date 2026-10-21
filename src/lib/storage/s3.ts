import { AwsClient } from "aws4fetch";
import { StorageDriver } from "./types";

function isValidEndpoint(endpoint: string) {
    if (/[<>\s]/.test(endpoint) || endpoint.indexOf('://') !== endpoint.lastIndexOf('://')) return false;
    try {
        const url = new URL(endpoint);
        return (url.protocol === 'https:' || url.protocol === 'http:') && !!url.hostname;
    } catch {
        return false;
    }
}

// any S3-compatible provider: Cloudflare R2 (S3_REGION=auto), AWS S3, Backblaze B2, MinIO...
export function createS3Driver(): StorageDriver {
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
        throw new Error('S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY son requeridos para el almacenamiento');
    }
    // catches pasted templates such as "https://<ACCOUNT_ID>...https://..." before any request is made
    if (!isValidEndpoint(endpoint)) {
        throw new Error('S3_ENDPOINT no es una URL válida (ejemplo: https://<id>.r2.cloudflarestorage.com)');
    }

    const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: process.env.S3_REGION ?? 'auto' });
    // path-style URLs (endpoint/bucket/key) work on R2, S3 and MinIO
    const objectUrl = (key: string) => `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

    const fail = async (action: string, res: Response) => {
        throw new Error(`S3 ${action} falló (${res.status}): ${(await res.text()).slice(0, 300)}`);
    };

    return {
        async put(key, data, contentType) {
            const body = new Uint8Array(data);
            // sign only, then send the raw bytes ourselves: passing a signed Request object made the body a
            // stream, which some runtimes (Vercel) send without Content-Length and R2 rejects (411)
            const signed = await client.sign(objectUrl(key), {
                method: 'PUT',
                headers: { 'Content-Type': contentType, 'Content-Length': String(body.byteLength) },
                body
            });
            const res = await fetch(signed.url, { method: 'PUT', headers: signed.headers, body });
            if (!res.ok) await fail('upload', res);
        },
        async get(key) {
            const res = await client.fetch(objectUrl(key), { method: 'GET' });
            if (!res.ok) await fail('download', res);
            return {
                data: Buffer.from(await res.arrayBuffer()),
                contentType: res.headers.get('content-type') ?? 'application/octet-stream'
            };
        },
        // presigned URLs: Content-Type and Content-Length are part of the signature, so the browser can
        // only upload that exact type and size
        async presignUpload(key, contentType, size, expiresInSeconds) {
            const url = new URL(objectUrl(key));
            url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));
            const headers = { 'Content-Type': contentType, 'Content-Length': String(size) };
            const signed = await client.sign(url.toString(), { method: 'PUT', headers, aws: { signQuery: true, allHeaders: true } });
            // the browser sets Content-Length by itself; it only has to send Content-Type
            return { url: signed.url, headers: { 'Content-Type': contentType } };
        },
        async presignDownload(key, expiresInSeconds) {
            const url = new URL(objectUrl(key));
            url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));
            const signed = await client.sign(url.toString(), { method: 'GET', aws: { signQuery: true } });
            return signed.url;
        },
        async head(key) {
            const res = await client.fetch(objectUrl(key), { method: 'HEAD' });
            if (res.status === 404) return null;
            if (!res.ok) await fail('head', res);
            return { size: Number(res.headers.get('content-length') ?? 0), contentType: res.headers.get('content-type') ?? '' };
        },
        async getRange(key, start, end) {
            const res = await client.fetch(objectUrl(key), { method: 'GET', headers: { Range: `bytes=${start}-${end}` } });
            if (!res.ok) await fail('download', res);
            return Buffer.from(await res.arrayBuffer());
        },
        async delete(key) {
            const res = await client.fetch(objectUrl(key), { method: 'DELETE' });
            // S3 answers 204 even when the object doesn't exist
            if (!res.ok && res.status !== 404) await fail('delete', res);
        }
    };
}
