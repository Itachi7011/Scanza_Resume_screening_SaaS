import type { Metadata } from "next";
import { Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Skill Categories",
  description: "Browse the full categorized skill taxonomy Scanza uses to analyze resumes.",
};

async function getTaxonomy() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/app/skills`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

interface CategoryNode {
  id: string;
  name: string;
  children: { id: string; name: string; skills: { id: string; name: string }[] }[];
}

export default async function SkillsPage() {
  const tree: CategoryNode[] = await getTaxonomy();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-scanza-primary/10 text-scanza-primary">
          <Layers size={22} />
        </span>
        <h1 className="mb-3 font-display text-4xl font-bold text-scanza-text">Skill Categories</h1>
        <p className="mx-auto max-w-2xl text-scanza-text-muted">
          Scanza doesn&apos;t just keyword-match — every skill is organized into a real, structured taxonomy.
        </p>
      </div>

      {tree.length === 0 ? (
        <p className="text-center text-scanza-text-muted">
          Taxonomy will appear here once the backend is running and seeded (see project README).
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
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
