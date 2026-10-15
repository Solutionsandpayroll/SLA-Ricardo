import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";
import "./login.css";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <Card className="login-card">
        <div className="login-top-bar" />

        <CardContent className="login-card-content">
          <div className="login-logo-container">
            <Image
              src="/imagen.png"
              alt="Logo de la empresa"
              width={280}
              height={120}
              priority
              className="login-logo"
            />
          </div>

          <div className="login-accent-line" />

          <div className="login-heading">
            <h1>Bienvenido</h1>
            <p>
              Ingresa a la plataforma para gestionar y consultar tus
              solicitudes.
            </p>
          </div>

          <MicrosoftLoginButton />

          <div className="login-security">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>Acceso seguro con tu cuenta corporativa</span>
          </div>
        </CardContent>

        <footer className="login-footer">
          Gestión de solicitudes <span>·</span> SLA
        </footer>
      </Card>

      <p className="login-copyright">
        Acceso exclusivo para personal autorizado
      </p>
    </main>
  );
}