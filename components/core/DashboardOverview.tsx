"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { WeekGrid } from "@/components/core/WeekGrid";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeCriticalCoach } from "@/lib/analysis/criticalCoach";
import { fetchLatestPadelSessions, fetchWeights, fetchWorkouts } from "@/lib/data/queries";
import type { WeightEntry, WorkoutWithPadel } from "@/lib/types";

const quickLinks = [
  { href: "/padel", title: "Logga padelpass", description: "Stegvis loggning, en fråga i taget" },
  { href: "/weights", title: "Uppdatera vikt", description: "Söndagsfokus + snabbknapp idag" },
  { href: "/workouts", title: "Analysera passlogg", description: "Filter, datagrid och export" }
];

export function DashboardOverview() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutWithPadel[]>([]);
  const [padel, setPadel] = useState<WorkoutWithPadel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [fetchedWeights, fetchedWorkouts, fetchedPadel] = await Promise.all([
          fetchWeights(),
          fetchWorkouts(),
          fetchLatestPadelSessions(10)
        ]);

        setWeights(fetchedWeights);
        setWorkouts(fetchedWorkouts);
        setPadel(fetchedPadel);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte läsa dashboard-data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const lastWeight = weights[0]?.weight_kg ?? null;

  const lastSevenDays = useMemo(() => {
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(today.getDate() - 7);

    return workouts.filter((workout) => new Date(workout.date) >= threshold);
  }, [workouts]);

  const coachInsight = useMemo(() => analyzeCriticalCoach(padel.slice(0, 6)), [padel]);
  const coachKpi = coachInsight?.kpiValue && !coachInsight.kpiValue.includes("NaN")
    ? coachInsight.kpiValue
    : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Senaste vikt</CardDescription>
            <CardTitle>{lastWeight ? `${lastWeight.toFixed(1)} kg` : "Ingen data"}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pass senaste 7 dagar</CardDescription>
            <CardTitle>{loading ? "..." : lastSevenDays.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coach-KPI</CardDescription>
            <CardTitle>{coachKpi ?? "Behöver fler pass"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-xl border bg-white/70 p-4 transition hover:bg-white">
            <p className="text-sm font-semibold">{link.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
            <Badge className="mt-3">Öppna</Badge>
          </Link>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <WeekGrid />
    </div>
  );
}
