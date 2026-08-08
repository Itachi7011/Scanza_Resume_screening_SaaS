"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { loginSchema, LoginFormValues } from "@/lib/validators";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      await axios.post("/api/auth/login", values);
      await refresh();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed.";
      Swal.fire({ icon: "error", title: "Couldn't log in", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see your saved resumes and analysis history."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-scanza-primary hover:underline">Sign up</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
        <FormInput label="Password" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />

        <div className="mb-5 text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-scanza-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="scanza-focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Log In
        </button>
      </form>
    </AuthCard>
  );
}
