"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function MicrosoftLoginButton() {
  return (
    <Button
      type="button"
      size="lg"
      className="login-button"
      onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
    >
      <svg
        className="login-microsoft-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path fill="#f25022" d="M1 1h10v10H1z" />
        <path fill="#7fba00" d="M13 1h10v10H13z" />
        <path fill="#00a4ef" d="M1 13h10v10H1z" />
        <path fill="#ffb900" d="M13 13h10v10H13z" />
      </svg>

      Iniciar sesión con Microsoft
    </Button>
  );
}