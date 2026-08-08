"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/lib/validators";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitting(true);
    try {
      await axios.post("/api/auth/reset-password", { accountId, code: values.code, newPassword: values.newPassword });
      Swal.fire({ icon: "success", title: "Password reset!", text: "Please log in with your new password.", timer: 2000, showConfirmButton: false });
      router.push("/login");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Reset failed.";
      Swal.fire({ icon: "error", title: "Couldn't reset password", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Set a new password" subtitle="Enter the code we sent you along with your new password.">
      <div className="mb-5 flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-scanza-primary/10 text-scanza-primary">
          <ShieldCheck size={24} />
        </span>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Reset Code" placeholder="123456" maxLength={6} {...register("code")} error={errors.code?.message} />
        <FormInput label="New Password" type="password" placeholder="••••••••" {...register("newPassword")} error={errors.newPassword?.message} />
        <button
          type="submit"
          disabled={submitting}
          className="scanza-focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Reset Password
        </button>
      </form>
    </AuthCard>
  );
}
