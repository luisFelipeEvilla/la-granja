"use client";
import PasswordInput from "@/components/inputs/password";
import Spinner from "@/components/ui/Spinner";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import Image from "next/image";
import { FormEvent, useContext, useEffect, useState } from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import toast from "react-hot-toast";

// greeting for the team based on the time of day (computed in the browser, so it uses the local hour)
function getMoment() {
  const now = new Date();
  const hour = now.getHours();
  return {
    greeting: hour < 12 ? "¡Buenos días, equipo!" : hour < 19 ? "¡Buenas tardes, equipo!" : "¡Buenas noches, equipo!",
    message: hour < 12
      ? "Arranquemos la jornada con todo."
      : hour < 19 ? "Sigamos con la jornada." : "Cerremos bien el día.",
    night: hour >= 19 || hour < 6,
    date: now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }),
  };
}

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ user: false, password: false });
  const { signin } = useContext(AuthContext);
  const [moment, setMoment] = useState<ReturnType<typeof getMoment>>();

  useEffect(() => setMoment(getMoment()), []);

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
    <div className="flex min-h-dvh bg-slate-50 lg:bg-white">
      {/* Team welcome panel: iPad landscape and desktop */}
      <aside className="relative hidden w-1/2 max-w-2xl flex-col items-center justify-center overflow-hidden bg-emerald-950 p-12 text-center text-white lg:flex">
        {/* the farm illustration of the logo, blurred, as the backdrop */}
        <Image src="/images/logo.jpg" alt="" fill priority sizes="50vw" className="scale-125 object-cover opacity-90 blur-2xl saturate-150" />
        <div className="absolute inset-0 bg-linear-to-b from-emerald-950/10 via-emerald-950/55 to-slate-950/90" />

        <div className="relative flex flex-col items-center">
          <Image src="/images/logo.jpg" alt="Lácteos La Granja" width={360} height={360} priority className="h-44 w-44 rounded-4xl object-cover shadow-2xl shadow-black/40 ring-4 ring-white/20" />
          <p className="mt-8 text-sm font-semibold text-emerald-200">Lácteos La Granja</p>
          <h2 className="mt-2 min-h-10 text-4xl font-bold tracking-tight">{moment?.greeting ?? "¡Hola, equipo!"}</h2>
          <p className="mt-3 text-lg text-emerald-50/80">{moment?.message}</p>
        </div>

        {moment && (
          <p className="absolute bottom-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-emerald-50/90 ring-1 ring-white/15 backdrop-blur-sm first-letter:uppercase">
            {moment.night ? <HiOutlineMoon className="h-4 w-4" /> : <HiOutlineSun className="h-4 w-4 text-amber-300" />}
            <span className="first-letter:uppercase">{moment.date}</span>
          </p>
        )}
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Image src="/images/logo.jpg" alt="" width={112} height={112} priority className="mb-5 h-14 w-14 rounded-2xl object-cover shadow-xs ring-1 ring-slate-200 lg:hidden" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Hola de nuevo 👋</h1>
            <p className="mt-2 text-sm text-slate-500">Ingresa con tu usuario para empezar</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 lg:border-0 lg:p-0 lg:shadow-none"
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
                className={`h-12 w-full rounded-lg border-0 bg-white px-4 text-base text-slate-900 shadow-xs ring-1 ring-inset placeholder:text-slate-400 focus:outline-hidden focus:ring-2 sm:text-sm
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-base font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
