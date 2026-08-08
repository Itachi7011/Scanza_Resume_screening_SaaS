"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import ResumeResults from "@/components/home/ResumeResults";
import { ResumeResult } from "@/types/resume";

export default function ResumeDetailPage() {
  const params = useParams();
  const [resume, setResume] = useState<ResumeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/app/resumes/${params.id}`)
      .then(({ data }) => setResume(data.data))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>;
  }

  if (!resume) {
    return <p className="text-center text-scanza-text-muted">Resume not found.</p>;
  }

  return <ResumeResults result={resume} />;
}
