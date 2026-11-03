
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SLA Dashboard | Solutions & Payroll",
    template: "%s | SLA Dashboard",
  },
  description:
    "Plataforma de seguimiento, gestión y automatización de solicitudes y cumplimiento de SLA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
