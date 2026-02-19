"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, ArrowRight, Scale, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BallAccentBadge } from "@/components/padel/BallAccentBadge";
import { CourtDivider } from "@/components/padel/CourtDivider";
import { PadelIcon } from "@/components/padel/PadelIcon";
import { WeekGrid } from "@/components/core/WeekGrid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWeights, fetchWinRateStats, fetchWorkouts } from "@/lib/data/queries";
import type { WeightEntry, WorkoutWithPadel } from "@/lib/types";

const quickLinks = [
  { href: "/padel", title: "Logga padelpass", description: "Stegvis loggning, en fråga i taget", icon: Activity },
  { href: "/weights", title: "Uppdatera vikt", description: "Söndagsfokus + snabbknapp idag", icon: Scale },
  { href: "/coach", title: "Öppna statistik", description: "Vinstprocent, smärttrender och coach", icon: Sparkles }
];

function toSafeNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function DashboardOverview() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutWithPadel[]>([]);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [weightsResult, workoutsResult, winRateResult] = await Promise.allSettled([
        fetchWeights(),
        fetchWorkouts(),
        fetchWinRateStats(30)
      ]);

      const coreErrors: string[] = [];

      if (weightsResult.status === "fulfilled") {
        setWeights(weightsResult.value);
      } else {
        coreErrors.push("vikt");
      }

      if (workoutsResult.status === "fulfilled") {
        setWorkouts(workoutsResult.value);
      } else {
        coreErrors.push("pass");
      }

      if (winRateResult.status === "fulfilled") {
        setWinRate(winRateResult.value.total.winRate ?? null);
      } else {
        setWinRate(null);
      }

      if (coreErrors.length > 0) {
        setError("Kunde inte läsa all dashboard-data just nu.");
      }

      setLoading(false);
    }

    void load();
  }, []);

  const lastWeight = toSafeNumber(weights[0]?.weight_kg);

  const lastSevenDays = useMemo(() => {
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(today.getDate() - 7);

    return workouts.filter((workout) => new Date(workout.date) >= threshold);
  }, [workouts]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-padel-line/70 bg-gradient-to-r from-[#0E4D92] to-[#2F78C6] p-5 text-white shadow-stadium">
        <div className="pointer-events-none absolute inset-0 bg-court-lines opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/12 via-transparent to-black/10" />
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-white/5 to-transparent md:block" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <PadelIcon mode="logo" className="h-6 w-6 text-white" />
              <BallAccentBadge label="Padel Focus" className="border-white/30 bg-white/12 text-white" />
            </div>
            <h3 className="font-display text-2xl font-semibold">Bygg form med tydlig matchdata</h3>
            <p className="mt-1 text-sm text-white/85">Följ intensitet, känsla och resultat med samma precision som på banan.</p>
          </div>
          <Link
            href="/padel"
            className="inline-flex items-center gap-2 rounded-xl border border-white/45 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
          >
            Logga nytt pass
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardHeader className="space-y-1 pb-3">
              <CardDescription>Senaste vikt</CardDescription>
              <CardTitle className="metric-nums">{lastWeight ? `${lastWeight.toFixed(1)} kg` : "Ingen data"}</CardTitle>
              <BallAccentBadge label="Statistik" className="w-fit" />
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <Card>
            <CardHeader className="space-y-1 pb-3">
              <CardDescription>Pass senaste 7 dagar</CardDescription>
              <CardTitle className="metric-nums">{loading ? "..." : lastSevenDays.length}</CardTitle>
              <BallAccentBadge label="Volym" className="w-fit" />
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <Card>
            <CardHeader className="space-y-1 pb-3">
              <CardDescription>Vinstprocent (30 dagar)</CardDescription>
              <CardTitle className="metric-nums">{winRate === null ? "Ingen data" : `${winRate.toFixed(1)}%`}</CardTitle>
              <BallAccentBadge label="Analys" className="w-fit" />
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      <CourtDivider />

      <div className="grid gap-3 md:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-2xl border border-padel-line/60 bg-white/85 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-blue"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-padel-court text-padel-blue">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">{link.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
              <Badge className="mt-3">Öppna</Badge>
              <div className="absolute inset-x-4 bottom-0 h-0.5 scale-x-0 bg-gradient-to-r from-padel-lime via-padel-blue-soft to-padel-lime transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {workouts.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Inga pass loggade än. Starta med ditt första padelpass.</p>
              <BallAccentBadge label="Tomt läge" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <WeekGrid />
    </div>
  );
}
