import { Toaster } from "react-hot-toast";
import type { Viewport } from "next";
import SideBar from "@/components/sidebar/sideBar";
import { AuthProvider } from "@/contexts/AuthContext";
import "../globals.css";
import Providers from "@/app/providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          {/* Providers wraps the flex container: NextUIProvider renders its own div,
              which would otherwise become the flex item and grow past the viewport */}
          <Providers>
            <div className="flex min-h-screen">
              <SideBar />
              {/* pt-[4.5rem] leaves room for the fixed top bar shown below lg */}
              <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 pt-[4.5rem] pb-6 sm:pb-8 lg:py-8">
                {children}
              </main>
            </div>
          </Providers>
          <Toaster position="top-center" containerStyle={{ top: 72 }} />
        </AuthProvider>
      </body>
    </html>
  );
}
