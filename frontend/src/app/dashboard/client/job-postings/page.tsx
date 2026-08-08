"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Users, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";

interface JobPostingItem {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: "DRAFT" | "OPEN" | "CLOSED";
  createdAt: string;
  _count: { matches: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-scanza-text-muted/10 text-scanza-text-muted",
  OPEN: "bg-scanza-success/10 text-scanza-success",
  CLOSED: "bg-scanza-danger/10 text-scanza-danger",
};

export default function JobPostingsPage() {
  const [postings, setPostings] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    axios.get("/api/app/client/job-postings").then(({ data }) => setPostings(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleCreate() {
    const { value: formValues } = await Swal.fire({
      title: "New Job Posting",
      html:
        '<input id="swal-title" class="swal2-input" placeholder="Job title (e.g. Senior Frontend Engineer)">' +
        '<textarea id="swal-desc" class="swal2-textarea" placeholder="Paste the full job description..."></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create",
      preConfirm: () => {
        const title = (document.getElementById("swal-title") as HTMLInputElement)?.value;
        const description = (document.getElementById("swal-desc") as HTMLTextAreaElement)?.value;
        if (!title || !description || description.length < 30) {
          Swal.showValidationMessage("Please provide a title and a fuller description (30+ chars).");
          return;
        }
        return { title, description };
      },
    });
    if (!formValues) return;

    try {
      await axios.post("/api/app/client/job-postings", formValues);
      Swal.fire({ icon: "success", title: "Job posting created", timer: 1200, showConfirmButton: false });
      load();
    } catch {
      Swal.fire({ icon: "error", title: "Couldn't create job posting" });
    }
  }

  return (
    <div className="animate-scanza-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-scanza-text">Job Postings</h1>
          <p className="text-scanza-text-muted">Rank submitted resumes against each posting automatically.</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 rounded-xl bg-scanza-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover">
          <Plus size={15} /> New Posting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : postings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-scanza-border p-12 text-center">
          <Briefcase size={30} className="mx-auto mb-3 text-scanza-text-muted" />
          <p className="text-scanza-text-muted">No job postings yet. Create one to start ranking candidates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postings.map((p) => (
            <Link key={p.id} href={`/dashboard/client/job-postings/${p.id}`} className="flex items-center justify-between rounded-2xl border border-scanza-border bg-scanza-surface p-5 hover:border-scanza-primary">
              <div>
                <p className="font-semibold text-scanza-text">{p.title}</p>
                <p className="text-xs text-scanza-text-muted">{p.department ?? "General"} {p.location && `· ${p.location}`}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-scanza-text-muted"><Users size={14} /> {p._count.matches} candidates</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[p.status]}`}>{p.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
