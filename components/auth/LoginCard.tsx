"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const next = searchParams.get("next") || "/dashboard";
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: next
    });

    if (result?.error) {
      setError("Fel e-post eller lösenord.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
    setLoading(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
      <Card className="w-full max-w-[480px] rounded-2xl border border-padel-line/70 bg-white/88 p-0 shadow-stadium backdrop-blur-md dark:bg-slate-900/72 dark:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)]">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="font-display text-2xl">Logga in</CardTitle>
          <CardDescription>Fortsätt till din tränings- och padelanalys.</CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-2">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="focus-visible:ring-padel-blue dark:focus-visible:ring-padel-blue-soft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10 focus-visible:ring-padel-blue dark:focus-visible:ring-padel-blue-soft"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <Button type="submit" className="primary-bounce w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Loggar in..." : "Logga in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Inget konto?{" "}
              <Link href="/signup" className="font-semibold text-primary underline-offset-2 hover:underline">
                Skapa konto
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
