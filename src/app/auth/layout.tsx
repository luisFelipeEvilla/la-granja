"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import "../globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full px-8 h-screen overflow-y-scroll">
        <NextUIProvider>
          <AuthProvider>{children}</AuthProvider>
        </NextUIProvider>
        <Toaster />
      </body>
    </html>
  );
}
