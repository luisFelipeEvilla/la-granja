// Contract every storage provider implements (Supabase today; S3, Cloudflare R2, etc. later).
// The database only stores object keys, never provider URLs, so switching providers only
// means writing a new driver and changing STORAGE_DRIVER.
export interface StorageDriver {
    put(key: string, data: Buffer, contentType: string): Promise<void>;
    get(key: string): Promise<{ data: Buffer, contentType: string }>;
    delete(key: string): Promise<void>;
}
