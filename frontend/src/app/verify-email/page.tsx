"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { otpSchema, OtpFormValues } from "@/lib/validators";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? "";
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });

  async function onSubmit(values: OtpFormValues) {
    setSubmitting(true);
    try {
      await axios.post("/api/auth/verify-email", { accountId, code: values.code });
      await refresh();
      Swal.fire({ icon: "success", title: "Email verified!", timer: 1500, showConfirmButton: false });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Verification failed.";
      Swal.fire({ icon: "error", title: "Invalid code", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await axios.post("/api/auth/resend-otp", { accountId });
      Swal.fire({ icon: "success", title: "Code resent", text: "Check your email (or the server console in development).", timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Couldn't resend code" });
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent you. In development without SendGrid configured, check the auth-service console output."
    >
      <div className="mb-5 flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-scanza-primary/10 text-scanza-primary">
          <MailCheck size={24} />
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Verification Code"
          placeholder="123456"
          maxLength={6}
          {...register("code")}
          error={errors.code?.message}
          className="scanza-focus-ring w-full rounded-xl border border-scanza-border bg-scanza-bg px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-scanza-text outline-none focus:border-scanza-primary"
        />

        <button
          type="submit"
          disabled={submitting}
          className="scanza-focus-ring mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Verify Email
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full text-center text-sm font-medium text-scanza-primary hover:underline disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
      </form>
    </AuthCard>
  );
}
