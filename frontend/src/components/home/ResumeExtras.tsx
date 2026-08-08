"use client";

import {
  Award as AwardIcon, FolderGit2, Languages as LanguagesIcon, BookMarked,
  ShieldCheck, TrendingUp, AlertOctagon, ExternalLink, Radar,
} from "lucide-react";
import {
  CertificationEntry, ResumeProjectEntry, LanguageEntry, AwardEntry,
  PublicationEntry, AtsIssue, CareerInsights,
} from "@/types/resume";

const ATS_SEVERITY_STYLE: Record<string, string> = {
  critical: "border-scanza-danger/30 bg-scanza-danger/5 text-scanza-danger",
  warning: "border-scanza-warning/30 bg-scanza-warning/5 text-scanza-warning",
  info: "border-scanza-border bg-scanza-bg text-scanza-text-muted",
};

function Card({ title, icon: Icon, children }: { title: string; icon: typeof AwardIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-scanza-text">
        <Icon size={18} className="text-scanza-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

export function CertificationsSection({ items }: { items: CertificationEntry[] }) {
  if (!items.length) return null;
  return (
    <Card title="Certifications" icon={ShieldCheck}>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="flex items-start justify-between rounded-xl bg-scanza-bg p-3.5">
            <div>
              <p className="font-medium text-scanza-text">{c.name}</p>
              <p className="text-xs text-scanza-text-muted">{c.issuer}{c.issueDate && ` · ${new Date(c.issueDate).getFullYear()}`}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProjectsSection({ items }: { items: ResumeProjectEntry[] }) {
  if (!items.length) return null;
  return (
    <Card title="Projects" icon={FolderGit2}>
      <div className="space-y-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl bg-scanza-bg p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-medium text-scanza-text">{p.name}</p>
              {p.url && (
                <a href={p.url.startsWith("http") ? p.url : `https://${p.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-scanza-primary hover:underline">
                  View <ExternalLink size={11} />
                </a>
              )}
            </div>
            {p.description && <p className="mb-2 text-sm text-scanza-text-muted">{p.description}</p>}
            {p.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.technologies.map((t) => (
                  <span key={t} className="rounded-full border border-scanza-border px-2 py-0.5 text-xs text-scanza-text-muted">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function LanguagesAwardsSection({ languages, awards, publications }: { languages: LanguageEntry[]; awards: AwardEntry[]; publications: PublicationEntry[] }) {
  if (!languages.length && !awards.length && !publications.length) return null;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {languages.length > 0 && (
        <Card title="Languages" icon={LanguagesIcon}>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <span key={l.id} className="rounded-full border border-scanza-border bg-scanza-bg px-3 py-1.5 text-xs font-medium text-scanza-text">
                {l.name}{l.proficiency && <span className="ml-1 text-scanza-text-muted">· {l.proficiency}</span>}
              </span>
            ))}
          </div>
        </Card>
      )}
      {(awards.length > 0 || publications.length > 0) && (
        <Card title="Awards & Publications" icon={AwardIcon}>
          <div className="space-y-2.5">
            {awards.map((a) => (
              <div key={a.id} className="text-sm">
                <p className="font-medium text-scanza-text">{a.title}</p>
                <p className="text-xs text-scanza-text-muted">{a.issuer}{a.date && ` · ${new Date(a.date).getFullYear()}`}</p>
              </div>
            ))}
            {publications.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-scanza-text-muted"><BookMarked size={12} /> {publications.length} publication(s)</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export function AtsReportSection({ issues }: { issues: AtsIssue[] | null }) {
  if (!issues || issues.length === 0) return null;
  return (
    <Card title="ATS Compatibility Report" icon={Radar}>
      <div className="space-y-2.5">
        {issues.map((issue, i) => (
          <div key={i} className={`rounded-xl border p-3 text-sm ${ATS_SEVERITY_STYLE[issue.severity]}`}>
            {issue.message}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CareerInsightsSection({ insights }: { insights: CareerInsights | null }) {
  if (!insights) return null;
  const hasContent = insights.employment_gaps.length > 0 || insights.average_tenure_years || insights.shows_job_hopping_pattern || insights.shows_career_progression;
  if (!hasContent) return null;

  return (
    <Card title="Career Pattern Insights" icon={TrendingUp}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {insights.average_tenure_years !== null && (
          <div className="rounded-xl bg-scanza-bg p-4">
            <p className="text-2xl font-bold text-scanza-text">{insights.average_tenure_years}y</p>
            <p className="text-xs text-scanza-text-muted">Average tenure per role</p>
          </div>
        )}
        {insights.shows_career_progression && (
          <div className="flex items-center gap-2 rounded-xl bg-scanza-success/10 p-4 text-sm text-scanza-success">
            <TrendingUp size={16} /> Clear upward career progression detected
          </div>
        )}
        {insights.shows_job_hopping_pattern && (
          <div className="flex items-center gap-2 rounded-xl bg-scanza-warning/10 p-4 text-sm text-scanza-warning">
            <AlertOctagon size={16} /> Frequent role changes (avg. under 1 year/role)
          </div>
        )}
      </div>
      {insights.employment_gaps.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-scanza-text-muted">Employment Gaps</p>
          <ul className="space-y-1 text-sm text-scanza-text-muted">
            {insights.employment_gaps.map((g, i) => <li key={i}>• {g}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
