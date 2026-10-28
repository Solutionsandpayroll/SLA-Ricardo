import { requireAdminPage } from "@/lib/require-admin";
import AdminSidebar from "../dashboard/admin-sidebar";
import "./admin.css";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  return (
    <div className="admin-layout">
      <AdminSidebar />
      {children}
    </div>
  );
}