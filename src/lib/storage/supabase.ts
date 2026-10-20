import { StorageDriver } from "./types";

// Supabase Storage through its REST API (no SDK needed), using a private bucket
export function createSupabaseDriver(): StorageDriver {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'la-granja';

    if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos para el almacenamiento');

    const headers = { Authorization: `Bearer ${key}`, apikey: key };
    const objectUrl = (path: string) => `${url}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;

    const fail = async (action: string, res: Response) => {
        throw new Error(`Supabase storage ${action} falló (${res.status}): ${await res.text()}`);
    };

    return {
        async put(path, data, contentType) {
            const res = await fetch(objectUrl(path), {
                method: 'POST',
                headers: { ...headers, 'Content-Type': contentType, 'x-upsert': 'true' },
                body: new Uint8Array(data)
            });
            if (!res.ok) await fail('upload', res);
        },
        async get(path) {
            const res = await fetch(objectUrl(path), { headers, cache: 'no-store' });
            if (!res.ok) await fail('download', res);
            return {
                data: Buffer.from(await res.arrayBuffer()),
                contentType: res.headers.get('content-type') ?? 'application/octet-stream'
            };
        },
        async delete(path) {
            const res = await fetch(`${url}/storage/v1/object/${bucket}`, {
                method: 'DELETE',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefixes: [path] })
            });
            if (!res.ok) await fail('delete', res);
        }
    };
}
