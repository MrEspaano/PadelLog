"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/core/SignOutButton";
import { NAV_ITEMS } from "@/components/layout/nav";
import { PadelIcon } from "@/components/padel/PadelIcon";
import { cn } from "@/lib/utils/cn";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="mat-surface sticky top-0 hidden h-screen w-72 shrink-0 border-r border-padel-line/60 bg-white/85 p-5 lg:flex lg:flex-col">
      <div className="relative overflow-hidden rounded-2xl border border-padel-line/60 bg-gradient-to-br from-[#0E4D92] to-[#2F78C6] p-4 text-white shadow-stadium">
        <div className="pointer-events-none absolute inset-0 bg-court-lines opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/12 via-transparent to-black/8" />
        <div className="relative z-10 flex items-center gap-2">
          <PadelIcon mode="logo" className="h-6 w-6 text-white" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">PadelFocus</p>
        </div>
        <h1 className="relative z-10 mt-2 text-xl font-bold">Träning & Analys</h1>
      </div>

      <nav className="mt-6 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "border-padel-line/70 bg-primary text-primary-foreground shadow-glow-blue"
                  : "border-transparent text-muted-foreground hover:border-padel-line/50 hover:bg-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <SignOutButton />
      </div>
    </aside>
  );
}
