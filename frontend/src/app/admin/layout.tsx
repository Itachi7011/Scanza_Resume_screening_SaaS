"use client";

import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/context/SidebarContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return isLoginPage ? <>{children}</> : <AuthenticatedAdminShell>{children}</AuthenticatedAdminShell>;
}

function AuthenticatedAdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth(["ADMIN", "SUPER_ADMIN"]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-scanza-bg">
        <Loader2 size={28} className="animate-spin text-scanza-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-scanza-bg">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminNavbar />
          <main className="flex-1 p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
