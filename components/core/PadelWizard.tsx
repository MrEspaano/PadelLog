"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createWorkoutWithOptionalPadel } from "@/lib/data/queries";
import { toISODate } from "@/lib/utils/date";

interface WizardState {
  date: string;
  durationMin: number;
  intensity: number | null;
  sessionFormat: string | null;
  partner: string;
  opponents: string;
  results: string;
  feeling: number | null;
  note: string;
  tags: string;
}

const initialState: WizardState = {
  date: toISODate(new Date()),
  durationMin: 90,
  intensity: 3,
  sessionFormat: "match",
  partner: "",
  opponents: "",
  results: "",
  feeling: 3,
  note: "",
  tags: ""
};

const steps = [
  { key: "time", title: "1. Tid", description: "När spelade du och hur länge?", optional: false },
  { key: "intensity", title: "2. Intensitet", description: "Hur hårt var passet?", optional: true },
  { key: "format", title: "3. Speltyp", description: "Vilket format spelade du?", optional: true },
  { key: "partner", title: "4. Partner", description: "Vem spelade du med?", optional: true },
  { key: "opponents", title: "5. Motstånd", description: "Vilka mötte ni?", optional: true },
  { key: "results", title: "6. Resultat", description: "Hur gick det?", optional: true },
  { key: "feeling", title: "7. Känsla", description: "Hur kändes spelet?", optional: true },
  { key: "note", title: "8. Kommentar", description: "Anteckning och taggar", optional: true }
] as const;

function progressWidth(step: number) {
  return `${Math.round(((step + 1) / steps.length) * 100)}%`;
}

