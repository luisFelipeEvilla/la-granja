import { AwsClient } from "aws4fetch";
import { StorageDriver } from "./types";

// any S3-compatible provider: Cloudflare R2 (S3_REGION=auto), AWS S3, Backblaze B2, MinIO...
export function createS3Driver(): StorageDriver {
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
        throw new Error('S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY son requeridos para el almacenamiento');
    }

    const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: process.env.S3_REGION ?? 'auto' });
    // path-style URLs (endpoint/bucket/key) work on R2, S3 and MinIO
    const objectUrl = (key: string) => `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

    const fail = async (action: string, res: Response) => {
        throw new Error(`S3 ${action} falló (${res.status}): ${(await res.text()).slice(0, 300)}`);
    };

    return {
        async put(key, data, contentType) {
            const res = await client.fetch(objectUrl(key), {
                method: 'PUT',
                headers: { 'Content-Type': contentType },
                body: new Uint8Array(data)
            });
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
        async delete(key) {
            const res = await client.fetch(objectUrl(key), { method: 'DELETE' });
            // S3 answers 204 even when the object doesn't exist
            if (!res.ok && res.status !== 404) await fail('delete', res);
        }
    };
}
