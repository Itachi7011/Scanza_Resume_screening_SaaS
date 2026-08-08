"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanSearch, Layers, ShieldCheck, Zap, Building2, ArrowRight } from "lucide-react";
import ResumeUploader from "@/components/home/ResumeUploader";
import ResumeResults from "@/components/home/ResumeResults";
import { ResumeResult } from "@/types/resume";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Deep, Not Just Keywords",
    description: "Scanza reads structure, context, and intent — not just whether a buzzword appears somewhere on the page.",
  },
  {
    icon: Layers,
    title: "Categorized Skill Intelligence",
    description: "Skills are organized into a real taxonomy (Frontend, Backend, Data, Design...) instead of a flat keyword list.",
  },
  {
    icon: Zap,
    title: "Instant, Actionable Feedback",
    description: "Get a clear score breakdown and specific suggestions — never a vague pass/fail with no explanation.",
  },
  {
    icon: ShieldCheck,
    title: "Private by Default",
    description: "Your resume is analyzed securely and only saved to your account if you choose to sign in.",
  },
];

export default function HomePage() {
  const [result, setResult] = useState<ResumeResult | null>(null);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-scanza-border bg-scanza-surface px-4 py-1.5 text-xs font-medium text-scanza-text-muted">
            <Zap size={12} className="text-scanza-primary" /> Free instant resume analysis — no signup required
          </span>
          <h1 className="mb-5 font-display text-4xl font-bold leading-tight text-scanza-text sm:text-5xl lg:text-6xl">
            Resume screening that actually{" "}
            <span className="scanza-gradient-text">understands</span> your resume
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-scanza-text-muted">
            Upload your resume and get a categorized skills breakdown, a transparent quality score, and
            concrete suggestions to improve it — powered by real extraction, not shallow keyword matching.
          </p>

          <ResumeUploader onAnalyzed={setResult} />
        </div>
      </section>

      {result && (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <ResumeResults result={result} />
        </section>
      )}

      {/* Features */}
      <section className="border-t border-scanza-border bg-scanza-surface px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-scanza-text">Why Scanza is different</h2>
            <p className="mx-auto max-w-2xl text-scanza-text-muted">
              Most tools stop at keyword matching. Scanza builds a real, structured understanding of every resume.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-scanza-border bg-scanza-bg p-6 transition-transform hover:-translate-y-1">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-scanza-primary/10 text-scanza-primary">
                  <f.icon size={20} />
                </span>
                <h3 className="mb-2 font-display font-semibold text-scanza-text">{f.title}</h3>
                <p className="text-sm text-scanza-text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employer CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 rounded-3xl bg-gradient-to-br from-scanza-primary to-scanza-accent p-10 text-center text-white sm:flex-row sm:text-left">
          <div>
            <span className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90 sm:justify-start justify-center">
              <Building2 size={16} /> For hiring teams
            </span>
            <h2 className="mb-2 font-display text-2xl font-bold sm:text-3xl">Embed Scanza in your hiring pipeline</h2>
            <p className="max-w-xl opacity-90">
              Drop Scanza into your careers page or ATS with a simple API key — structured candidate data,
              scoring, and webhooks, without building a parser yourself.
            </p>
          </div>
          <Link
            href="/for-employers"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3 font-semibold text-scanza-primary shadow-lg transition-transform hover:scale-105"
          >
            Explore the API <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
