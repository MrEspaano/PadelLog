"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "Byt till ljust läge" : "Byt till mörkt läge"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-10 w-10 rounded-full border-padel-line/80 bg-white/85 text-padel-blue shadow-soft hover:bg-white dark:border-slate-600 dark:bg-slate-900/80 dark:text-padel-lime",
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
