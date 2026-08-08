import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-4xl font-bold text-scanza-text">Terms of Service</h1>
      <div className="space-y-5 text-sm leading-relaxed text-scanza-text-muted">
        <p>Last updated: placeholder — replace with your actual terms before launch.</p>
        <p>
          By using Scanza, you agree not to upload resumes you don&apos;t have the right to submit, not to abuse
          the API beyond your plan&apos;s quota, and not to attempt to reverse-engineer or resell access to the
          extraction engine without a commercial agreement.
        </p>
        <p>
          Scanza is provided &quot;as is&quot; without warranty of any kind. Extraction accuracy varies by resume
          format and is not guaranteed to be error-free — always allow candidates or account holders to review
          and correct extracted data before relying on it for decisions.
        </p>
        <p>SaaS client accounts are billed according to the plan selected at signup; usage beyond quota may incur additional charges or be rate-limited.</p>
      </div>
    </div>
  );
}
