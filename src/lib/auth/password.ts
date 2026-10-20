import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

const ROUNDS = 12;
const isBcryptHash = (value: string) => /^\$2[aby]\$\d{2}\$/.test(value);

// a valid hash compared when the user doesn't exist, so response time doesn't reveal valid usernames
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5zh0F4OZtO0Xnzh7EDbjbAzwq9TjXfS";

export const hashPassword = (password: string) => bcrypt.hash(password, ROUNDS);

// supports passwords stored before hashing existed (plain text) so they can be upgraded on sign-in
export async function verifyPassword(stored: string | null, password: string) {
    if (!stored) {
        await bcrypt.compare(password, DUMMY_HASH);
        return { valid: false, needsRehash: false };
    }
    if (isBcryptHash(stored)) return { valid: await bcrypt.compare(password, stored), needsRehash: false };

    const a = Buffer.from(stored), b = Buffer.from(password);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    return { valid, needsRehash: valid };
}
