"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound } from "lucide-react";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/auth/forgot-password", values);
      Swal.fire({
        icon: "success",
        title: "Check your email",
        text: "If an account exists with that email, a reset code has been sent (or check the auth-service console in development).",
      });
      if (data?.data?.accountId) {
        router.push(`/reset-password?accountId=${data.data.accountId}`);
      }
    } catch {
      Swal.fire({ icon: "error", title: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset code."
      footer={
        <Link href="/login" className="font-medium text-scanza-primary hover:underline">Back to login</Link>
      }
    >
      <div className="mb-5 flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-scanza-primary/10 text-scanza-primary">
          <KeyRound size={24} />
        </span>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
        <button
          type="submit"
          disabled={submitting}
          className="scanza-focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Send Reset Code
        </button>
      </form>
    </AuthCard>
  );
}
