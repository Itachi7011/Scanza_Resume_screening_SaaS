import Link from "next/link";
import { ScanSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-scanza-primary/10 text-scanza-primary">
        <ScanSearch size={28} />
      </span>
      <h1 className="mb-2 font-display text-3xl font-bold text-scanza-text">Page not found</h1>
      <p className="mb-6 text-scanza-text-muted">We couldn&apos;t find the page you were looking for.</p>
      <Link href="/" className="rounded-xl bg-scanza-primary px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105">
        Back to Home
      </Link>
    </div>
  );
}
