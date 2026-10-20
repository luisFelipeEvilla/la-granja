import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Granja",
  description: "Gestión de Lácteos La Granja",
  applicationName: "La Granja",
  // lets the app be added to the iPad home screen and open full screen
  appleWebApp: {
    capable: true,
    title: "La Granja",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-[100dvh] bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
