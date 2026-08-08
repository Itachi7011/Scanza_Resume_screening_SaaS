"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";
import Swal from "sweetalert2";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { loginSchema, LoginFormValues } from "@/lib/validators";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      await axios.post("/api/auth/admin/login", values);
      await refresh();
      router.push("/admin");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed.";
      Swal.fire({ icon: "error", title: "Access denied", text: message, confirmButtonColor: "#dc2626" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-scanza-bg px-4" data-theme="dark">
      <div className="w-full max-w-md rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-elevated">
        <div className="mb-6 flex flex-col items-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-scanza-danger/10 text-scanza-danger">
            <ShieldAlert size={26} />
          </span>
          <h1 className="font-display text-xl font-bold text-scanza-text">Administrator Access</h1>
          <p className="mt-1 text-center text-xs text-scanza-text-muted">
            This area is restricted to authorized Scanza personnel. All access attempts are logged.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Admin Email" type="email" placeholder="admin@scanza.dev" {...register("email")} error={errors.email?.message} />
          <FormInput label="Password" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />

          <button
            type="submit"
            disabled={submitting}
            className="scanza-focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-danger py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Secure Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
