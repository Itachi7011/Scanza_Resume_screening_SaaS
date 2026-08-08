import type { Metadata } from "next";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <Newspaper size={36} className="mx-auto mb-4 text-scanza-text-muted" />
      <h1 className="mb-3 font-display text-3xl font-bold text-scanza-text">Blog</h1>
      <p className="text-scanza-text-muted">We&apos;re just getting started — resume tips, hiring insights, and product updates will land here soon.</p>
    </div>
  );
}
