"use client";
import PasswordInput from "@/components/inputs/password";
import Spinner from "@/components/ui/Spinner";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import Image from "next/image";
import { FormEvent, useContext, useState } from "react";
import { HiOutlineBanknotes, HiOutlineClipboardDocumentList, HiOutlineDocumentChartBar } from "react-icons/hi2";
import toast from "react-hot-toast";

const highlights = [
  { icon: HiOutlineClipboardDocumentList, text: "Planillas de recolección de leche día a día" },
  { icon: HiOutlineBanknotes, text: "Facturas de venta, abonos y pagos de clientes" },
  { icon: HiOutlineDocumentChartBar, text: "Estados de cuenta y liquidaciones en PDF" },
];

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ user: false, password: false });
  const { signin } = useContext(AuthContext);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await axios.post("/api/auth/signin", {
        username,
        password,
      });

      signin(res.data?.user);
      window.location.href = "/dashboard";
    } catch (requestError: any) {
      const status = requestError.response?.status;

      if (status === 404) {
        toast.error("Usuario no encontrado");
        return setError((current) => ({ ...current, user: true }));
      }

      if (status === 401) {
        setError((current) => ({ ...current, password: true }));
        return toast.error("Contraseña incorrecta");
      }

      toast.error("No pudimos iniciar sesión. Intenta de nuevo");
    } finally {
      setLoading(false);
    }
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    setError((current) => ({ ...current, user: false }));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setError((current) => ({ ...current, password: false }));
  }

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 lg:bg-white">
      {/* Brand panel: iPad landscape and desktop */}
      <aside className="relative hidden w-1/2 max-w-2xl flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-900 to-slate-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <Image src="/images/logo.jpg" alt="" width={96} height={96} priority className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/20" />
          <div>
            <p className="text-lg font-semibold leading-tight">La Granja</p>
            <p className="text-sm text-emerald-100/70">Lácteos</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              La operación de tu lechería,<br />en un solo lugar.
            </h2>
            <p className="mt-4 max-w-md text-base text-emerald-50/80">
              Registra la leche recibida, factura a tus clientes y lleva sus cuentas sin papeles.
            </p>
          </div>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-emerald-50/90">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-100/50">© {new Date().getFullYear()} Lácteos La Granja</p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Image src="/images/logo.jpg" alt="" width={112} height={112} priority className="mb-5 h-14 w-14 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200 lg:hidden" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Bienvenido</h1>
            <p className="mt-2 text-sm text-slate-500">Ingresa con tu usuario para continuar</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:p-0 lg:shadow-none"
            noValidate
          >
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">Usuario</label>
              <input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                type="text"
                placeholder="Tu usuario"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
                aria-invalid={error.user || undefined}
                aria-describedby={error.user ? "username-error" : undefined}
                className={`h-12 w-full rounded-lg border-0 bg-white px-4 text-base text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:outline-none focus:ring-2 sm:text-sm
                  ${error.user ? "ring-red-300 focus:ring-red-500" : "ring-slate-300 focus:ring-emerald-500"}`}
              />
              {error.user && <p id="username-error" className="text-sm text-red-600" role="alert">Usuario no encontrado</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
              <PasswordInput id="password" value={password} onChange={handlePasswordChange} error={error.password} />
              {error.password && <p id="password-error" className="text-sm text-red-600" role="alert">Contraseña incorrecta</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              aria-busy={loading || undefined}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Spinner />}
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
