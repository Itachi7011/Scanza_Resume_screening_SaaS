import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <Briefcase size={36} className="mx-auto mb-4 text-scanza-text-muted" />
      <h1 className="mb-3 font-display text-3xl font-bold text-scanza-text">Careers</h1>
      <p className="text-scanza-text-muted">No open roles right now — check back soon, or reach out at careers@scanza.dev.</p>
    </div>
  );
}
