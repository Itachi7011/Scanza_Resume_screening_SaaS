"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Trash2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";
import { ResumeResult } from "@/types/resume";

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-scanza-success/10 text-scanza-success",
  PROCESSING: "bg-scanza-warning/10 text-scanza-warning",
  PENDING: "bg-scanza-text-muted/10 text-scanza-text-muted",
  FAILED: "bg-scanza-danger/10 text-scanza-danger",
};

export default function MyResumesPage() {
  const [resumes, setResumes] = useState<ResumeResult[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    axios.get("/api/app/resumes").then(({ data }) => setResumes(data.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete this resume?",
      text: "This cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    await axios.delete(`/api/app/resumes/${id}`);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">My Resumes</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-scanza-border p-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-scanza-text-muted" />
          <p className="text-scanza-text-muted">You haven&apos;t analyzed any resumes yet.</p>
          <Link href="/#upload" className="mt-3 inline-block font-medium text-scanza-primary hover:underline">Upload your first resume</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl border border-scanza-border bg-scanza-surface p-4">
              <Link href={`/dashboard/resumes/${r.id}`} className="flex flex-1 items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-scanza-primary/10 text-scanza-primary">
                  <FileText size={19} />
                </span>
                <div>
                  <p className="font-medium text-scanza-text">{r.originalFileName}</p>
                  <p className="text-xs text-scanza-text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
              <div className="flex items-center gap-4">
                {r.scoreResult && <span className="font-display font-bold text-scanza-text">{r.scoreResult.overallScore}</span>}
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.extractionStatus]}`}>{r.extractionStatus}</span>
                <button onClick={() => handleDelete(r.id)} aria-label="Delete resume" className="text-scanza-text-muted hover:text-scanza-danger">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
