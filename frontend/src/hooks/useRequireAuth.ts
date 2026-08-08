"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AccountRole } from "@/context/AuthContext";

export function useRequireAuth(allowedRoles?: AccountRole[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, allowedRoles, router]);

  return { user, isLoading };
}
