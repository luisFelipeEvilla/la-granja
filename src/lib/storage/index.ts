import { createLocalDriver } from "./local";
import { createS3Driver } from "./s3";
import { createSupabaseDriver } from "./supabase";
import { StorageDriver } from "./types";

export type { StorageDriver };

// add new providers here and select them with STORAGE_DRIVER
const drivers: Record<string, () => StorageDriver> = {
    s3: createS3Driver,
    supabase: createSupabaseDriver,
    local: createLocalDriver,
};

let instance: StorageDriver | undefined;

export class StorageConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StorageConfigError';
    }
}

export function getStorage(): StorageDriver {
    if (instance) return instance;

    const name = process.env.STORAGE_DRIVER ?? (process.env.SUPABASE_URL ? 'supabase' : 'local');
    const create = drivers[name];
    if (!create) throw new StorageConfigError(`STORAGE_DRIVER desconocido: ${name}`);
    // the local driver writes to disk, which serverless deployments (Vercel) don't allow
    if (name === 'local' && process.env.VERCEL) {
        throw new StorageConfigError('El almacenamiento de archivos no está configurado (faltan las variables de Supabase)');
    }

    try {
        instance = create();
    } catch (error) {
        throw new StorageConfigError((error as Error).message);
    }
    return instance;
}
