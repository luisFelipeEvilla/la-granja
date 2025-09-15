import { Toaster } from "react-hot-toast";
import SideBar from "@/components/sidebar/sideBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextUIProvider } from "@nextui-org/react";
import "../globals.css";
import Providers from "@/app/providers";
import getUserFromCookies from "../utils/getUserFromCookies";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <div className="flex min-h-screen">
            <SideBar />
            <Providers>
              <main className="flex-1 w-full lg:ml-0 px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
                <div className="h-full overflow-y-auto">
                  {children}
                </div>
              </main>
            </Providers>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
