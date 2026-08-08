"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";
import {
  ScanSearch, ChevronDown, Menu, X, Search, Bell, LogIn, UserPlus,
  ShieldAlert, LayoutDashboard, LogOut, Building2, Plug, BookOpen,
  Layers, Building, Info, Mail, Tag, UserSearch, User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import "./navbar.css";

interface NavItem {
  label: string;
  href?: string;
  icon: typeof ScanSearch;
  description?: string;
  children?: NavItem[];
}

const PRODUCT_ITEMS: NavItem[] = [
  { label: "For Job Seekers", href: "/", icon: UserSearch, description: "Upload & analyze your resume for free" },
  { label: "For Employers", href: "/for-employers", icon: Building2, description: "Embed Scanza in your hiring flow" },
  { label: "API & Integrations", href: "/docs", icon: Plug, description: "Docs, API keys, and webhooks" },
];

const RESOURCES_ITEMS: NavItem[] = [
  { label: "Documentation", href: "/docs", icon: BookOpen, description: "Guides for integrating Scanza" },
  { label: "Skill Categories", href: "/skills", icon: Layers, description: "Browse the full skills taxonomy" },
  {
    label: "Company",
    icon: Building,
    children: [
      { label: "About Us", href: "/about", icon: Info },
      { label: "Contact", href: "/contact", icon: Mail },
      { label: "Pricing", href: "/pricing", icon: Tag },
    ],
  },
];

function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveChild(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="scanza-navbar-link scanza-focus-ring flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-scanza-text transition-colors hover:text-scanza-primary"
      >
        {label}
        <ChevronDown size={15} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="scanza-navbar-dropdown-panel absolute left-0 top-12 z-50 w-72 rounded-2xl border border-scanza-border bg-scanza-surface-raised p-2 shadow-scanza-elevated"
        >
          {items.map((item) => (
            <div key={item.label} className="relative">
              {item.children ? (
                <button
                  type="button"
                  onClick={() => setActiveChild((c) => (c === item.label ? null : item.label))}
                  className="scanza-navbar-dropdown-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-scanza-bg"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-scanza-primary/10 text-scanza-primary">
                    <item.icon size={17} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-scanza-text">{item.label}</span>
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${activeChild === item.label ? "-rotate-90" : ""}`} />
                </button>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => { setOpen(false); setActiveChild(null); }}
                  className="scanza-navbar-dropdown-item flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-scanza-bg"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-scanza-primary/10 text-scanza-primary">
                    <item.icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-scanza-text">{item.label}</span>
                    {item.description && <span className="block text-xs text-scanza-text-muted">{item.description}</span>}
                  </span>
                </Link>
              )}

              {/* Layered nested dropdown */}
              {item.children && activeChild === item.label && (
                <div className="scanza-navbar-subdropdown-panel ml-4 mt-1 border-l border-scanza-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href!}
                      onClick={() => { setOpen(false); setActiveChild(null); }}
                      className="scanza-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg"
                    >
                      <child.icon size={15} className="text-scanza-text-muted" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function showAdminRestrictedAlert(action: "login" | "signup") {
  return Swal.fire({
    icon: "warning",
    title: "Restricted Area",
    text:
      action === "login"
        ? "This area is reserved for authorized Scanza administrators only. Unauthorized access attempts are logged."
        : "Administrator accounts are provisioned internally and cannot be self-registered. Contact the platform owner if you require admin access.",
    confirmButtonText: action === "login" ? "I understand, continue" : "Understood",
    showCancelButton: action === "login",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
  });
}

function AuthMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (user) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="scanza-focus-ring flex items-center gap-2 rounded-full border border-scanza-border bg-scanza-surface px-2 py-1.5 pr-3 hover:border-scanza-primary"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-scanza-primary text-xs font-semibold text-white">
            {user.fullName.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate text-sm font-medium text-scanza-text">{user.fullName}</span>
          <ChevronDown size={14} />
        </button>

        {open && (
          <div className="scanza-navbar-dropdown-panel absolute right-0 top-12 z-50 w-56 rounded-2xl border border-scanza-border bg-scanza-surface-raised p-2 shadow-scanza-elevated">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="scanza-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="scanza-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
              <UserIcon size={16} /> Profile
            </Link>
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link href="/admin" onClick={() => setOpen(false)} className="scanza-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
                <ShieldAlert size={16} /> Admin Panel
              </Link>
            )}
            <hr className="my-1.5 border-scanza-border" />
            <button
              onClick={async () => { await logout(); setOpen(false); router.push("/"); }}
              className="scanza-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-danger hover:bg-scanza-bg"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="scanza-focus-ring flex items-center gap-1.5 rounded-lg bg-scanza-primary px-4 py-2 text-sm font-medium text-white shadow-scanza-card transition-transform hover:scale-105 hover:bg-scanza-primary-hover"
      >
        <LogIn size={16} /> Account <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="scanza-navbar-dropdown-panel absolute right-0 top-12 z-50 w-60 rounded-2xl border border-scanza-border bg-scanza-surface-raised p-2 shadow-scanza-elevated">
          <Link href="/login" onClick={() => setOpen(false)} className="scanza-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
            <LogIn size={16} /> Log In
          </Link>
          <Link href="/signup" onClick={() => setOpen(false)} className="scanza-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
            <UserPlus size={16} /> Sign Up
          </Link>
          <hr className="my-1.5 border-scanza-border" />
          <button
            onClick={async () => {
              setOpen(false);
              const result = await showAdminRestrictedAlert("login");
              if (result.isConfirmed) router.push("/admin/login");
            }}
            className="scanza-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text-muted hover:bg-scanza-bg"
          >
            <ShieldAlert size={16} /> Admin Login
          </button>
          <button
            onClick={async () => { setOpen(false); await showAdminRestrictedAlert("signup"); }}
            className="scanza-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text-muted hover:bg-scanza-bg"
          >
            <ShieldAlert size={16} /> Admin Sign Up
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { unreadCount } = useSocket();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null; // admin section uses its own AdminNavbar

  return (
    <header className="scanza-navbar-root sticky top-0 z-40 w-full">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="scanza-navbar-logo-mark flex items-center gap-2">
          <span className="scanza-navbar-logo-icon flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-scanza-primary to-scanza-accent text-white shadow-scanza-card">
            <ScanSearch size={20} />
          </span>
          <span className="font-display text-xl font-bold text-scanza-text">Scanza</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <NavDropdown label="Product" items={PRODUCT_ITEMS} />
          <NavDropdown label="Resources" items={RESOURCES_ITEMS} />
          <Link href="/pricing" className="scanza-navbar-link scanza-focus-ring rounded-lg px-3 py-2 text-sm font-medium text-scanza-text hover:text-scanza-primary">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search"
              className="scanza-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border bg-scanza-surface text-scanza-text hover:border-scanza-primary"
            >
              <Search size={17} />
            </button>
            {searchOpen && (
              <input
                autoFocus
                type="text"
                placeholder="Search docs, skills..."
                onBlur={() => setSearchOpen(false)}
                className="scanza-navbar-search-input absolute right-0 top-12 w-64 rounded-xl border border-scanza-border bg-scanza-surface px-4 py-2.5 text-sm text-scanza-text outline-none"
              />
            )}
          </div>

          <ThemeSwitcher />

          {isAuthenticated && (
            <Link href="/dashboard/notifications" aria-label="Notifications" className="scanza-focus-ring relative flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border bg-scanza-surface text-scanza-text hover:border-scanza-primary">
              <Bell size={18} className={unreadCount > 0 ? "scanza-navbar-bell-ring" : ""} />
              {unreadCount > 0 && (
                <span className="scanza-navbar-badge-pulse absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-scanza-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <div className="hidden lg:block">
            <AuthMenu />
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="scanza-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border lg:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="scanza-navbar-mobile-panel absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-scanza-surface p-5 shadow-scanza-elevated">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-scanza-text">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="scanza-focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-scanza-border">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {[...PRODUCT_ITEMS, ...RESOURCES_ITEMS.flatMap((i) => i.children ?? [i])].map((item) => (
                <Link key={item.label} href={item.href!} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-scanza-text hover:bg-scanza-bg">
                  <item.icon size={18} /> {item.label}
                </Link>
              ))}
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-scanza-text hover:bg-scanza-bg">
                <Tag size={18} /> Pricing
              </Link>
            </div>

            <hr className="my-4 border-scanza-border" />
            <div className="flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-scanza-border px-4 py-2.5 text-center text-sm font-medium text-scanza-text">Log In</Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="rounded-xl bg-scanza-primary px-4 py-2.5 text-center text-sm font-medium text-white">Sign Up</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
