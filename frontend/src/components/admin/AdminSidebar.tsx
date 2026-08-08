"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Users, UserCog, ShieldBan, KeySquare,
  Building2, Ban, Layers, Lightbulb, ScrollText, Settings, ChevronDown,
  ChevronsLeft, ChevronsRight, ScanSearch,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import "./adminSidebar.css";

interface SidebarLink {
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
  children?: { label: string; href: string; icon: typeof LayoutDashboard }[];
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  {
    label: "User Management",
    icon: Users,
    children: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Blocked Users", href: "/admin/users?status=BLOCKED", icon: ShieldBan },
      { label: "Roles & Permissions", href: "/admin/users/roles", icon: UserCog },
    ],
  },
  {
    label: "Client Management",
    icon: Building2,
    children: [
      { label: "All Clients", href: "/admin/clients", icon: Building2 },
      { label: "Suspended Clients", href: "/admin/clients?status=suspended", icon: Ban },
      { label: "API Keys", href: "/admin/api-keys", icon: KeySquare },
    ],
  },
  {
    label: "Content & Skills",
    icon: Layers,
    children: [
      { label: "Skill Taxonomy", href: "/admin/skills", icon: Layers },
      { label: "Suggestions Library", href: "/admin/suggestions", icon: Lightbulb },
    ],
  },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  function toggleMenu(label: string) {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      data-expanded={isExpanded}
      className="scanza-admin-sidebar-root sticky top-0 flex h-screen shrink-0 flex-col border-r border-scanza-border bg-scanza-surface"
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-scanza-border px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-scanza-primary to-scanza-accent text-white">
          <ScanSearch size={19} />
        </span>
        <span className="scanza-admin-sidebar-label font-display text-lg font-bold text-scanza-text">Scanza Admin</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {SIDEBAR_LINKS.map((item) => {
          const isActive = item.href ? pathname === item.href.split("?")[0] : false;
          const isOpen = openMenus[item.label] ?? false;

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  title={!isExpanded ? item.label : undefined}
                  className="scanza-admin-sidebar-item group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-scanza-text hover:bg-scanza-bg"
                >
                  <item.icon size={19} className="shrink-0" />
                  <span className="scanza-admin-sidebar-label flex-1 text-left">{item.label}</span>
                  {isExpanded && (
                    <ChevronDown size={15} data-open={isOpen} className="scanza-admin-sidebar-chevron shrink-0" />
                  )}
                  {!isExpanded && (
                    <span className="scanza-admin-sidebar-tooltip absolute left-full ml-2 whitespace-nowrap rounded-lg bg-scanza-text px-2.5 py-1.5 text-xs text-scanza-bg">
                      {item.label}
                    </span>
                  )}
                </button>
                <div data-open={isOpen && isExpanded} className="scanza-admin-sidebar-submenu ml-4 border-l border-scanza-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="scanza-admin-sidebar-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text-muted hover:bg-scanza-bg hover:text-scanza-text"
                    >
                      <child.icon size={15} />
                      <span className="scanza-admin-sidebar-label">{child.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              title={!isExpanded ? item.label : undefined}
              className={`scanza-admin-sidebar-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                isActive ? "bg-scanza-primary text-white" : "text-scanza-text hover:bg-scanza-bg"
              }`}
            >
              <item.icon size={19} className="shrink-0" />
              <span className="scanza-admin-sidebar-label">{item.label}</span>
              {!isExpanded && (
                <span className="scanza-admin-sidebar-tooltip absolute left-full ml-2 whitespace-nowrap rounded-lg bg-scanza-text px-2.5 py-1.5 text-xs text-scanza-bg">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        className="scanza-focus-ring flex items-center justify-center gap-2 border-t border-scanza-border py-3.5 text-scanza-text-muted hover:bg-scanza-bg hover:text-scanza-primary"
      >
        {isExpanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
      </button>
    </aside>
  );
}
