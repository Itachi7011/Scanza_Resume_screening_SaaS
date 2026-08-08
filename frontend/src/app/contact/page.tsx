"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Send, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // Wired to a real endpoint once you add a /contact route in main-service —
    // for now this simulates submission so the form is fully usable end to end.
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    Swal.fire({ icon: "success", title: "Message sent", text: "We'll get back to you within 1-2 business days." });
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="mb-3 font-display text-4xl font-bold text-scanza-text">Get in Touch</h1>
        <p className="text-scanza-text-muted">Questions about Scanza, integrations, or pricing? We&apos;d love to hear from you.</p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-scanza-border bg-scanza-surface p-5">
            <Mail size={19} className="mt-0.5 text-scanza-primary" />
            <div>
              <p className="font-medium text-scanza-text">Email</p>
              <p className="text-sm text-scanza-text-muted">support@scanza.dev</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-scanza-border bg-scanza-surface p-5">
            <MapPin size={19} className="mt-0.5 text-scanza-primary" />
            <div>
              <p className="font-medium text-scanza-text">Location</p>
              <p className="text-sm text-scanza-text-muted">Remote-first, worldwide</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-scanza-border bg-scanza-surface p-5">
            <Phone size={19} className="mt-0.5 text-scanza-primary" />
            <div>
              <p className="font-medium text-scanza-text">Phone</p>
              <p className="text-sm text-scanza-text-muted">+1 (555) 010-2024</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-scanza-border bg-scanza-surface p-6">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-scanza-text">Name</label>
              <input required className="w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none focus:border-scanza-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-scanza-text">Email</label>
              <input required type="email" className="w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none focus:border-scanza-primary" />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-scanza-text">Message</label>
            <textarea required rows={5} className="w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none focus:border-scanza-primary" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="scanza-focus-ring flex items-center gap-2 rounded-xl bg-scanza-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-60"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
