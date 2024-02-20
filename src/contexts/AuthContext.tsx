"use client";
import { User } from "@prisma/client";
import { createContext, useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";

type AuthContextType = {
    user: User | null;  
    signin: (user: User) => void;
    signout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    signin: async () => {},
    signout: async () => {},
    });

    
export function AuthProvider({ children }: any) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const { user } = parseCookies();

        if (user) return setUser(JSON.parse(user));
    
        if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
        }

    }, []);

    async function signin(user: User) {
        console.log(user);
        setUser(user);
    
        setCookie(null, "user", JSON.stringify(user), {
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
        });
    }

    async function signout() {
        setUser(null);

        destroyCookie(null, "user", {
            path: "/",
        });

        window.location.href = "/auth";
    }

    return (
        <AuthContext.Provider value={{ user, signin, signout }}>
            {children}
        </AuthContext.Provider>
    );
}