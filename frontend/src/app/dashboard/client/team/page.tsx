"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Loader2, Mail, X } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}
interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwner = user?.role === "CLIENT_OWNER";

  function load() {
    axios.get("/api/app/client/team").then(({ data }) => {
      setMembers(data.data.members);
      setInvites(data.data.pendingInvites);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleInvite() {
    const { value: email } = await Swal.fire({
      title: "Invite a teammate",
      input: "email",
      inputPlaceholder: "colleague@company.com",
      showCancelButton: true,
      confirmButtonText: "Send Invite",
    });
    if (!email) return;

    try {
      await axios.post("/api/app/client/team/invite", { email, role: "CLIENT_MEMBER" });
      Swal.fire({ icon: "success", title: "Invite sent", timer: 1200, showConfirmButton: false });
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't send invite.";
      Swal.fire({ icon: "error", title: "Error", text: message });
    }
  }

  async function handleRevoke(inviteId: string) {
    await axios.delete(`/api/app/client/team/invites/${inviteId}`);
    load();
  }

  return (
    <div className="animate-scanza-fade-in max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-scanza-text"><Users size={22} className="text-scanza-primary" /> Team</h1>
          <p className="text-scanza-text-muted">Manage who has access to your workspace.</p>
        </div>
        {isOwner && (
          <button onClick={handleInvite} className="flex items-center gap-2 rounded-xl bg-scanza-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover">
            <UserPlus size={15} /> Invite
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : (
        <>
          <div className="mb-6 space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl border border-scanza-border bg-scanza-surface p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-scanza-primary text-xs font-bold text-white">{m.fullName.charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="text-sm font-medium text-scanza-text">{m.fullName}</p>
                    <p className="text-xs text-scanza-text-muted">{m.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-scanza-bg px-2.5 py-1 text-xs font-medium text-scanza-text-muted">{m.role.replace("_", " ")}</span>
              </div>
            ))}
          </div>

          {invites.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-scanza-text-muted">Pending Invites</p>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-xl border border-dashed border-scanza-border p-3.5">
                    <span className="flex items-center gap-2 text-sm text-scanza-text-muted"><Mail size={14} /> {inv.email}</span>
                    {isOwner && (
                      <button onClick={() => handleRevoke(inv.id)} aria-label="Revoke invite" className="text-scanza-text-muted hover:text-scanza-danger">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
