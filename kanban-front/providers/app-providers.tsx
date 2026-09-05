"use client";

import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/features/auth/auth-provider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>{children}</StoreProvider>
    </AuthProvider>
  );
}
