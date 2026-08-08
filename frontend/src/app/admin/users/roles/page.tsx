import { UserCog } from "lucide-react";

const ROLES = [
  { name: "SUPER_ADMIN", description: "Full platform control. Only role that can promote/demote other admins. Cannot be blocked or role-changed by anyone." },
  { name: "ADMIN", description: "Dashboard, analytics, user & client management, audit logs, platform settings. Cannot manage other admins." },
  { name: "CLIENT_OWNER", description: "Owns a SaaS client workspace — manages API keys, webhook config, and usage for their company." },
  { name: "CLIENT_MEMBER", description: "Teammate under a CLIENT_OWNER's workspace with the same dashboard access." },
  { name: "END_USER", description: "A person using scanza.dev directly to analyze their own resume(s)." },
];

export default function RolesPage() {
  return (
    <div className="animate-scanza-fade-in max-w-2xl">
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-scanza-text">
        <UserCog size={22} className="text-scanza-primary" /> Roles & Permissions
      </h1>
      <div className="space-y-3">
        {ROLES.map((r) => (
          <div key={r.name} className="rounded-2xl border border-scanza-border bg-scanza-surface p-5">
            <p className="mb-1 font-mono text-sm font-semibold text-scanza-primary">{r.name}</p>
            <p className="text-sm text-scanza-text-muted">{r.description}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-scanza-text-muted">
        Change a user&apos;s role from the <a href="/admin/users" className="text-scanza-primary hover:underline">User Management</a> page.
      </p>
    </div>
  );
}
