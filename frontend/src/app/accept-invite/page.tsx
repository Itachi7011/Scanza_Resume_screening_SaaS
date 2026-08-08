"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Users } from "lucide-react";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

interface AcceptInviteValues {
  fullName: string;
  password: string;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("inviteId") ?? "";
  const token = searchParams.get("token") ?? "";
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AcceptInviteValues>();

  async function onSubmit(values: AcceptInviteValues) {
    setSubmitting(true);
    try {
      await axios.post("/api/auth/accept-invite", { inviteId, token, ...values });
      await refresh();
      Swal.fire({ icon: "success", title: "Welcome aboard!", timer: 1500, showConfirmButton: false });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't accept this invite.";
      Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (!inviteId || !token) {
    return (
      <AuthCard title="Invalid invite link" subtitle="This invite link is missing required information.">
        <p className="text-center text-sm text-scanza-text-muted">Ask your workspace owner to resend the invite.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="You've been invited!" subtitle="Set your name and password to join the workspace.">
      <div className="mb-5 flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-scanza-primary/10 text-scanza-primary">
          <Users size={24} />
        </span>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput label="Full Name" placeholder="Jane Doe" {...register("fullName", { required: true, minLength: 2 })} error={errors.fullName && "Required"} />
        <FormInput label="Password" type="password" placeholder="••••••••" {...register("password", { required: true, minLength: 8 })} error={errors.password && "At least 8 characters"} />
        <button
          type="submit"
          disabled={submitting}
          className="scanza-focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Accept & Join
        </button>
      </form>
    </AuthCard>
  );
}
