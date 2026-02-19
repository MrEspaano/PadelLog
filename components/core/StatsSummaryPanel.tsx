"use client";

import { Activity, CalendarDays, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsSummaryResponse {
  averages: {
    perWeek: number;
    perMonth: number;
    perYear: number;
  };
  totals: {
    workouts: number;
    wins: number;
    losses: number;
  };
  period: {
    firstDate: string | null;
    lastDate: string | null;
  };
}

function formatPeriod(firstDate: string | null, lastDate: string | null) {
  if (!firstDate || !lastDate) {
    return "Ingen period ännu";
  }
  return `${firstDate} - ${lastDate}`;
}

export function StatsSummaryPanel() {
  const [data, setData] = useState<StatsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/stats/summary", { cache: "no-store" });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Kunde inte hämta statistik.");
        }
        const stats = (await response.json()) as StatsSummaryResponse;
        setData(stats);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta statistik.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Statistik</CardTitle>
          <CardDescription>Snittantal pass per vecka, månad och år samt total vinst/förlust.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Laddar statistik...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs">Pass / vecka</span>
                  </div>
                  <p className="metric-nums text-2xl font-semibold">{data.averages.perWeek}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs">Pass / månad</span>
                  </div>
                  <p className="metric-nums text-2xl font-semibold">{data.averages.perMonth}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs">Pass / år</span>
                  </div>
                  <p className="metric-nums text-2xl font-semibold">{data.averages.perYear}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Totalt pass</span>
                  </div>
                  <p className="metric-nums text-2xl font-semibold">{data.totals.workouts}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs">Vinster</span>
                  </div>
                  <p className="metric-nums text-2xl font-semibold text-emerald-700 dark:text-emerald-400">{data.totals.wins}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4 text-red-600" />
                    <span className="text-xs">Förluster</span>
                  </div>
                  <p className="metric-nums text-2xl font-semibold text-red-700 dark:text-red-400">{data.totals.losses}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Period:</span>
                <Badge variant="muted">{formatPeriod(data.period.firstDate, data.period.lastDate)}</Badge>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
