"use client";

import { useEffect, useState } from "react";
import { ScrollText, Loader2 } from "lucide-react";
import axios from "@/lib/axios";

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
  actor: { fullName: string; email: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/app/admin/audit-logs").then(({ data }) => setLogs(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-scanza-text">
        <ScrollText size={22} className="text-scanza-primary" /> Audit Logs
      </h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-scanza-border bg-scanza-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-scanza-border bg-scanza-bg text-xs uppercase text-scanza-text-muted">
              <tr>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-scanza-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-scanza-text">{log.actor.fullName}</p>
                    <p className="text-xs text-scanza-text-muted">{log.actor.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-scanza-primary/10 px-2.5 py-1 text-xs font-medium text-scanza-primary">
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-scanza-text-muted">{log.targetType} {log.targetId?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-scanza-text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
