"use client";

import { useAuth } from "@/features/auth/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function WithoutAuthLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return children;
}
