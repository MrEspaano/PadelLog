import { LoginPadelBall } from "@/components/padel/LoginPadelBall";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-court-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="auth-grid-lines animate-grid-drift absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/35 dark:from-transparent dark:to-slate-950/40" />

      <div className="pointer-events-none absolute left-[17%] top-1/2 hidden -translate-y-1/2 opacity-[0.4] lg:block dark:opacity-[0.34]">
        <LoginPadelBall className="h-[190px] w-[190px]" />
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <section className="relative z-10 flex w-full max-w-[980px] flex-col items-center">
        <div className="mb-6 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-padel-blue dark:text-padel-blue-soft">PadelFocus</h1>
          <p className="mt-2 text-sm text-foreground/80 dark:text-foreground/75">Analysera ditt spel. Bygg din nivå.</p>
        </div>

        {children}
      </section>
    </main>
  );
}
