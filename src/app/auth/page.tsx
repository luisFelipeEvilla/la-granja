"use client";
import PasswordInput from "@/components/inputs/password";
import { AuthContext } from "@/contexts/AuthContext";
import { Button, Input } from "@nextui-org/react";
import axios from "axios";
import { FormEvent, useContext, useState } from "react";
import toast from "react-hot-toast";

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
    } catch (error: any) {
      const res = error.response;

      if (res.status === 404) {
        toast.error("Usuario no encontrado");
        return setError({ ...error, user: true });
      }

      if (res.status === 401) {
        setError({ ...error, password: true });
        return toast.error("Contraseña incorrecta");
      }

      toast.error("Error del servidor");
    } finally {
      setLoading(false);
    }
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    setError({ ...error, user: false });
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setError({ ...error, password: false });
  }

  return (
    <div className="flex justify-center items-center min-h-screen min-h-[100dvh] px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl sm:rounded-md shadow-sm sm:shadow-md flex flex-col gap-5 sm:gap-6 w-full max-w-sm px-5 py-7 sm:px-8 sm:py-8"
      >
        <h4 className="text-xl sm:text-2xl text-center">Iniciar sesión</h4>
        <Input
          value={username}
          onValueChange={handleUsernameChange}
          type="text"
          placeholder="Usuario"
          errorMessage={error.user && "Usuario no encontrado"}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          size="lg"
          classNames={{ input: "text-base sm:text-small" }}
          required
        />
        <PasswordInput
          value={password}
          onChange={handlePasswordChange}
          error={error.password}
        />
        <Button
          isDisabled={loading}
          isLoading={loading}
          type="submit"
          color="success"
          size="lg"
          className="text-white"
        >
          Iniciar sesión
        </Button>
      </form>
    </div>
  );
}
