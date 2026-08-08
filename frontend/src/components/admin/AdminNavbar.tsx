"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PanelLeftClose, PanelLeftOpen, Search, Bell, ChevronDown, User,
  Settings, LogOut, ArrowLeftRight, Download, FileJson, FileSpreadsheet,
  Megaphone, FileBarChart,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import "./adminNavbar.css";

function ManageDropdown() {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setExportOpen(false); }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="scanza-focus-ring flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-scanza-text hover:bg-scanza-bg"
      >
        Manage <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="scanza-admin-navbar-dropdown-panel absolute right-0 top-11 z-50 w-64 rounded-2xl border border-scanza-border bg-scanza-surface-raised p-2 shadow-scanza-elevated">
          <Link href="/admin/analytics" className="scanza-admin-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
            <FileBarChart size={16} /> View Reports
          </Link>
          <button className="scanza-admin-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-scanza-text hover:bg-scanza-bg">
            <Megaphone size={16} /> Send Announcement
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="scanza-admin-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-scanza-text hover:bg-scanza-bg"
            >
              <Download size={16} /> Export Data <ChevronDown size={13} className={`ml-auto transition-transform ${exportOpen ? "-rotate-90" : ""}`} />
            </button>
            {exportOpen && (
              <div className="ml-4 mt-1 border-l border-scanza-border pl-3">
                <button className="scanza-admin-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-scanza-text-muted hover:bg-scanza-bg">
                  <FileSpreadsheet size={14} /> As CSV
                </button>
                <button className="scanza-admin-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-scanza-text-muted hover:bg-scanza-bg">
                  <FileJson size={14} /> As JSON
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNavbar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="scanza-admin-navbar-root sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className="scanza-admin-navbar-toggle-btn scanza-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border text-scanza-text hover:border-scanza-primary hover:text-scanza-primary"
        >
          {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        <div className="scanza-admin-navbar-search-wrapper hidden items-center gap-2 rounded-xl border border-scanza-border bg-scanza-bg px-3 py-2 md:flex">
          <Search size={15} className="text-scanza-text-muted" />
          <input
            type="text"
            placeholder="Search users, clients, resumes..."
            aria-label="Admin search"
            className="w-64 bg-transparent text-sm text-scanza-text outline-none placeholder:text-scanza-text-muted"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ManageDropdown />
        <ThemeSwitcher />

        <button aria-label="Notifications" className="scanza-admin-navbar-bell scanza-focus-ring relative flex h-10 w-10 items-center justify-center rounded-full border border-scanza-border text-scanza-text hover:border-scanza-primary">
          <Bell size={18} />
          <span className="scanza-admin-navbar-badge absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-scanza-danger text-[9px] font-bold text-white">3</span>
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setAvatarOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={avatarOpen}
            className="scanza-admin-navbar-avatar scanza-focus-ring flex items-center gap-2 rounded-full border border-scanza-border bg-scanza-surface px-1.5 py-1.5 pr-3 hover:border-scanza-primary"
          >
            <span className="scanza-admin-navbar-avatar-inner flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-scanza-primary to-scanza-accent text-xs font-bold text-white">
              {user?.fullName?.charAt(0).toUpperCase() ?? "A"}
            </span>
            <span className="hidden text-sm font-medium text-scanza-text sm:block">{user?.fullName ?? "Admin"}</span>
            <ChevronDown size={14} className={`transition-transform ${avatarOpen ? "rotate-180" : ""}`} />
          </button>

          {avatarOpen && (
            <div role="menu" className="scanza-admin-navbar-dropdown-panel absolute right-0 top-12 z-50 w-56 rounded-2xl border border-scanza-border bg-scanza-surface-raised p-2 shadow-scanza-elevated">
              <Link href="/admin/profile" className="scanza-admin-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
                <User size={16} /> My Profile
              </Link>
              <Link href="/admin/settings" className="scanza-admin-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
                <Settings size={16} /> Platform Settings
              </Link>
              <Link href="/dashboard" className="scanza-admin-navbar-dropdown-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-text hover:bg-scanza-bg">
                <ArrowLeftRight size={16} /> Switch to User View
              </Link>
              <hr className="my-1.5 border-scanza-border" />
              <button
                onClick={async () => { await logout(); router.push("/"); }}
                className="scanza-admin-navbar-dropdown-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-scanza-danger hover:bg-scanza-bg"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
