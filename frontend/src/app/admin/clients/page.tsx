"use client";

import { useEffect, useState } from "react";
import { Building2, Ban, CheckCircle2, Loader2, KeySquare, FileText, Users } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";

interface AdminClient {
  id: string;
  companyName: string;
  websiteUrl: string | null;
  planTier: string;
  isSuspended: boolean;
  monthlyQuota: number;
  usedThisCycle: number;
  createdAt: string;
  _count: { apiKeys: number; resumes: number; accounts: number };
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    axios.get("/api/app/admin/clients").then(({ data }) => setClients(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleToggleSuspend(client: AdminClient) {
    const isSuspending = !client.isSuspended;
    const confirm = await Swal.fire({
      icon: "warning",
      title: isSuspending ? `Suspend ${client.companyName}?` : `Reactivate ${client.companyName}?`,
      text: isSuspending ? "All their API keys will stop working immediately." : "Their integration will start working again.",
      showCancelButton: true,
      confirmButtonText: isSuspending ? "Suspend" : "Reactivate",
      confirmButtonColor: isSuspending ? "#dc2626" : "#16a34a",
    });
    if (!confirm.isConfirmed) return;

    await axios.post(`/api/app/admin/clients/${client.id}/${isSuspending ? "suspend" : "reactivate"}`);
    load();
  }

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">Client Management</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-2xl border border-scanza-border bg-scanza-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-scanza-primary/10 text-scanza-primary">
                    <Building2 size={19} />
                  </span>
                  <div>
                    <p className="font-semibold text-scanza-text">{c.companyName}</p>
                    <p className="text-xs text-scanza-text-muted">{c.websiteUrl ?? "No website set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-scanza-primary/10 px-3 py-1 text-xs font-medium text-scanza-primary">{c.planTier}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.isSuspended ? "bg-scanza-danger/10 text-scanza-danger" : "bg-scanza-success/10 text-scanza-success"}`}>
                    {c.isSuspended ? "Suspended" : "Active"}
                  </span>
                  <button
                    onClick={() => handleToggleSuspend(c)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      c.isSuspended ? "bg-scanza-success/10 text-scanza-success" : "bg-scanza-danger/10 text-scanza-danger"
                    }`}
                  >
                    {c.isSuspended ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                    {c.isSuspended ? "Reactivate" : "Suspend"}
                  </button>
                </div>
              </div>
              <div className="flex gap-6 text-xs text-scanza-text-muted">
                <span className="flex items-center gap-1.5"><KeySquare size={13} /> {c._count.apiKeys} API keys</span>
                <span className="flex items-center gap-1.5"><FileText size={13} /> {c._count.resumes} resumes</span>
                <span className="flex items-center gap-1.5"><Users size={13} /> {c._count.accounts} team members</span>
                <span>{c.usedThisCycle}/{c.monthlyQuota} quota used this cycle</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
