import { jwtVerify, SignJWT } from "jose";

// short-lived signed ticket for a direct upload: the client can only confirm the exact
// object (invoice, key, type, size, name) the server authorized
export type UploadTicket = { invoiceId: string, key: string, contentType: string, size: number, name: string };

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
const PURPOSE = "evidence-upload";

export async function signUploadTicket(ticket: UploadTicket, expiresInSeconds: number) {
    if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET no está configurado");
    return new SignJWT({ ...ticket, purpose: PURPOSE })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${expiresInSeconds}s`)
        .sign(secret());
}

export async function verifyUploadTicket(token: string): Promise<UploadTicket | null> {
    try {
        const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
        if (payload.purpose !== PURPOSE) return null;
        const { invoiceId, key, contentType, size, name } = payload as Record<string, unknown>;
        if (typeof invoiceId !== "string" || typeof key !== "string" || typeof contentType !== "string" || typeof size !== "number" || typeof name !== "string") return null;
        return { invoiceId, key, contentType, size, name };
    } catch {
        return null;
    }
}
