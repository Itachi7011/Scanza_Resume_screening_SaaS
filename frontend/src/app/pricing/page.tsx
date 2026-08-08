import { Check } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for job seekers and hiring teams using Scanza.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals analyzing their own resume.",
    features: ["Unlimited personal resume analysis", "Categorized skill detection", "Quality score & suggestions", "Resume history (up to 10)"],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For small hiring teams getting started with the API.",
    features: ["500 resumes/month", "Full extraction API", "Webhook delivery", "Email support"],
    cta: "Start Free Trial",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Growth",
    price: "$199",
    period: "/month",
    description: "For growing companies with higher volume.",
    features: ["3,000 resumes/month", "Priority extraction (Claude-first)", "Custom webhook retries", "Priority support"],
    cta: "Start Free Trial",
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For high-volume ATS integrations.",
    features: ["Unlimited volume", "Dedicated infrastructure", "SLA & onboarding support", "Custom contract terms"],
    cta: "Contact Sales",
    href: "/contact",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-14 text-center">
        <h1 className="mb-3 font-display text-4xl font-bold text-scanza-text">Simple, transparent pricing</h1>
        <p className="mx-auto max-w-2xl text-scanza-text-muted">Free for individuals. Pay only when you integrate Scanza into your hiring pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 ${plan.highlighted ? "border-scanza-primary bg-scanza-primary/5 shadow-scanza-elevated" : "border-scanza-border bg-scanza-surface"}`}
          >
            {plan.highlighted && <span className="mb-3 inline-block rounded-full bg-scanza-primary px-3 py-1 text-xs font-semibold text-white">Most Popular</span>}
            <h2 className="font-display text-xl font-bold text-scanza-text">{plan.name}</h2>
            <p className="mb-4 text-sm text-scanza-text-muted">{plan.description}</p>
            <p className="mb-5">
              <span className="font-display text-3xl font-bold text-scanza-text">{plan.price}</span>
              <span className="text-sm text-scanza-text-muted">{plan.period}</span>
            </p>
            <ul className="mb-6 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-scanza-text">
                  <Check size={15} className="mt-0.5 shrink-0 text-scanza-success" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                plan.highlighted ? "bg-scanza-primary text-white" : "border border-scanza-border text-scanza-text"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
