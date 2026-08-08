import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-4xl font-bold text-scanza-text">Cookie Policy</h1>
      <div className="space-y-5 text-sm leading-relaxed text-scanza-text-muted">
        <p>
          Scanza uses a small number of essential cookies: <code className="rounded bg-scanza-bg px-1.5 py-0.5">scanza_access_token</code> and{" "}
          <code className="rounded bg-scanza-bg px-1.5 py-0.5">scanza_refresh_token</code>, both httpOnly, used solely to keep you
          logged in securely. We don&apos;t use third-party advertising or tracking cookies.
        </p>
        <p>Your theme preference (light/dark/ocean/sunset) is stored in your browser&apos;s local storage, not a cookie.</p>
      </div>
    </div>
  );
}
