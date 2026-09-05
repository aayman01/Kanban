"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function WithAuthLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "anonymous") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
