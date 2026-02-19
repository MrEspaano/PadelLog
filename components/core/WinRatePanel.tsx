"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWinRateStats } from "@/lib/data/queries";

type DaysFilter = 30 | 90 | "all";

const FILTERS: Array<{ label: string; value: DaysFilter }> = [
  { label: "30 dagar", value: 30 },
  { label: "90 dagar", value: 90 },
  { label: "Allt", value: "all" }
];

function formatStatus(status: string | null | undefined) {
  if (status === "win") return "W";
  if (status === "loss") return "L";
  return "Oklart";
}

export function WinRatePanel() {
  const [days, setDays] = useState<DaysFilter>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchWinRateStats>> | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const stats = await fetchWinRateStats(days);
        setData(stats);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta vinstprocent.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [days]);

  const totalRate = data?.total.winRate;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Vinstprocent</CardTitle>
            <CardDescription>Total, per partner, per motstånd och senaste matcher.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={String(filter.value)}
                type="button"
                onClick={() => setDays(filter.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  days === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Laddar statistik...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && data ? (
          <>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Total vinstprocent</p>
              <p className="metric-nums text-3xl font-semibold">{totalRate === null ? "-" : `${totalRate.toFixed(1)}%`}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.total.wins} vinster / {data.total.losses} förluster · {data.total.unclear} oklara
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Topp 3 partners (minst 3 matcher)</p>
                {data.partnerWinRate.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Inte tillräckligt med matcher ännu.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {data.partnerWinRate.map((row) => (
                      <div key={row.partner} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{row.partner}</span>
                        <span className="metric-nums font-medium">{row.winRate?.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Motstånd</p>
                {data.opponentWinRate.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Inga matcher med angivet motstånd.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {data.opponentWinRate.slice(0, 5).map((row) => (
                      <div key={row.opponents} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{row.opponents}</span>
                        <span className="metric-nums font-medium">{row.winRate?.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">Senaste 10 matcher</p>
              {data.recentMatches.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Inga matcher loggade ännu.</p>
              ) : (
                <div className="mt-2 grid gap-2">
                  {data.recentMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{match.date}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {match.partner || "-"} vs {match.opponents || "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {match.results ? <span className="hidden text-xs text-muted-foreground sm:inline">{match.results}</span> : null}
                        <Badge variant={match.match_status === "win" ? "secondary" : "muted"}>{formatStatus(match.match_status)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
