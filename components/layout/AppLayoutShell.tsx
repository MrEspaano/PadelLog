"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

import { LayoutProvider } from "@/components/layout/LayoutProvider";
import { PAGE_TITLES } from "@/components/layout/nav";

interface AppLayoutShellProps extends PropsWithChildren {
  userEmail?: string;
}

export function AppLayoutShell({ children, userEmail }: AppLayoutShellProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "PadelFocus";

  return (
    <LayoutProvider title={title} userEmail={userEmail}>
      {children}
    </LayoutProvider>
  );
}
