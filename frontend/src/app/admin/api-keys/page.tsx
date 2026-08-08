"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeySquare, Loader2 } from "lucide-react";
import axios from "@/lib/axios";

interface AdminClient {
  id: string;
  companyName: string;
  isSuspended: boolean;
  _count: { apiKeys: number };
}

export default function AdminApiKeysPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/app/admin/clients").then(({ data }) => setClients(data.data)).finally(() => setLoading(false));
  }, []);

  const totalKeys = clients.reduce((sum, c) => sum + c._count.apiKeys, 0);

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold text-scanza-text">
        <KeySquare size={22} className="text-scanza-primary" /> API Keys Overview
      </h1>
      <p className="mb-6 text-scanza-text-muted">{totalKeys} total API keys issued across {clients.length} clients.</p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-scanza-border bg-scanza-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-scanza-border bg-scanza-bg text-xs uppercase text-scanza-text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">API Keys</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-scanza-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href="/admin/clients" className="font-medium text-scanza-text hover:text-scanza-primary">{c.companyName}</Link>
                  </td>
                  <td className="px-4 py-3 text-scanza-text-muted">{c._count.apiKeys}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.isSuspended ? "bg-scanza-danger/10 text-scanza-danger" : "bg-scanza-success/10 text-scanza-success"}`}>
                      {c.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
