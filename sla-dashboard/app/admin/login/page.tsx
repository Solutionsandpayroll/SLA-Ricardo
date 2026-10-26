"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";
import "./admin-login.css";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const resultado = await signIn("admin-credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/admin/dashboard",
      });

      if (!resultado || resultado.error) {
        setError(
          "Correo o contraseña incorrectos, o cuenta sin permisos de administrador."
        );
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError(
        "No se pudo iniciar sesión. Verifica la conexión e inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div
        className="admin-login-decoration admin-decoration-one"
        aria-hidden="true"
      />

      <div
        className="admin-login-decoration admin-decoration-two"
        aria-hidden="true"
      />

      <section className="admin-login-card">
        <Link href="/" className="admin-back-link">
          <ArrowLeft size={17} />
          <span>Volver al inicio</span>
        </Link>

        <div className="admin-login-brand">
          <Image
            src="/image.png"
            alt="Solutions & Payroll"
            width={220}
            height={95}
            priority
            className="admin-login-logo"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-login-form"
        >
          <div className="admin-form-group">
            <label htmlFor="admin-email">
              Correo electrónico
            </label>

            <div className="admin-input-wrapper">
              <Mail size={19} aria-hidden="true" />

              <input
                id="admin-email"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                disabled={cargando}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">
              Contraseña
            </label>

            <div className="admin-input-wrapper">
              <LockKeyhole
                size={19}
                aria-hidden="true"
              />

              <input
                id="admin-password"
                type={mostrarPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={1024}
                disabled={cargando}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setMostrarPassword(!mostrarPassword)
                }
                aria-label={
                  mostrarPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                disabled={cargando}
              >
                {mostrarPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="admin-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={
              cargando || !email.trim() || !password
            }
          >
            {cargando ? (
              <>
                <LoaderCircle
                  className="admin-spinner"
                  size={20}
                />
                Verificando acceso...
              </>
            ) : (
              <>Iniciar sesión</>
            )}
          </button>
        </form>

        <footer className="admin-login-footer">
          Solutions & Payroll · SLA Dashboard
        </footer>
      </section>
    </main>
  );
}