import prisma from "@/db/client";
import { getRequestMeta } from "@/controllers/signatures";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isLoginBlocked, recordLoginAttempt } from "@/lib/auth/rateLimit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

const INVALID = "Usuario o contraseña incorrectos";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const username = typeof body.username === "string" ? body.username.trim().slice(0, 100) : "";
        const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
        if (!username || !password) return NextResponse.json({ message: INVALID }, { status: 400 });

        const ip = getRequestMeta(req.headers).ip ?? "desconocida";
        if (await isLoginBlocked(username, ip)) {
            return NextResponse.json({ message: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." }, { status: 429 });
        }

        const user = await prisma.user.findUnique({ where: { username } });
        const { valid, needsRehash } = await verifyPassword(user?.password ?? null, password);

        await recordLoginAttempt(username, ip, valid);
        // same answer for unknown users and wrong passwords, so usernames can't be discovered
        if (!user || !valid) return NextResponse.json({ message: INVALID }, { status: 401 });

        // passwords saved in plain text before are hashed on their first successful sign-in
        if (needsRehash) await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });

        const session = { userId: user.id, username: user.username, role: user.role };
        const response = NextResponse.json({ user: { username: user.username, role: user.role } });
        response.cookies.set(SESSION_COOKIE, await createSessionToken(session), sessionCookieOptions);
        // remove the old, unsigned session cookie
        response.cookies.delete("user");
        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "No se pudo iniciar sesión" }, { status: 500 });
    }
}
