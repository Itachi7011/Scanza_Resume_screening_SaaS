"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, TrendingUp } from "lucide-react";
import axios from "@/lib/axios";

interface UsageStats {
  planTier: string;
  monthlyQuota: number;
  usedThisCycle: number;
  remainingThisCycle: number;
  totalResumesAllTime: number;
  resumesLast30Days: number;
}

export default function ClientUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    axios.get("/api/app/client/usage").then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>;
  }

  const usagePercent = Math.min(100, Math.round((stats.usedThisCycle / stats.monthlyQuota) * 100));

  return (
    <div className="animate-scanza-fade-in max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">Usage & Analytics</h1>

      <div className="mb-6 rounded-2xl border border-scanza-border bg-scanza-surface p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium text-scanza-text"><Zap size={16} className="text-scanza-primary" /> Monthly Quota ({stats.planTier})</span>
          <span className="text-sm text-scanza-text-muted">{stats.usedThisCycle} / {stats.monthlyQuota}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-scanza-bg">
          <div className="h-full rounded-full bg-gradient-to-r from-scanza-primary to-scanza-accent transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-scanza-text-muted">{stats.remainingThisCycle} resumes remaining this cycle</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
          <TrendingUp size={18} className="mb-3 text-scanza-primary" />
          <p className="text-2xl font-bold text-scanza-text">{stats.totalResumesAllTime}</p>
          <p className="text-sm text-scanza-text-muted">Total resumes processed</p>
        </div>
        <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
          <TrendingUp size={18} className="mb-3 text-scanza-primary" />
          <p className="text-2xl font-bold text-scanza-text">{stats.resumesLast30Days}</p>
          <p className="text-sm text-scanza-text-muted">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
