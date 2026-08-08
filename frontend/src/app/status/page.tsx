import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Status" };

const SERVICES = ["Website", "Resume Extraction API", "Authentication", "Webhooks"];

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center font-display text-3xl font-bold text-scanza-text">System Status</h1>
      <div className="space-y-3">
        {SERVICES.map((s) => (
          <div key={s} className="flex items-center justify-between rounded-xl border border-scanza-border bg-scanza-surface px-5 py-4">
            <span className="text-sm font-medium text-scanza-text">{s}</span>
            <span className="flex items-center gap-1.5 text-sm text-scanza-success"><CheckCircle2 size={15} /> Operational</span>
          </div>
        ))}
      </div>
    </div>
  );
}
