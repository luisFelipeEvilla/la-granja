import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "lg_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type Role = "ADMIN" | "USER";
export type Session = { userId: string, username: string, role: Role };

function getSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("AUTH_SECRET no está configurado (mínimo 32 caracteres)");
    return new TextEncoder().encode(secret);
}

// signed (HS256) session token: the role can't be changed by the browser
export async function createSessionToken(session: Session) {
    return new SignJWT({ username: session.username, role: session.role })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(session.userId)
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE_SECONDS}s`)
        .sign(getSecret());
}

export async function verifySessionToken(token?: string | null): Promise<Session | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
        const role = payload.role;
        if (!payload.sub || typeof payload.username !== "string" || (role !== "ADMIN" && role !== "USER")) return null;
        return { userId: payload.sub, username: payload.username, role };
    } catch {
        return null;
    }
}

// httpOnly: not readable by JavaScript; secure in production; lax blocks cross-site POSTs (CSRF)
export const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
};

export async function getSession() {
    return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
