"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BallAccentBadge } from "@/components/padel/BallAccentBadge";
import { PadelIcon } from "@/components/padel/PadelIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addPainLog, createWorkoutWithOptionalPadel } from "@/lib/data/queries";
import type {
  MatchStatus,
  PainArea,
  PainType,
  UnforcedErrorsLevel,
  WorkoutWithPadel
} from "@/lib/types";
import { toISODate } from "@/lib/utils/date";

interface WizardState {
  date: string;
  durationMin: number;
  intensity: number | null;
  sessionFormat: string | null;
  partner: string;
  opponents: string;
  results: string;
  matchStatus: MatchStatus | null;
  unforcedErrorsLevel: UnforcedErrorsLevel | null;
  feeling: number | null;
  note: string;
  tags: string;
}

interface PainDraft {
  pain_area: PainArea;
  pain_intensity_0_10: number;
  pain_type: PainType | null;
  pain_note: string;
}

const PAIN_AREAS: PainArea[] = ["nacke", "rygg", "axel", "armbåge", "handled", "höft", "knä", "vad", "fot", "annan"];
const PAIN_TYPES: PainType[] = ["stelhet", "skarp", "molande", "domning", "annat"];

const initialPainDraft: PainDraft = {
  pain_area: "annan",
  pain_intensity_0_10: 3,
  pain_type: null,
  pain_note: ""
};

const initialState: WizardState = {
  date: toISODate(new Date()),
  durationMin: 90,
  intensity: 3,
  sessionFormat: "match",
  partner: "",
  opponents: "",
  results: "",
  matchStatus: null,
  unforcedErrorsLevel: null,
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
  { key: "status", title: "7. Matchstatus", description: "Vinst, förlust eller oklart?", optional: true },
  { key: "unforced", title: "8. Mängd unforced", description: "Hur mycket unforced errors blev det?", optional: true },
  { key: "feeling", title: "9. Känsla", description: "Hur kändes spelet?", optional: true },
  { key: "note", title: "10. Kommentar", description: "Anteckning och taggar", optional: true }
] as const;

function progressWidth(step: number) {
  return `${Math.round(((step + 1) / steps.length) * 100)}%`;
}

function unforcedLabel(level: UnforcedErrorsLevel | null) {
  if (level === "low") return "Låg";
  if (level === "medium") return "Mellan";
  if (level === "high") return "Hög";
  return "Ej angivet";
}

function matchStatusLabel(status: MatchStatus | null) {
  if (status === "win") return "Vinst";
  if (status === "loss") return "Förlust";
  if (status === "aborted") return "Avbruten";
  if (status === "unclear") return "Oklart";
  return "Ej angivet";
}

