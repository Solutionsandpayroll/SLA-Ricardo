
import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin-sidebar";
import "../admin.css";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="sla-dashboard">
        {children}
      </main>
    </div>
  );
}
