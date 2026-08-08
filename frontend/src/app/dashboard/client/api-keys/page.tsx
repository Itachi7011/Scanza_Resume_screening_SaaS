"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, Copy, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";

interface ApiKeyItem {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    axios.get("/api/app/client/profile").then(({ data }) => setKeys(data.data.apiKeys)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleCreate() {
    const { value: label } = await Swal.fire({
      title: "New API Key",
      input: "text",
      inputLabel: "Label (e.g. Production, Staging)",
      inputPlaceholder: "Production",
      showCancelButton: true,
      confirmButtonText: "Create",
    });
    if (!label) return;

    setCreating(true);
    try {
      const { data } = await axios.post("/api/app/client/api-keys", { label });
      await Swal.fire({
        icon: "success",
        title: "API Key Created",
        html: `<p class="mb-2 text-sm">Copy this now — it won't be shown again:</p><code class="block break-all rounded bg-gray-100 p-2 text-xs">${data.data.rawKey}</code>`,
        confirmButtonText: "I've copied it",
      });
      load();
    } catch {
      Swal.fire({ icon: "error", title: "Couldn't create key" });
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string, label: string) {
    const confirm = await Swal.fire({
      icon: "warning",
      title: `Revoke "${label}"?`,
      text: "Any integration using this key will stop working immediately.",
      showCancelButton: true,
      confirmButtonText: "Revoke",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    await axios.delete(`/api/app/client/api-keys/${id}`);
    load();
  }

  return (
    <div className="animate-scanza-fade-in max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-scanza-text">API Keys</h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="scanza-focus-ring flex items-center gap-2 rounded-xl bg-scanza-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          New Key
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : keys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-scanza-border p-12 text-center">
          <KeyRound size={30} className="mx-auto mb-3 text-scanza-text-muted" />
          <p className="text-scanza-text-muted">No API keys yet. Create one to start integrating Scanza.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-2xl border border-scanza-border bg-scanza-surface p-4">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-scanza-primary/10 text-scanza-primary">
                  <KeyRound size={17} />
                </span>
                <div>
                  <p className="font-medium text-scanza-text">{k.label}</p>
                  <p className="flex items-center gap-1 text-xs text-scanza-text-muted">
                    <code>{k.keyPrefix}...</code>
                    <Copy size={11} className="cursor-pointer" onClick={() => navigator.clipboard.writeText(k.keyPrefix)} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-scanza-text-muted">{k.requestCount} requests</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${k.isActive ? "bg-scanza-success/10 text-scanza-success" : "bg-scanza-danger/10 text-scanza-danger"}`}>
                  {k.isActive ? "Active" : "Revoked"}
                </span>
                {k.isActive && (
                  <button onClick={() => handleRevoke(k.id, k.label)} aria-label="Revoke key" className="text-scanza-text-muted hover:text-scanza-danger">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
