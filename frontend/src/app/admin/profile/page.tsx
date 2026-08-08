"use client";

import { useAuth } from "@/context/AuthContext";
import { ShieldCheck } from "lucide-react";

export default function AdminProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="animate-scanza-fade-in max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">My Admin Profile</h1>
      <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
        <div className="mb-4 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-scanza-primary to-scanza-accent text-lg font-bold text-white">
            {user.fullName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-semibold text-scanza-text">{user.fullName}</p>
            <p className="text-sm text-scanza-text-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-scanza-text-muted">
          <ShieldCheck size={13} /> Role: <span className="font-medium text-scanza-text">{user.role.replace("_", " ")}</span>
        </div>
      </div>
    </div>
  );
}
