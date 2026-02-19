"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPainStats } from "@/lib/data/queries";

export function PainStatsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPainStats>> | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const stats = await fetchPainStats();
        setData(stats);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta smärtstatistik.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smärtstatistik</CardTitle>
        <CardDescription>Smärta per vecka och mest frekventa områden.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Laddar smärtdata...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && data ? (
          <>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">Smärta per vecka</p>
              {data.weekly.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Inga smärtloggar ännu.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {data.weekly.slice(0, 8).map((row) => (
                    <div key={row.iso_week} className="flex items-center justify-between text-sm">
                      <span>{row.iso_week}</span>
                      <span className="metric-nums">
                        {row.pain_logs} loggar · snitt {Number(row.avg_intensity).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">Mest frekventa områden</p>
              {data.topAreas.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Inga områden ännu.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {data.topAreas.map((area) => (
                    <div key={area.pain_area} className="flex items-center justify-between text-sm">
                      <span>{area.pain_area}</span>
                      <span className="metric-nums font-medium">{area.count}</span>
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
