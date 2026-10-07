"use client";

import { useAuth } from "@/components/AuthProvider";
import { isOnboarded } from "@/lib/prefs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RequireAuth({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "app" | "onboarding";
}) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const onboarded = isOnboarded();
    if (mode === "app" && !onboarded) {
      router.replace("/onboarding");
      return;
    }
    if (mode === "onboarding" && onboarded) {
      router.replace("/");
      return;
    }
    setAllowed(true);
  }, [ready, user, mode, router]);

  if (!allowed) {
    return <p className="px-4 py-16 text-sm text-muted md:px-10">로그인 상태를 확인하는 중…</p>;
  }

  return children;
}
