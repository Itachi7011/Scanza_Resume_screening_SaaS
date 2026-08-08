import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-4xl font-bold text-scanza-text">Privacy Policy</h1>
      <div className="space-y-5 text-sm leading-relaxed text-scanza-text-muted">
        <p>Last updated: placeholder — replace with your actual policy before launch.</p>
        <p>
          Scanza collects the information you provide when you upload a resume (contact details, work history,
          skills, education) in order to analyze it and, if you create an account, to save your results. Resumes
          are stored securely via Cloudinary and processed either by Anthropic&apos;s Claude API or by our own
          offline extraction service, depending on configuration.
        </p>
        <p>
          If you use Scanza through a client company&apos;s integration, your resume data is shared with that
          company as part of the service they&apos;ve configured, per their own privacy practices.
        </p>
        <p>
          We do not sell your personal data. You may request deletion of your account and associated resumes at
          any time by contacting support@scanza.dev.
        </p>
      </div>
    </div>
  );
}
