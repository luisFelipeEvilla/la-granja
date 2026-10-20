"use client";

import { useState } from "react";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

type propsType = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error: boolean;
};

export default function PasswordInput(props: propsType) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        type={isVisible ? "text" : "password"}
        placeholder="Tu contraseña"
        autoComplete="current-password"
        aria-invalid={props.error || undefined}
        aria-describedby={props.error && props.id ? `${props.id}-error` : undefined}
        required
        className={`h-12 w-full rounded-lg border-0 bg-white pl-4 pr-12 text-base text-slate-900 shadow-xs ring-1 ring-inset placeholder:text-slate-400 focus:outline-hidden focus:ring-2 sm:text-sm
          ${props.error ? "ring-red-300 focus:ring-red-500" : "ring-slate-300 focus:ring-emerald-500"}`}
      />
      <button
        type="button"
        aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible(!isVisible)}
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {isVisible ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
      </button>
    </div>
  );
}
