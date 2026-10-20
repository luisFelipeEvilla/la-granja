import { Toaster } from "react-hot-toast";
import SideBar from "@/components/sidebar/sideBar";
import { AuthProvider } from "@/contexts/AuthContext";
import Providers from "@/app/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Providers>
        <div className="flex flex-col md:flex-row min-h-[100dvh]">
          <SideBar />
          {/* min-w-0 keeps wide content (tables, multiselects) from stretching the page */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 pt-5 md:pt-safe pb-safe">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </Providers>
      <Toaster
        position="top-center"
        containerClassName="safe-top"
        toastOptions={{
          className: "!rounded-xl !text-sm !font-medium !shadow-lg !ring-1 !ring-slate-900/5",
          success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
        }}
      />
    </AuthProvider>
  );
}
