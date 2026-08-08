"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Building2, FileText, KeySquare, ArrowRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import axios from "@/lib/axios";

interface Overview {
  totalUsers: number;
  totalClients: number;
  totalResumes: number;
  activeApiKeys: number;
  blockedUsers: number;
}

interface AnalyticsData {
  resumesPerDay: { date: string; count: number }[];
  averageScore: number | null;
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    axios.get("/api/app/admin/dashboard/overview").then(({ data }) => setOverview(data.data));
    axios.get("/api/app/admin/dashboard/analytics?preset=month").then(({ data }) => setAnalytics(data.data));
  }, []);

  const cards = [
    { label: "Total Users", value: overview?.totalUsers, icon: Users, href: "/admin/users" },
    { label: "SaaS Clients", value: overview?.totalClients, icon: Building2, href: "/admin/clients" },
    { label: "Resumes Processed", value: overview?.totalResumes, icon: FileText, href: "/admin/analytics" },
    { label: "Active API Keys", value: overview?.activeApiKeys, icon: KeySquare, href: "/admin/api-keys" },
  ];

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-1 font-display text-2xl font-bold text-scanza-text">Admin Dashboard</h1>
      <p className="mb-8 text-scanza-text-muted">Platform-wide overview.</p>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-scanza-border bg-scanza-surface p-6 transition-transform hover:-translate-y-1">
            <c.icon size={20} className="mb-3 text-scanza-primary" />
            <p className="text-2xl font-bold text-scanza-text">{c.value ?? "—"}</p>
            <p className="flex items-center gap-1 text-sm text-scanza-text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-scanza-text">Resumes Processed (Last 30 Days)</h2>
          <Link href="/admin/analytics" className="flex items-center gap-1 text-sm font-medium text-scanza-primary hover:underline">
            Full analytics <ArrowRight size={14} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={analytics?.resumesPerDay ?? []}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--scanza-border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#colorCount)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
