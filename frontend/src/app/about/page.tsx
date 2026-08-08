import type { Metadata } from "next";
import { Target, Layers, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Why we built Scanza — a resume screening tool that goes beyond keyword matching.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-4xl font-bold text-scanza-text">About Scanza</h1>
      <div className="space-y-5 text-scanza-text-muted">
        <p>
          Most resume screening tools on the market today do one thing: match keywords against a job description.
          That approach is fast, but it&apos;s shallow — it rewards keyword stuffing over real substance, and it
          gives candidates no meaningful feedback on how to actually improve.
        </p>
        <p>
          Scanza was built differently. Instead of a flat keyword list, every skill is organized into a real,
          categorized taxonomy. Instead of a black-box score, every sub-score comes with an explainable reason.
          Instead of forcing a rewrite, Scanza gives specific, actionable suggestions and lets the candidate decide
          what to change.
        </p>
        <p>
          For hiring teams, Scanza is also a SaaS platform — a simple API and webhook system that drops structured
          candidate data straight into your existing pipeline, without you having to build a resume parser yourself.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { icon: Target, title: "Substance over keywords", text: "Real structural understanding, not pattern matching." },
          { icon: Layers, title: "Categorized, not flat", text: "Skills organized the way people actually think about them." },
          { icon: ShieldCheck, title: "Private by default", text: "Your data is yours — analyzed securely, saved only if you choose." },
        ].map((v) => (
          <div key={v.title} className="rounded-2xl border border-scanza-border bg-scanza-surface p-5">
            <v.icon size={20} className="mb-3 text-scanza-primary" />
            <p className="mb-1 font-semibold text-scanza-text">{v.title}</p>
            <p className="text-sm text-scanza-text-muted">{v.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
