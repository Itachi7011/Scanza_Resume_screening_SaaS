"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import axios from "@/lib/axios";

type Preset = "today" | "week" | "month" | "year" | "custom";

interface AnalyticsData {
  resumesPerDay: { date: string; count: number }[];
  signupsPerDay: { date: string; count: number }[];
  engineSplit: Record<string, number>;
  sourceSplit: Record<string, number>;
  scoreDistribution: Record<string, number>;
  topSkills: { name: string; count: number }[];
  averageScore: number | null;
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

const PIE_COLORS = ["#4f46e5", "#a855f7", "#06b6d4", "#f59e0b"];

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ preset });
    if (preset === "custom" && customFrom && customTo) {
      params.set("from", new Date(customFrom).toISOString());
      params.set("to", new Date(customTo).toISOString());
    }
    axios.get(`/api/app/admin/dashboard/analytics?${params}`).then(({ data }) => setData(data.data)).finally(() => setLoading(false));
  }, [preset, customFrom, customTo]);

  useEffect(load, [load]);

  const engineData = data ? Object.entries(data.engineSplit).map(([name, value]) => ({ name, value })) : [];
  const scoreDistData = data ? Object.entries(data.scoreDistribution).map(([range, count]) => ({ range, count })) : [];

  return (
    <div className="animate-scanza-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-scanza-text">Analytics</h1>
          <p className="text-scanza-text-muted">Average resume score: {data?.averageScore ?? "—"}/100</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                preset === p.value ? "bg-scanza-primary text-white" : "border border-scanza-border text-scanza-text hover:bg-scanza-bg"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-scanza-border bg-scanza-surface p-4">
          <label className="text-sm text-scanza-text-muted">
            From <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="ml-2 rounded-lg border border-scanza-border bg-scanza-bg px-2 py-1 text-sm text-scanza-text" />
          </label>
          <label className="text-sm text-scanza-text-muted">
            To <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="ml-2 rounded-lg border border-scanza-border bg-scanza-bg px-2 py-1 text-sm text-scanza-text" />
          </label>
          <button onClick={load} className="rounded-lg bg-scanza-primary px-4 py-1.5 text-sm font-medium text-white">Apply</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
            <h2 className="mb-4 font-display font-semibold text-scanza-text">Resumes Processed</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.resumesPerDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--scanza-border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
            <h2 className="mb-4 font-display font-semibold text-scanza-text">New Signups</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.signupsPerDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--scanza-border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
            <h2 className="mb-4 font-display font-semibold text-scanza-text">Extraction Engine Split</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={engineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {engineData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
            <h2 className="mb-4 font-display font-semibold text-scanza-text">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--scanza-border))" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6 lg:col-span-2">
            <h2 className="mb-4 font-display font-semibold text-scanza-text">Top 10 Skills Detected</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.topSkills ?? []} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--scanza-border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
