import type { PropsWithChildren } from "react";

import { SignOutButton } from "@/components/core/SignOutButton";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

interface MobileLayoutProps extends PropsWithChildren {
  title: string;
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  return (
    <div className="min-h-screen lg:hidden">
      <MobileHeader title={title} />
      <div className="px-4 pb-24">
        <div className="mb-3 flex justify-end">
          <SignOutButton />
        </div>
        <main>{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
