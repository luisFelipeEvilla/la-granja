"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-dvh bg-slate-50">
        <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-center" />
    </div>
  );
}
