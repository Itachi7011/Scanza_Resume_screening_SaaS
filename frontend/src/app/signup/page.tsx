"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2 } from "lucide-react";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { signupSchema, SignupFormValues } from "@/lib/validators";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setSubmitting(true);
    try {
      const payload = { ...values, companyName: isCompany ? values.companyName : undefined };
      const { data } = await axios.post("/api/auth/signup", payload);
      router.push(`/verify-email?accountId=${data.data.accountId}`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Signup failed.";
      Swal.fire({ icon: "error", title: "Couldn't create account", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Get instant resume analysis, saved history, and more."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-scanza-primary hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Full Name" placeholder="Jane Doe" {...register("fullName")} error={errors.fullName?.message} />
        <FormInput label="Email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
        <FormInput label="Password" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />

        <label className="mb-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-scanza-border bg-scanza-bg px-4 py-3 text-sm text-scanza-text">
          <input type="checkbox" checked={isCompany} onChange={(e) => setIsCompany(e.target.checked)} className="h-4 w-4 accent-scanza-primary" />
          <Building2 size={15} className="text-scanza-text-muted" />
          I&apos;m signing up to integrate Scanza into my company&apos;s hiring process
        </label>

        {isCompany && (
          <FormInput label="Company Name" placeholder="Acme Corp" {...register("companyName")} error={errors.companyName?.message} />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="scanza-focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Create Account
        </button>
      </form>
    </AuthCard>
  );
}
