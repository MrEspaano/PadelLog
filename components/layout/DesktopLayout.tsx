import type { PropsWithChildren } from "react";

import { DesktopSidebar } from "@/components/desktop/DesktopSidebar";
import { DesktopTopbar } from "@/components/desktop/DesktopTopbar";

interface DesktopLayoutProps extends PropsWithChildren {
  title: string;
  userEmail?: string;
}

export function DesktopLayout({ children, title, userEmail }: DesktopLayoutProps) {
  return (
    <div className="hidden min-h-screen lg:flex">
      <DesktopSidebar />
      <div className="flex-1 p-6">
        <DesktopTopbar title={title} userEmail={userEmail} />
        <main>{children}</main>
      </div>
    </div>
  );
}
