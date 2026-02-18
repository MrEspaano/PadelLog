"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/core/SignOutButton";
import { NAV_ITEMS } from "@/components/layout/nav";
import { cn } from "@/lib/utils/cn";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-white/80 p-5 backdrop-blur lg:flex lg:flex-col">
      <div className="rounded-xl bg-gradient-to-r from-accent-teal to-accent-purple p-4 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">PadelLog</p>
        <h1 className="mt-1 text-xl font-bold">Träning & Analys</h1>
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
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
