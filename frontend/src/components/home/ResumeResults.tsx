"use client";

import {
  Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase, GraduationCap,
  AlertTriangle, AlertCircle, Lightbulb, Sparkles, CheckCircle2, Twitter, Home,
} from "lucide-react";
import ScoreGauge from "@/components/ui/ScoreGauge";
import { ResumeResult } from "@/types/resume";
import {
  CertificationsSection, ProjectsSection, LanguagesAwardsSection,
  AtsReportSection, CareerInsightsSection,
} from "./ResumeExtras";
import JobMatchPanel from "./JobMatchPanel";

const WORK_MODE_LABEL: Record<string, string> = {
  REMOTE: "Open to Remote",
  HYBRID: "Open to Hybrid",
  OPEN_TO_RELOCATION: "Open to Relocation",
};

const SEVERITY_META = {
  critical: { icon: AlertCircle, color: "text-scanza-danger", bg: "bg-scanza-danger/10" },
  warning: { icon: AlertTriangle, color: "text-scanza-warning", bg: "bg-scanza-warning/10" },
  tip: { icon: Lightbulb, color: "text-scanza-primary", bg: "bg-scanza-primary/10" },
};

function SubScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-scanza-text-muted">{label}</span>
        <span className="font-medium text-scanza-text">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-scanza-bg">
        <div
          className="h-full rounded-full bg-gradient-to-r from-scanza-primary to-scanza-accent transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function ResumeResults({ result }: { result: ResumeResult }) {
  const {
    profile, skills, experiences, educations, scoreResult, suggestions,
    certifications, projects, languages, awards, publications, atsIssues, careerInsights, workMode,
  } = result;

  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.skill.category.name;
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto mt-10 w-full max-w-5xl animate-scanza-fade-in space-y-6">
      {/* Score + profile summary */}
      <div className="grid grid-cols-1 gap-6 rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center gap-4">
          {scoreResult && <ScoreGauge score={scoreResult.overallScore} size={150} />}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-scanza-text">{profile?.fullName ?? "Resume Analysis"}</h2>
          {profile?.headline && <p className="mb-3 text-scanza-text-muted">{profile.headline}</p>}

          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-scanza-text-muted">
            {profile?.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>}
            {profile?.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {profile.phone}</span>}
            {(profile?.city || profile?.country) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
            {workMode && WORK_MODE_LABEL[workMode] && (
              <span className="flex items-center gap-1.5 text-scanza-primary"><Home size={14} /> {WORK_MODE_LABEL[workMode]}</span>
            )}
          </div>

          <div className="mb-5 flex flex-wrap gap-3">
            {profile?.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-scanza-border px-3 py-1.5 text-xs text-scanza-text hover:border-scanza-primary hover:text-scanza-primary">
                <Linkedin size={13} /> LinkedIn
              </a>
            )}
            {profile?.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-scanza-border px-3 py-1.5 text-xs text-scanza-text hover:border-scanza-primary hover:text-scanza-primary">
                <Github size={13} /> GitHub
              </a>
            )}
            {profile?.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-scanza-border px-3 py-1.5 text-xs text-scanza-text hover:border-scanza-primary hover:text-scanza-primary">
                <Globe size={13} /> Portfolio
              </a>
            )}
          </div>

          {scoreResult && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <SubScoreBar label="Completeness" value={scoreResult.completenessScore} />
              <SubScoreBar label="Skills" value={scoreResult.skillsScore} />
              <SubScoreBar label="Experience" value={scoreResult.experienceScore} />
              <SubScoreBar label="Formatting" value={scoreResult.formattingScore} />
              <SubScoreBar label="Keyword Spread" value={scoreResult.keywordScore} />
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-scanza-text">
            <Sparkles size={18} className="text-scanza-primary" /> Suggestions to strengthen this resume
          </h3>
          <div className="space-y-3">
            {suggestions.map((s) => {
              const meta = SEVERITY_META[s.severity];
              const Icon = meta.icon;
              return (
                <div key={s.id} className={`flex items-start gap-3 rounded-xl p-3.5 ${meta.bg}`}>
                  <Icon size={17} className={`mt-0.5 shrink-0 ${meta.color}`} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-scanza-text-muted">{s.category}</p>
                    <p className="text-sm text-scanza-text">{s.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorized skills */}
      {Object.keys(skillsByCategory).length > 0 && (
        <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-scanza-text">
            <CheckCircle2 size={18} className="text-scanza-primary" /> Skills Detected
          </h3>
          <div className="space-y-5">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-scanza-text-muted">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((s) => (
                    <span key={s.id} className="rounded-full border border-scanza-border bg-scanza-bg px-3 py-1.5 text-xs font-medium text-scanza-text">
                      {s.skill.name}
                      {s.yearsOfUse && <span className="ml-1 text-scanza-text-muted">· {s.yearsOfUse}y</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-scanza-text">
            <Briefcase size={18} className="text-scanza-primary" /> Experience
          </h3>
          <div className="space-y-5 border-l-2 border-scanza-border pl-5">
            {experiences.map((exp) => (
              <div key={exp.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-scanza-primary" />
                <p className="font-semibold text-scanza-text">{exp.title ?? "Role"}{exp.company && ` — ${exp.company}`}</p>
                <p className="mb-1 text-xs text-scanza-text-muted">
                  {exp.startDate ?? "?"} – {exp.isCurrent ? "Present" : exp.endDate ?? "?"}
                </p>
                {exp.description && <p className="whitespace-pre-line text-sm text-scanza-text-muted">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-scanza-text">
            <GraduationCap size={18} className="text-scanza-primary" /> Education
          </h3>
          <div className="space-y-4">
            {educations.map((ed) => (
              <div key={ed.id}>
                <p className="font-semibold text-scanza-text">{ed.degree ?? "Degree"}</p>
                <p className="text-sm text-scanza-text-muted">
                  {ed.institution} {ed.grade && `· ${ed.grade}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProjectsSection items={projects} />
      <CertificationsSection items={certifications} />
      <LanguagesAwardsSection languages={languages} awards={awards} publications={publications} />
      <CareerInsightsSection insights={careerInsights} />
      <AtsReportSection issues={atsIssues} />
      <JobMatchPanel resumeId={result.id} />
    </div>
  );
}
