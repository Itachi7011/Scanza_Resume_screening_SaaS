import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Webhook, ShieldCheck, Zap, Code2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "For Employers",
  description: "Embed Scanza's resume parsing and scoring engine directly into your hiring pipeline via API.",
};

const BENEFITS = [
  { icon: Zap, title: "Drop-in Integration", description: "Send a resume file, get back structured JSON — name, contact, location, categorized skills, experience, education, and a quality score." },
  { icon: Webhook, title: "Webhook Delivery", description: "Register a webhook URL and get notified the instant a resume finishes processing — no polling required." },
  { icon: ShieldCheck, title: "Secure by Design", description: "API-key authentication, origin allow-listing for browser widgets, and per-client usage quotas." },
  { icon: Code2, title: "Simple REST API", description: "Standard multipart file upload, JSON responses, and clear documentation — integrate in an afternoon." },
];

export default function ForEmployersPage() {
  return (
    <div>
      <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-scanza-border bg-scanza-surface px-4 py-1.5 text-xs font-medium text-scanza-text-muted">
          <Building2 size={12} className="text-scanza-primary" /> For hiring teams & ATS platforms
        </span>
        <h1 className="mx-auto mb-5 max-w-3xl font-display text-4xl font-bold text-scanza-text sm:text-5xl">
          Add real resume intelligence to your careers page
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-scanza-text-muted">
          Whether candidates apply through your own careers page or an embedded widget, Scanza parses,
          categorizes, and scores every resume — so your team sees structured data, not raw PDFs.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-scanza-primary px-6 py-3 font-semibold text-white transition-transform hover:scale-105">
            Get API Access
          </Link>
          <Link href="/docs" className="flex items-center gap-1.5 rounded-xl border border-scanza-border px-6 py-3 font-semibold text-scanza-text">
            Read the Docs <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="border-t border-scanza-border bg-scanza-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-scanza-border bg-scanza-bg p-6">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-scanza-primary/10 text-scanza-primary">
                <b.icon size={20} />
              </span>
              <h3 className="mb-2 font-display font-semibold text-scanza-text">{b.title}</h3>
              <p className="text-sm text-scanza-text-muted">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-scanza-border bg-scanza-surface p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-scanza-text-muted">Example request</p>
          <pre className="overflow-x-auto rounded-xl bg-scanza-text p-4 text-xs text-scanza-bg">
{`curl -X POST https://api.scanza.dev/api/app/v1/resumes \\
  -H "X-API-Key: scz_live_your_key_here" \\
  -F "file=@candidate_resume.pdf" \\
  -F "externalUserRef=applicant_12345"`}
          </pre>
        </div>
      </section>
    </div>
  );
}
