"use client";
import { createContext, ReactNode, useEffect, useState } from "react";

export type SessionUser = { username: string, role: "ADMIN" | "USER" };

type AuthContextType = {
    user: SessionUser | null;
    signin: (user: SessionUser) => void;
    signout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    signin: () => {},
    signout: async () => {},
});

// the session lives in an httpOnly cookie set by the server; this only mirrors who is signed in
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);

    useEffect(() => {
        if (window.location.pathname === "/auth") return;
        fetch("/api/auth/me", { cache: "no-store" })
            .then(async (res) => {
                if (res.ok) return setUser((await res.json()).user);
                window.location.href = "/auth";
            })
            .catch(() => {});
    }, []);

    function signin(user: SessionUser) {
        setUser(user);
    }

    async function signout() {
        await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
        setUser(null);
        window.location.href = "/auth";
    }

    return <AuthContext.Provider value={{ user, signin, signout }}>{children}</AuthContext.Provider>;
}
