import type { Metadata } from "next";
import { ShieldCheck, Lock, KeyRound, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Security" };

const POINTS = [
  { icon: Lock, title: "Encrypted in transit", text: "All traffic is served over HTTPS in production, with httpOnly, secure cookies for session tokens." },
  { icon: KeyRound, title: "Hashed credentials & tokens", text: "Passwords are hashed with bcrypt; refresh tokens and API keys are stored as SHA-256 hashes, never in plaintext." },
  { icon: ShieldCheck, title: "Scoped access", text: "API keys are scoped to a single client workspace with configurable origin allow-lists and usage quotas." },
  { icon: Eye, title: "Full audit trail", text: "Every admin action (blocking a user, suspending a client, changing settings) is logged with actor, target, and timestamp." },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold text-scanza-text">Security</h1>
      <div className="space-y-4">
        {POINTS.map((p) => (
          <div key={p.title} className="flex items-start gap-4 rounded-2xl border border-scanza-border bg-scanza-surface p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-scanza-primary/10 text-scanza-primary">
              <p.icon size={18} />
            </span>
            <div>
              <p className="font-semibold text-scanza-text">{p.title}</p>
              <p className="text-sm text-scanza-text-muted">{p.text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-scanza-text-muted">
        Found a security issue? Please report it responsibly to security@scanza.dev rather than filing a public issue.
      </p>
    </div>
  );
}
