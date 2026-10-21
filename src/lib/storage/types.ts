// Contract every storage provider implements (Cloudflare R2 / S3 today, Supabase, local disk...).
// The database only stores object keys, never provider URLs, so switching providers only
// means writing a new driver and changing STORAGE_DRIVER.
export interface StorageDriver {
    put(key: string, data: Buffer, contentType: string): Promise<void>;
    get(key: string): Promise<{ data: Buffer, contentType: string }>;
    delete(key: string): Promise<void>;

    // Optional capabilities for files that don't go through the app (no 4.5 MB Vercel limit).
    // Without them the app falls back to uploading and serving through its own API.
    presignUpload?(key: string, contentType: string, size: number, expiresInSeconds: number): Promise<PresignedUpload>;
    presignDownload?(key: string, expiresInSeconds: number): Promise<string>;
    head?(key: string): Promise<{ size: number, contentType: string } | null>;
    getRange?(key: string, start: number, end: number): Promise<Buffer>;
}

// the browser must send exactly these headers with a PUT to `url`
export type PresignedUpload = { url: string, headers: Record<string, string> };
