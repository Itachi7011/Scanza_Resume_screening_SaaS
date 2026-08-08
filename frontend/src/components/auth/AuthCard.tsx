import Link from "next/link";
import { ScanSearch } from "lucide-react";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-scanza-bg px-4 py-12">
      <div className="w-full max-w-md animate-scanza-slide-up rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-elevated">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-scanza-primary to-scanza-accent text-white">
            <ScanSearch size={22} />
          </span>
          <span className="font-display text-xl font-bold text-scanza-text">Scanza</span>
        </Link>

        <h1 className="mb-1 text-center font-display text-2xl font-bold text-scanza-text">{title}</h1>
        {subtitle && <p className="mb-6 text-center text-sm text-scanza-text-muted">{subtitle}</p>}

        {children}

        {footer && <div className="mt-6 text-center text-sm text-scanza-text-muted">{footer}</div>}
      </div>
    </div>
  );
}
