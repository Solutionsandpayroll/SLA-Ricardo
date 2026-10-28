import { UserRound } from "lucide-react";
import SlaSidebar from "@/components/SlaSidebar";
import "@/app/login.css";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function PanelShell({ title, children }: Props) {
  return (
    <main className="sla-home">
      <SlaSidebar />

      <section className="sla-main">
        <header className="sla-topbar">
          <div>
            <span className="sla-eyebrow">SOLUTIONS & PAYROLL</span>
            <h1>{title}</h1>
          </div>

          <div className="sla-user">
            <div className="sla-user-icon">
              <UserRound size={22} />
            </div>
            <div>
              <strong>Invitado</strong>
              <span>Inicia sesión para continuar</span>
            </div>
          </div>
        </header>

        <div className="sla-content">
          {children}

          <footer className="sla-footer">
            <span>Seguimiento SLA</span>
            <span>Solutions & Payroll · Gestión y control operativo</span>
          </footer>
        </div>
      </section>
    </main>
  );
}