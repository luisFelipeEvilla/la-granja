import { promises as fs } from "fs";
import path from "path";
import { StorageDriver } from "./types";

// development only: files under .storage/ in the project (Vercel's filesystem is read-only)
export function createLocalDriver(): StorageDriver {
    const root = path.join(process.cwd(), '.storage');
    const file = (key: string) => {
        const target = path.join(root, key);
        if (!target.startsWith(root + path.sep)) throw new Error('Ruta de archivo inválida');
        return target;
    };

    return {
        async put(key, data, contentType) {
            await fs.mkdir(path.dirname(file(key)), { recursive: true });
            await fs.writeFile(file(key), data);
            await fs.writeFile(`${file(key)}.type`, contentType);
        },
        async get(key) {
            const [data, contentType] = await Promise.all([
                fs.readFile(file(key)),
                fs.readFile(`${file(key)}.type`, 'utf8').catch(() => 'application/octet-stream')
            ]);
            return { data, contentType };
        },
        async delete(key) {
            await fs.rm(file(key), { force: true });
            await fs.rm(`${file(key)}.type`, { force: true });
        }
    };
}