export function PadelWizard() {
  const [state, setState] = useState<WizardState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WizardState | null>(null);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const canGoBack = stepIndex > 0;

  const parsedTags = useMemo(
    () =>
      state.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [state.tags]
  );

  function nextStep() {
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  }

  function previousStep() {
    setStepIndex((value) => Math.max(value - 1, 0));
  }

  function skipStep() {
    if (currentStep.key === "intensity") {
      setState((prev) => ({ ...prev, intensity: null }));
    }
    if (currentStep.key === "format") {
      setState((prev) => ({ ...prev, sessionFormat: null }));
    }
    if (currentStep.key === "feeling") {
      setState((prev) => ({ ...prev, feeling: null }));
    }
    nextStep();
  }

  async function saveSession() {
    setSaving(true);
    setError(null);

    try {
      await createWorkoutWithOptionalPadel(
        {
          date: state.date,
          type: "padel",
          duration_min: state.durationMin,
          intensity_1_5: state.intensity,
          feeling_1_5: state.feeling,
          note: state.note.trim() || null
        },
        {
          session_format: state.sessionFormat,
          partner: state.partner.trim() || null,
          opponents: state.opponents.trim() || null,
          results: state.results.trim() || null,
          tags: parsedTags,
          ball_share: null
        }
      );

      setSummary(state);
      setState(initialState);
      setStepIndex(0);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunde inte spara padelpass.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Padel-logg (wizard)</CardTitle>
          <CardDescription>En fråga i taget. Du kan hoppa över valfria steg.</CardDescription>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-accent-teal to-accent-purple transition-all"
              style={{ width: progressWidth(stepIndex) }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.key}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22 }}
              className="rounded-lg border bg-white/80 p-4"
            >
              <p className="text-sm text-muted-foreground">
                Steg {stepIndex + 1}/{steps.length}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{currentStep.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{currentStep.description}</p>

              {currentStep.key === "time" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wizard-date">Datum</Label>
                    <Input
                      id="wizard-date"
                      type="date"
                      value={state.date}
                      onChange={(event) => setState((prev) => ({ ...prev, date: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-duration">Längd (minuter)</Label>
                    <Input
                      id="wizard-duration"
                      type="number"
                      min={15}
                      step={5}
                      value={state.durationMin}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, durationMin: Number(event.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {currentStep.key === "intensity" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-intensity">Intensitet: {state.intensity?.toFixed(1) ?? "-"}</Label>
                  <Input
                    id="wizard-intensity"
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={state.intensity ?? 3}
                    onChange={(event) =>
                      setState((prev) => ({ ...prev, intensity: Number(event.target.value) }))
                    }
                  />
                </div>
              ) : null}

              {currentStep.key === "format" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-format">Speltyp</Label>
                  <Select
                    id="wizard-format"
                    value={state.sessionFormat ?? ""}
                    onChange={(event) =>
                      setState((prev) => ({ ...prev, sessionFormat: event.target.value || null }))
                    }
                  >
                    <option value="">Välj</option>
                    <option value="match">Match</option>
                    <option value="träning">Träning</option>
                    <option value="träningsmatch">Träningsmatch</option>
                    <option value="americano">Americano</option>
                    <option value="vinnarbana">Vinnarbana</option>
                    <option value="vinnarbana split">Vinnarbana split</option>
                    <option value="seriespel">Seriespel</option>
                    <option value="other">Annat</option>
                  </Select>
                </div>
              ) : null}

              {currentStep.key === "partner" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-partner">Partner</Label>
                  <Input
                    id="wizard-partner"
                    placeholder="Namn"
                    value={state.partner}
                    onChange={(event) => setState((prev) => ({ ...prev, partner: event.target.value }))}
                  />
                </div>
              ) : null}

              {currentStep.key === "opponents" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-opponents">Motstånd</Label>
                  <Input
                    id="wizard-opponents"
                    placeholder="Namn 1, Namn 2"
                    value={state.opponents}
                    onChange={(event) => setState((prev) => ({ ...prev, opponents: event.target.value }))}
                  />
                </div>
              ) : null}

              {currentStep.key === "results" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-results">Resultat</Label>
                  <Input
                    id="wizard-results"
                    placeholder="t.ex. 6-4, 4-6, 10-7"
                    value={state.results}
                    onChange={(event) => setState((prev) => ({ ...prev, results: event.target.value }))}
                  />
                </div>
              ) : null}

              {currentStep.key === "feeling" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-feeling">Känsla: {state.feeling?.toFixed(1) ?? "-"}</Label>
                  <Input
                    id="wizard-feeling"
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={state.feeling ?? 3}
                    onChange={(event) => setState((prev) => ({ ...prev, feeling: Number(event.target.value) }))}
                  />
                </div>
              ) : null}

              {currentStep.key === "note" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="wizard-note">Kommentar</Label>
                    <Textarea
                      id="wizard-note"
                      placeholder="Vad fungerade / fungerade inte?"
                      value={state.note}
                      onChange={(event) => setState((prev) => ({ ...prev, note: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-tags">Taggar (kommaseparerat)</Label>
                    <Input
                      id="wizard-tags"
                      placeholder="serve, lob, backhand"
                      value={state.tags}
                      onChange={(event) => setState((prev) => ({ ...prev, tags: event.target.value }))}
                    />
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={previousStep} disabled={!canGoBack || saving}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Tillbaka
            </Button>

            <div className="flex gap-2">
              {currentStep.optional ? (
                <Button variant="ghost" onClick={skipStep} disabled={isLastStep || saving}>
                  Hoppa över
                </Button>
              ) : null}

              {isLastStep ? (
                <Button onClick={() => void saveSession()} disabled={saving || state.durationMin <= 0}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Spara pass
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={saving}>
                  Nästa
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sammanfattning</CardTitle>
          <CardDescription>Visas efter sparning.</CardDescription>
        </CardHeader>
        <CardContent>
          {!summary ? (
            <p className="text-sm text-muted-foreground">Inget sparat pass ännu i denna session.</p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-lg border bg-muted/40 p-4"
            >
              <div className="flex flex-wrap gap-2">
                <Badge>{summary.date}</Badge>
                <Badge variant="secondary">{summary.durationMin} min</Badge>
                <Badge variant="secondary">Intensitet {summary.intensity?.toFixed(1) ?? "-"}</Badge>
                <Badge variant="secondary">Känsla {summary.feeling?.toFixed(1) ?? "-"}</Badge>
              </div>
              <p className="text-sm">
                <span className="font-medium">Format:</span> {summary.sessionFormat || "Ej angivet"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Partner:</span> {summary.partner || "Ej angivet"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Motstånd:</span> {summary.opponents || "Ej angivet"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Resultat:</span> {summary.results || "Ej angivet"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Kommentar:</span> {summary.note || "Ingen"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(summary.tags
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean) || [])
                  .slice(0, 8)
                  .map((tag) => (
                    <Badge key={tag} variant="muted">
                      #{tag}
                    </Badge>
                  ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
