"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ShieldBan, ShieldCheck, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-scanza-success/10 text-scanza-success",
  BLOCKED: "bg-scanza-danger/10 text-scanza-danger",
  PENDING_VERIFICATION: "bg-scanza-warning/10 text-scanza-warning",
  DELETED: "bg-scanza-text-muted/10 text-scanza-text-muted",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/app/admin/users", { params: { page, pageSize: 15, search: search || undefined } })
      .then(({ data }) => { setUsers(data.data.users); setTotalPages(data.data.totalPages); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(load, [load]);

  async function handleToggleBlock(user: AdminUser) {
    const isBlocking = user.status !== "BLOCKED";
    const confirm = await Swal.fire({
      icon: "warning",
      title: isBlocking ? `Block ${user.fullName}?` : `Unblock ${user.fullName}?`,
      text: isBlocking ? "They'll be logged out everywhere and unable to log back in." : "They'll be able to log in again.",
      showCancelButton: true,
      confirmButtonText: isBlocking ? "Block" : "Unblock",
      confirmButtonColor: isBlocking ? "#dc2626" : "#16a34a",
    });
    if (!confirm.isConfirmed) return;

    await axios.post(`/api/app/admin/users/${user.id}/${isBlocking ? "block" : "unblock"}`);
    load();
  }

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">User Management</h1>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-scanza-border bg-scanza-surface px-4 py-2.5">
        <Search size={16} className="text-scanza-text-muted" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full bg-transparent text-sm text-scanza-text outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-scanza-border bg-scanza-surface">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-scanza-border bg-scanza-bg text-xs uppercase text-scanza-text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-scanza-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-scanza-text">{u.fullName}</p>
                    <p className="text-xs text-scanza-text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-scanza-text-muted">{u.role.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-scanza-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => handleToggleBlock(u)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                          u.status === "BLOCKED" ? "bg-scanza-success/10 text-scanza-success" : "bg-scanza-danger/10 text-scanza-danger"
                        }`}
                      >
                        {u.status === "BLOCKED" ? <ShieldCheck size={13} /> : <ShieldBan size={13} />}
                        {u.status === "BLOCKED" ? "Unblock" : "Block"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-scanza-border disabled:opacity-40">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-scanza-text-muted">Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-9 w-9 items-center justify-center rounded-lg border border-scanza-border disabled:opacity-40">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
