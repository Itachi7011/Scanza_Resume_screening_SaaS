"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, TrendingUp, UploadCloud, ArrowRight } from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import ScoreGauge from "@/components/ui/ScoreGauge";
import { ResumeResult } from "@/types/resume";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/app/resumes")
      .then(({ data }) => setResumes(data.data))
      .finally(() => setLoading(false));
  }, []);

  const latest = resumes[0];
  const avgScore = resumes.length
    ? Math.round(resumes.reduce((sum, r) => sum + (r.scoreResult?.overallScore ?? 0), 0) / resumes.length)
    : null;

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-1 font-display text-2xl font-bold text-scanza-text">Welcome back, {user?.fullName.split(" ")[0]} 👋</h1>
      <p className="mb-8 text-scanza-text-muted">Here&apos;s a snapshot of your resume activity.</p>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
          <FileText size={20} className="mb-3 text-scanza-primary" />
          <p className="text-2xl font-bold text-scanza-text">{loading ? "—" : resumes.length}</p>
          <p className="text-sm text-scanza-text-muted">Resumes analyzed</p>
        </div>
        <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
          <TrendingUp size={20} className="mb-3 text-scanza-primary" />
          <p className="text-2xl font-bold text-scanza-text">{loading ? "—" : avgScore ?? "N/A"}</p>
          <p className="text-sm text-scanza-text-muted">Average score</p>
        </div>
        <Link href="/#upload" className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-scanza-primary to-scanza-accent p-6 text-white transition-transform hover:scale-[1.02]">
          <UploadCloud size={20} className="mb-3" />
          <p className="font-semibold">Analyze a new resume</p>
          <p className="flex items-center gap-1 text-sm opacity-90">Go to upload <ArrowRight size={14} /></p>
        </Link>
      </div>

      {latest && (
        <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-scanza-text">Latest resume</h2>
            <Link href={`/dashboard/resumes/${latest.id}`} className="text-sm font-medium text-scanza-primary hover:underline">
              View details
            </Link>
          </div>
          <div className="flex items-center gap-6">
            {latest.scoreResult && <ScoreGauge score={latest.scoreResult.overallScore} size={90} />}
            <div>
              <p className="font-medium text-scanza-text">{latest.originalFileName}</p>
              <p className="text-sm text-scanza-text-muted">{latest.profile?.fullName ?? "Processed"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