export function PadelWizard() {
  const [state, setState] = useState<WizardState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WizardState | null>(null);
  const [savedWorkout, setSavedWorkout] = useState<WorkoutWithPadel | null>(null);
  const [savedPulse, setSavedPulse] = useState(0);
  const [showSavedPulse, setShowSavedPulse] = useState(false);
  const [showPainPrompt, setShowPainPrompt] = useState(false);
  const [showPainModal, setShowPainModal] = useState(false);
  const [painDrafts, setPainDrafts] = useState<PainDraft[]>([initialPainDraft]);
  const [savingPain, setSavingPain] = useState(false);

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

  useEffect(() => {
    if (savedPulse === 0) return;

    setShowSavedPulse(true);
    const timeout = window.setTimeout(() => setShowSavedPulse(false), 900);
    return () => window.clearTimeout(timeout);
  }, [savedPulse]);

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
    if (currentStep.key === "unforced") {
      setState((prev) => ({ ...prev, unforcedErrorsLevel: null }));
    }
    if (currentStep.key === "status") {
      setState((prev) => ({ ...prev, matchStatus: null }));
    }
    nextStep();
  }

  async function saveSession() {
    setSaving(true);
    setError(null);

    try {
      const createdWorkout = await createWorkoutWithOptionalPadel(
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
          match_status: state.matchStatus,
          unforced_errors_level: state.unforcedErrorsLevel,
          tags: parsedTags,
          ball_share: null
        }
      );

      setSavedWorkout(createdWorkout);
      setSummary(state);
      setState(initialState);
      setStepIndex(0);
      setSavedPulse((value) => value + 1);
      setShowPainPrompt(true);
      setPainDrafts([initialPainDraft]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunde inte spara padelpass.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePainLogs() {
    if (!savedWorkout?.id) {
      setShowPainModal(false);
      return;
    }

    const logs = painDrafts.filter((draft) => draft.pain_intensity_0_10 >= 0 && draft.pain_intensity_0_10 <= 10);

    if (logs.length === 0) {
      setShowPainModal(false);
      setShowPainPrompt(false);
      return;
    }

    setSavingPain(true);
    setError(null);

    try {
      const createdLogs = await Promise.all(
        logs.slice(0, 2).map((draft) =>
          addPainLog(savedWorkout.id, {
            pain_area: draft.pain_area,
            pain_intensity_0_10: draft.pain_intensity_0_10,
            pain_type: draft.pain_type,
            pain_note: draft.pain_note || null
          })
        )
      );

      setSavedWorkout((current) =>
        current
          ? {
              ...current,
              pain_logs: [...createdLogs, ...current.pain_logs]
            }
          : current
      );
      setShowPainModal(false);
      setShowPainPrompt(false);
    } catch (painError) {
      setError(painError instanceof Error ? painError.message : "Kunde inte spara smärtlogg.");
    } finally {
      setSavingPain(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-display">Padel-logg</CardTitle>
              <BallAccentBadge label="Logg" />
            </div>
            <CardDescription>En fråga i taget. Du kan hoppa över valfria steg.</CardDescription>
            <div className="h-2 w-full rounded-full bg-padel-court">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-padel-lime via-padel-blue-soft to-padel-blue transition-all"
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
                className="rounded-xl border border-padel-line/60 bg-white/85 p-4"
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

                {currentStep.key === "status" ? (
                  <div className="space-y-2">
                    <Label htmlFor="wizard-status">Matchstatus</Label>
                    <Select
                      id="wizard-status"
                      value={state.matchStatus ?? ""}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, matchStatus: (event.target.value as MatchStatus) || null }))
                      }
                    >
                      <option value="">Välj status</option>
                      <option value="win">Vinst</option>
                      <option value="loss">Förlust</option>
                      <option value="unclear">Oklart</option>
                      <option value="aborted">Avbruten</option>
                    </Select>
                  </div>
                ) : null}

                {currentStep.key === "unforced" ? (
                  <div className="space-y-2">
                    <Label htmlFor="wizard-unforced">Mängd unforced</Label>
                    <Select
                      id="wizard-unforced"
                      value={state.unforcedErrorsLevel ?? ""}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          unforcedErrorsLevel: (event.target.value as UnforcedErrorsLevel) || null
                        }))
                      }
                    >
                      <option value="">Välj nivå</option>
                      <option value="low">Låg</option>
                      <option value="medium">Mellan</option>
                      <option value="high">Hög</option>
                    </Select>
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

            <AnimatePresence>
              {showSavedPulse ? (
                <motion.div
                  key={`saved-${savedPulse}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-padel-line/60 bg-padel-court p-3 text-sm"
                >
                  Pass sparat. Fortsätt med nästa eller komplettera med smärtlogg.
                </motion.div>
              ) : null}
            </AnimatePresence>

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
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PadelIcon mode="logo" className="mr-2 h-4 w-4" />}
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
                  <span className="font-medium">Status:</span> {matchStatusLabel(summary.matchStatus)}
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
                  <span className="font-medium">Unforced:</span> {unforcedLabel(summary.unforcedErrorsLevel)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Kommentar:</span> {summary.note || "Ingen"}
                </p>

                {savedWorkout?.padel_session?.coach_summary ? (
                  <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Coach Mode</p>
                    <p className="mt-1 text-sm">{savedWorkout.padel_session.coach_summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(savedWorkout.padel_session.coach_tags ?? []).map((tag) => (
                        <Badge key={tag} variant="muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {showPainPrompt ? (
                  <div className="rounded-lg border border-padel-line/60 bg-white p-3">
                    <p className="text-sm font-medium">Vill du logga smärta kopplat till detta pass?</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => setShowPainModal(true)}>
                        Ja
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowPainPrompt(false)}>
                        Nej
                      </Button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {showPainModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Smärtlogg</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPainModal(false)}>
                Stäng
              </Button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">Lägg till upp till två smärtposter för passet.</p>

            <div className="space-y-3">
              {painDrafts.map((draft, index) => (
                <div key={`pain-${index}`} className="rounded-lg border p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <Label>Kroppsdel</Label>
                      <Select
                        value={draft.pain_area}
                        onChange={(event) => {
                          const value = event.target.value as PainArea;
                          setPainDrafts((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, pain_area: value } : entry
                            )
                          );
                        }}
                      >
                        {PAIN_AREAS.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label>Intensitet 0-10</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={draft.pain_intensity_0_10}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setPainDrafts((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, pain_intensity_0_10: value } : entry
                            )
                          );
                        }}
                      />
                    </div>

                    <div>
                      <Label>Typ (valfri)</Label>
                      <Select
                        value={draft.pain_type ?? ""}
                        onChange={(event) => {
                          const value = (event.target.value as PainType) || null;
                          setPainDrafts((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, pain_type: value } : entry
                            )
                          );
                        }}
                      >
                        <option value="">Ingen</option>
                        {PAIN_TYPES.map((painType) => (
                          <option key={painType} value={painType}>
                            {painType}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="mt-2">
                    <Label>Anteckning</Label>
                    <Textarea
                      value={draft.pain_note}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPainDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, pain_note: value } : entry
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (painDrafts.length < 2) {
                    setPainDrafts((current) => [...current, initialPainDraft]);
                  }
                }}
                disabled={painDrafts.length >= 2}
              >
                Lägg till en till
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowPainModal(false)}>
                  Avbryt
                </Button>
                <Button onClick={() => void handleSavePainLogs()} disabled={savingPain}>
                  {savingPain ? "Sparar..." : "Spara smärtlogg"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
