"use client";

import { useState } from "react";
import { Target, Loader2, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";
import ScoreGauge from "@/components/ui/ScoreGauge";
import { JobMatchResult } from "@/types/resume";

export default function JobMatchPanel({ resumeId }: { resumeId: string }) {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  async function handleMatch() {
    if (jobDescription.trim().length < 30) {
      Swal.fire({ icon: "warning", title: "Paste a fuller job description", text: "At least a few sentences works best." });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/app/resumes/${resumeId}/match-job`, { jobDescription });
      setResult(data.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't compute a match score.";
      Swal.fire({ icon: "error", title: "Match failed", text: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-scanza-text">
        <Target size={18} className="text-scanza-primary" /> Match Against a Job Description
      </h3>
      <p className="mb-4 text-sm text-scanza-text-muted">
        Paste a job posting to see how well this resume&apos;s skills line up, and exactly what&apos;s missing.
      </p>

      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={6}
        placeholder="Paste the full job description here..."
        className="mb-4 w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-3 text-sm text-scanza-text outline-none focus:border-scanza-primary"
      />

      <button
        onClick={handleMatch}
        disabled={loading}
        className="scanza-focus-ring flex items-center gap-2 rounded-xl bg-scanza-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-60"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
        Compute Match Score
      </button>

      {result && (
        <div className="mt-6 animate-scanza-fade-in border-t border-scanza-border pt-6">
          <div className="mb-5 flex items-center gap-6">
            <ScoreGauge score={result.matchScore} size={100} label="match" />
            <p className="text-sm text-scanza-text-muted">
              {result.matchedSkillNames.length} of {result.matchedSkillNames.length + result.missingSkillNames.length} skills
              mentioned in this job description are already on the resume.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {result.matchedSkillNames.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-scanza-success">
                  <CheckCircle2 size={13} /> Matched Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkillNames.map((s) => (
                    <span key={s} className="rounded-full bg-scanza-success/10 px-2.5 py-1 text-xs font-medium text-scanza-success">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.missingSkillNames.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-scanza-danger">
                  <XCircle size={13} /> Missing Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkillNames.map((s) => (
                    <span key={s} className="rounded-full bg-scanza-danger/10 px-2.5 py-1 text-xs font-medium text-scanza-danger">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
