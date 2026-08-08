"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Loader2, Trophy, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";
import ScoreGauge from "@/components/ui/ScoreGauge";

interface RankedMatch {
  id: string;
  matchScore: number;
  matchedSkillIds: string[];
  missingSkillIds: string[];
  resume: {
    id: string;
    originalFileName: string;
    profile: { fullName: string | null; email: string | null } | null;
    scoreResult: { overallScore: number } | null;
  };
}

interface JobPostingDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  matches: RankedMatch[];
}

export default function JobPostingDetailPage() {
  const params = useParams();
  const [posting, setPosting] = useState<JobPostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const load = useCallback(() => {
    axios.get(`/api/app/client/job-postings/${params.id}`).then(({ data }) => setPosting(data.data)).finally(() => setLoading(false));
  }, [params.id]);

  useEffect(load, [load]);

  async function handleRecompute() {
    setRecomputing(true);
    try {
      await axios.post(`/api/app/client/job-postings/${params.id}/compute-matches`);
      Swal.fire({ icon: "success", title: "Candidates re-ranked", timer: 1200, showConfirmButton: false });
      load();
    } catch {
      Swal.fire({ icon: "error", title: "Couldn't recompute matches" });
    } finally {
      setRecomputing(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>;
  if (!posting) return <p className="text-center text-scanza-text-muted">Job posting not found.</p>;

  return (
    <div className="animate-scanza-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-scanza-text">{posting.title}</h1>
          <p className="text-scanza-text-muted">{posting.matches.length} candidate(s) ranked</p>
        </div>
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="flex items-center gap-2 rounded-xl border border-scanza-border px-4 py-2.5 text-sm font-medium text-scanza-text hover:border-scanza-primary disabled:opacity-60"
        >
          {recomputing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Recompute Rankings
        </button>
      </div>

      {posting.matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-scanza-border p-12 text-center">
          <Trophy size={30} className="mx-auto mb-3 text-scanza-text-muted" />
          <p className="text-scanza-text-muted">No candidates ranked yet. Submit resumes through your API integration, then click &quot;Recompute Rankings&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posting.matches.map((m, i) => (
            <div key={m.id} className="flex items-center gap-5 rounded-2xl border border-scanza-border bg-scanza-surface p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-scanza-primary/10 text-sm font-bold text-scanza-primary">#{i + 1}</span>
              <ScoreGauge score={m.matchScore} size={64} label="match" />
              <div className="flex-1">
                <Link href={`/dashboard/resumes/${m.resume.id}`} className="font-semibold text-scanza-text hover:text-scanza-primary">
                  {m.resume.profile?.fullName ?? m.resume.originalFileName}
                </Link>
                <p className="text-xs text-scanza-text-muted">{m.resume.profile?.email}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1 text-scanza-success"><CheckCircle2 size={12} /> {m.matchedSkillIds.length} matched</span>
                  <span className="flex items-center gap-1 text-scanza-danger"><XCircle size={12} /> {m.missingSkillIds.length} missing</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
