import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
