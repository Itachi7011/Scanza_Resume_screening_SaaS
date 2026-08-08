import type { Metadata } from "next";
import { BookOpen, KeyRound, Send, Webhook, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Integrate Scanza's resume parsing and scoring API into your hiring pipeline.",
};

function CodeBlock({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-scanza-text p-4 text-xs leading-relaxed text-scanza-bg">{children}</pre>;
}

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-scanza-border py-10">
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-scanza-text">
        <Icon size={22} className="text-scanza-primary" /> {title}
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-scanza-text-muted">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-3 font-display text-4xl font-bold text-scanza-text">Documentation</h1>
      <p className="mb-10 text-scanza-text-muted">Everything you need to integrate Scanza into your hiring pipeline.</p>

      <Section id="getting-started" icon={BookOpen} title="Getting Started">
        <p>
          Scanza exposes a REST API for submitting resumes and retrieving structured extraction results.
          Sign up as a company account, then generate an API key from your dashboard under{" "}
          <strong className="text-scanza-text">API Keys</strong>.
        </p>
      </Section>

      <Section id="authentication" icon={KeyRound} title="Authentication">
        <p>Every request to the public API must include your API key in the <code className="rounded bg-scanza-bg px-1.5 py-0.5">X-API-Key</code> header:</p>
        <CodeBlock>{`X-API-Key: scz_live_xxxxxxxxxxxxxxxxxxxxxxxx`}</CodeBlock>
        <p>Keys are shown only once at creation — store them securely. Revoke a compromised key instantly from your dashboard.</p>
      </Section>

      <Section id="api-reference" icon={Send} title="API Reference">
        <p className="font-semibold text-scanza-text">POST /api/app/v1/resumes</p>
        <p>Submit a resume for extraction. Multipart form data.</p>
        <CodeBlock>{`curl -X POST https://api.scanza.dev/api/app/v1/resumes \\
  -H "X-API-Key: scz_live_your_key_here" \\
  -F "file=@resume.pdf" \\
  -F "externalUserRef=applicant_12345"`}</CodeBlock>
        <p>Response:</p>
        <CodeBlock>{`{
  "success": true,
  "message": "Resume submitted and processed.",
  "data": {
    "resumeId": "8f14e...",
    "score": 78,
    "engine": "CLAUDE_LLM"
  }
}`}</CodeBlock>

        <p className="pt-3 font-semibold text-scanza-text">GET /api/app/v1/resumes/:id</p>
        <p>Fetch the full structured result for a previously submitted resume, including profile, categorized skills, experience, education, score breakdown, and suggestions.</p>

        <p className="pt-3 font-semibold text-scanza-text">GET /api/app/v1/resumes?externalUserRef=applicant_12345</p>
        <p>List all resumes submitted for a given applicant (your own user ID, passed as <code className="rounded bg-scanza-bg px-1.5 py-0.5">externalUserRef</code>).</p>
      </Section>

      <Section id="webhooks" icon={Webhook} title="Webhooks">
        <p>
          Instead of polling, configure a <code className="rounded bg-scanza-bg px-1.5 py-0.5">webhookUrl</code> from your dashboard settings.
          Scanza will POST the full result the moment extraction completes:
        </p>
        <CodeBlock>{`POST <your webhookUrl>
Content-Type: application/json

{
  "event": "resume.processed",
  "data": { ...full resume result... }
}`}</CodeBlock>
      </Section>

      <Section id="errors-limits" icon={AlertTriangle} title="Errors & Rate Limits">
        <p>All errors follow the same shape:</p>
        <CodeBlock>{`{ "success": false, "message": "...", "errors": null }`}</CodeBlock>
        <ul className="list-inside list-disc space-y-1">
          <li><strong className="text-scanza-text">401</strong> — missing or invalid API key</li>
          <li><strong className="text-scanza-text">403</strong> — account suspended, or origin not on your allow-list</li>
          <li><strong className="text-scanza-text">429</strong> — monthly quota exceeded</li>
          <li><strong className="text-scanza-text">415</strong> — unsupported file type (only PDF and DOCX are accepted)</li>
        </ul>
      </Section>
    </div>
  );
}
