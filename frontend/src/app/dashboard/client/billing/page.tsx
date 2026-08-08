"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Check } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";

interface BillingInfo {
  planTier: string;
  monthlyQuota: number;
  usedThisCycle: number;
  hasActiveStripeSubscription: boolean;
  isStripeConfigured: boolean;
}

const PLANS = [
  { tier: "STARTER", name: "Starter", price: "$49/mo", quota: "500 resumes/mo" },
  { tier: "GROWTH", name: "Growth", price: "$199/mo", quota: "3,000 resumes/mo" },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  function load() {
    axios.get("/api/app/client/billing").then(({ data }) => setBilling(data.data));
  }
  useEffect(load, []);

  async function handleUpgrade(targetPlan: string) {
    setUpgrading(targetPlan);
    try {
      const { data } = await axios.post("/api/app/client/billing/checkout", { targetPlan });
      if (data.data.mode === "stripe" && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        Swal.fire({ icon: "success", title: "Request received", text: data.data.message });
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't start checkout.";
      Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setUpgrading(null);
    }
  }

  if (!billing) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-scanza-primary" /></div>;
  }

  return (
    <div className="animate-scanza-fade-in max-w-3xl">
      <h1 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold text-scanza-text">
        <CreditCard size={22} className="text-scanza-primary" /> Billing
      </h1>
      <p className="mb-6 text-scanza-text-muted">
        Current plan: <strong className="text-scanza-text">{billing.planTier}</strong> ({billing.usedThisCycle}/{billing.monthlyQuota} used this cycle)
      </p>

      {!billing.isStripeConfigured && (
        <div className="mb-6 rounded-xl border border-scanza-warning/30 bg-scanza-warning/5 p-4 text-sm text-scanza-warning">
          Self-serve checkout isn&apos;t enabled yet — upgrade requests are sent to our team for manual setup, and you&apos;ll hear back by email shortly after requesting.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div key={plan.tier} className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
            <p className="mb-1 font-display text-xl font-bold text-scanza-text">{plan.name}</p>
            <p className="mb-4 text-2xl font-bold text-scanza-primary">{plan.price}</p>
            <p className="mb-4 flex items-center gap-1.5 text-sm text-scanza-text-muted"><Check size={14} className="text-scanza-success" /> {plan.quota}</p>
            <button
              onClick={() => handleUpgrade(plan.tier)}
              disabled={upgrading === plan.tier || billing.planTier === plan.tier}
              className="scanza-focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-50"
            >
              {upgrading === plan.tier && <Loader2 size={15} className="animate-spin" />}
              {billing.planTier === plan.tier ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
