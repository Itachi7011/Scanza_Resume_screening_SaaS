"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, User, Bell, KeyRound, BarChart3, Briefcase, Users, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BASE_LINKS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Resumes", href: "/dashboard/resumes", icon: FileText },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

const CLIENT_LINKS = [
  { label: "Job Postings", href: "/dashboard/client/job-postings", icon: Briefcase },
  { label: "Usage & Analytics", href: "/dashboard/client/usage", icon: BarChart3 },
  { label: "API Keys", href: "/dashboard/client/api-keys", icon: KeyRound },
  { label: "Team", href: "/dashboard/client/team", icon: Users },
  { label: "Billing", href: "/dashboard/client/billing", icon: CreditCard },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isClient = user?.role === "CLIENT_OWNER" || user?.role === "CLIENT_MEMBER";
  const links = isClient ? [...BASE_LINKS, ...CLIENT_LINKS] : BASE_LINKS;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-scanza-border bg-scanza-surface p-4 md:block">
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-scanza-primary text-white" : "text-scanza-text hover:bg-scanza-bg"
              }`}
            >
              <link.icon size={17} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
