"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

import { DesktopLayout } from "@/components/layout/DesktopLayout";
import { MobileLayout } from "@/components/layout/MobileLayout";

interface LayoutProviderProps extends PropsWithChildren {
  title: string;
  userEmail?: string;
}

export function LayoutProvider({ children, title, userEmail }: LayoutProviderProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mediaQuery.matches);

    onChange();
    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  if (isDesktop) {
    return (
      <DesktopLayout title={title} userEmail={userEmail}>
        {children}
      </DesktopLayout>
    );
  }

  return <MobileLayout title={title}>{children}</MobileLayout>;
}
