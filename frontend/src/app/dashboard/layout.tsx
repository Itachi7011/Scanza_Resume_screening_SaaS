"use client";

import { Loader2 } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth();

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-scanza-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <DashboardSidebar />
      <div className="flex-1 p-6 sm:p-8">{children}</div>
    </div>
  );
}
