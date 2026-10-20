import prisma from "@/db/client";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_USER = 8;
const MAX_FAILURES_PER_IP = 30;

// stored in the database so the limit holds across serverless instances
export async function isLoginBlocked(username: string, ip: string) {
    const since = new Date(Date.now() - WINDOW_MS);
    const [byUser, byIp] = await Promise.all([
        prisma.loginAttempt.count({ where: { username, success: false, createdAt: { gte: since } } }),
        prisma.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
    ]);
    return byUser >= MAX_FAILURES_PER_USER || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordLoginAttempt(username: string, ip: string, success: boolean) {
    await prisma.loginAttempt.create({ data: { username, ip, success } });
    if (success) {
        // a successful sign-in clears that user's failures
        await prisma.loginAttempt.deleteMany({ where: { username, success: false } });
    }
    // housekeeping: drop attempts older than a day
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}
