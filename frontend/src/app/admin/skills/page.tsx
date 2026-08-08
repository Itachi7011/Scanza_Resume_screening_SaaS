"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import axios from "@/lib/axios";

interface SkillCategoryNode {
  id: string;
  name: string;
  children: { id: string; name: string; skills: { id: string; name: string }[] }[];
}

export default function AdminSkillsPage() {
  const [tree, setTree] = useState<SkillCategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/app/skills").then(({ data }) => setTree(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-scanza-fade-in">
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold text-scanza-text">
        <Layers size={22} className="text-scanza-primary" /> Skill Taxonomy
      </h1>
      <p className="mb-6 text-scanza-text-muted">
        The categorized skill database that powers extraction, matching, and scoring across the whole platform.
        Managed via <code className="rounded bg-scanza-bg px-1.5 py-0.5 text-xs">packages/database/prisma/seed.ts</code> — edit the taxonomy there and re-run the seed script.
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-scanza-border bg-scanza-surface p-5">
              <h2 className="mb-3 font-display font-semibold text-scanza-text">{cat.name}</h2>
              <div className="space-y-3">
                {cat.children.map((sub) => (
                  <div key={sub.id}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-scanza-text-muted">{sub.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.skills.map((s) => (
                        <span key={s.id} className="rounded-full bg-scanza-bg px-2.5 py-1 text-xs text-scanza-text">{s.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
