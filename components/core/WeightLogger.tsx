"use client";

import { subDays } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { WeightTrendChart } from "@/components/core/WeightTrendChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createWeight, fetchWeights } from "@/lib/data/queries";
import type { WeightEntry } from "@/lib/types";
import { formatSwedishDate, getDefaultSunday, parseISODate, toISODate } from "@/lib/utils/date";

function calculateWeeklyDelta(entries: WeightEntry[]) {
  if (entries.length < 2) {
    return null;
  }

  const latest = entries[0];
  const latestDate = parseISODate(latest.date);
  const threshold = subDays(latestDate, 6);

  const lastWeek = entries.find((entry) => parseISODate(entry.date) <= threshold) ?? entries[1];
  const delta = latest.weight_kg - lastWeek.weight_kg;

  return {
    delta,
    latest,
    reference: lastWeek
  };
}

export function WeightLogger() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(getDefaultSunday());
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");

  const weeklyDelta = useMemo(() => calculateWeeklyDelta(entries), [entries]);

  async function loadWeights() {
    setLoading(true);
    setError(null);

    try {
      const weightEntries = await fetchWeights();
      setEntries(weightEntries);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta viktdata.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWeights();
  }, []);

  async function saveWeight(targetDate = date) {
    const weightNumber = Number(weight);

    if (!weightNumber || Number.isNaN(weightNumber)) {
      setError("Ange en giltig vikt.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createWeight({
        date: targetDate,
        weight_kg: weightNumber,
        note: note.trim() || null
      });

      setWeight("");
      setNote("");
      setDate(getDefaultSunday());
      await loadWeights();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunde inte spara vikt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Viktlogg</CardTitle>
          <CardDescription>Standarddatum är söndag. Logga veckovikten eller dagens vikt snabbt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight-date">Datum</Label>
              <Input
                id="weight-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight-value">Vikt (kg)</Label>
              <Input
                id="weight-value"
                type="number"
                step="0.1"
                placeholder="84.5"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight-note">Kommentar (valfri)</Label>
            <Textarea
              id="weight-note"
              placeholder="Sömn, känsla, återhämtning..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveWeight()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Spara vägning
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const today = toISODate(new Date());
                setDate(today);
                void saveWeight(today);
              }}
              disabled={saving}
            >
              Logga vikt idag
            </Button>
          </div>

          {weeklyDelta ? (
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-sm text-muted-foreground">Förändring sedan förra veckan</p>
              <p className="text-xl font-semibold">
                {weeklyDelta.delta > 0 ? "+" : ""}
                {weeklyDelta.delta.toFixed(1)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                {formatSwedishDate(weeklyDelta.reference.date)} → {formatSwedishDate(weeklyDelta.latest.date)}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
          <CardDescription>Utveckling över tid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Laddar...</p> : <WeightTrendChart entries={entries} />}

          <AnimatePresence>
            {entries.slice(0, 5).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{formatSwedishDate(entry.date)}</p>
                  {entry.note ? <p className="text-xs text-muted-foreground">{entry.note}</p> : null}
                </div>
                <Badge>{entry.weight_kg.toFixed(1)} kg</Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
