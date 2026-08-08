"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, User, Lock } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import FormInput from "@/components/auth/FormInput";
import axios from "@/lib/axios";

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordValues>();

  async function onSubmit(values: ChangePasswordValues) {
    setSubmitting(true);
    try {
      await axios.post("/api/auth/change-password", values);
      Swal.fire({ icon: "success", title: "Password updated", timer: 1500, showConfirmButton: false });
      reset();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't update password.";
      Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="animate-scanza-fade-in max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-scanza-text">Profile</h1>

      <div className="mb-6 rounded-2xl border border-scanza-border bg-scanza-surface p-6">
        <div className="mb-4 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-scanza-primary text-lg font-bold text-white">
            {user.fullName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-semibold text-scanza-text">{user.fullName}</p>
            <p className="text-sm text-scanza-text-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-scanza-text-muted">
          <User size={13} /> Role: <span className="font-medium text-scanza-text">{user.role.replace("_", " ")}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-scanza-border bg-scanza-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-scanza-text">
          <Lock size={17} /> Change Password
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Current Password" type="password" {...register("currentPassword", { required: true })} error={errors.currentPassword && "Required"} />
          <FormInput label="New Password" type="password" {...register("newPassword", { required: true, minLength: 8 })} error={errors.newPassword && "At least 8 characters"} />
          <button
            type="submit"
            disabled={submitting}
            className="scanza-focus-ring flex items-center gap-2 rounded-xl bg-scanza-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-scanza-primary-hover disabled:opacity-60"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
