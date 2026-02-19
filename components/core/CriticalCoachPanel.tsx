"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { analyzeCriticalCoach } from "@/lib/analysis/criticalCoach";
import { fetchLatestPadelSessions } from "@/lib/data/queries";
import type { WorkoutWithPadel } from "@/lib/types";

export function CriticalCoachPanel() {
  const [sessions, setSessions] = useState<WorkoutWithPadel[]>([]);
  const [windowSize, setWindowSize] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchLatestPadelSessions(10);
        setSessions(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta padelpass.");
      } finally {
        setLoading(false);
      }
    }

    void loadSessions();
  }, []);

  const scoped = sessions.slice(0, Math.min(windowSize, sessions.length));
  const insight = useMemo(() => analyzeCriticalCoach(scoped), [scoped]);
  const hasValidInsight = Boolean(insight);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kritisk Coach</CardTitle>
        <CardDescription>
          Analys av senaste 3–10 padelpass med mönster och alternativa tolkningar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Analysfönster</span>
          <Select value={String(windowSize)} onChange={(event) => setWindowSize(Number(event.target.value))}>
            {Array.from({ length: 8 }, (_, index) => index + 3).map((value) => (
              <option key={value} value={value}>
                Senaste {value}
              </option>
            ))}
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Laddar coachdata...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && !hasValidInsight ? (
          <p className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
            Minst 3 padelpass krävs för kritisk analys.
          </p>
        ) : null}

        {hasValidInsight && insight ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-gradient-to-r from-accent-teal/10 to-accent-purple/10 p-4">
              <p className="text-sm text-muted-foreground">{insight.metricTitle}</p>
              <p className="text-2xl font-semibold">{insight.metricValue}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">Identifierat mönster</p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.pattern}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">Alternativa tolkningar</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>{insight.alternatives[0]}</li>
                <li>{insight.alternatives[1]}</li>
              </ul>
            </div>

            <div className="rounded-lg border border-secondary/40 bg-secondary/5 p-4">
              <p className="text-sm font-semibold">Coachens utmaning</p>
              <p className="mt-1 text-sm">{insight.challenge}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-semibold">Pass i analysen ({scoped.length})</p>
          {scoped.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga pass ännu.</p>
          ) : (
            scoped.map((session) => (
              <div key={session.id} className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="muted">{session.date}</Badge>
                <Badge variant="muted">Int {session.intensity_1_5 ?? "-"}</Badge>
                <Badge variant="muted">Känsla {session.feeling_1_5 ?? "-"}</Badge>
                <Badge variant="muted">{session.padel_session?.results || "Inget resultat"}</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
