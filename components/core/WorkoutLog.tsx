"use client";

import { subDays } from "date-fns";
import { Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ExcelExportButton } from "@/components/core/ExcelExportButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { deleteWorkout, fetchWorkouts, updateWorkoutWithOptionalPadel } from "@/lib/data/queries";
import type { MatchStatus, UnforcedErrorsLevel, WorkoutType, WorkoutWithPadel } from "@/lib/types";
import { toISODate } from "@/lib/utils/date";

type EditForm = {
  id: string;
  date: string;
  type: WorkoutType;
  duration_min: string;
  intensity_1_5: string;
  feeling_1_5: string;
  note: string;
  session_format: string;
  partner: string;
  opponents: string;
  results: string;
  match_status: MatchStatus | "";
  unforced_errors_level: UnforcedErrorsLevel | "";
};

function intensityOptions() {
  return Array.from({ length: 9 }, (_, index) => (index + 2) / 2);
}

function formatUnforcedLevel(value: string | null | undefined) {
  if (value === "low") return "Låg";
  if (value === "medium") return "Mellan";
  if (value === "high") return "Hög";
  return "-";
}

function formatMatchStatus(value: string | null | undefined) {
  if (value === "win") return "Vinst";
  if (value === "loss") return "Förlust";
  if (value === "aborted") return "Avbruten";
  return "Oklart";
}

function truncateCoachSummary(summary: string | null | undefined) {
  if (!summary) return null;
  if (summary.length <= 72) return summary;
  return `${summary.slice(0, 72)}...`;
}

function sortWorkouts(items: WorkoutWithPadel[], sort: string) {
  return [...items].sort((a, b) => {
    if (sort === "date-asc") {
      return a.date.localeCompare(b.date);
    }
    if (sort === "intensity-desc") {
      return (b.intensity_1_5 ?? 0) - (a.intensity_1_5 ?? 0);
    }
    if (sort === "feeling-desc") {
      return (b.feeling_1_5 ?? 0) - (a.feeling_1_5 ?? 0);
    }
    return b.date.localeCompare(a.date);
  });
}

function createEditForm(workout: WorkoutWithPadel): EditForm {
  return {
    id: workout.id,
    date: workout.date,
    type: workout.type,
    duration_min: String(workout.duration_min),
    intensity_1_5: workout.intensity_1_5 == null ? "" : String(workout.intensity_1_5),
    feeling_1_5: workout.feeling_1_5 == null ? "" : String(workout.feeling_1_5),
    note: workout.note ?? "",
    session_format: workout.padel_session?.session_format ?? "",
    partner: workout.padel_session?.partner ?? "",
    opponents: workout.padel_session?.opponents ?? "",
    results: workout.padel_session?.results ?? "",
    match_status: workout.padel_session?.match_status ?? "",
    unforced_errors_level: workout.padel_session?.unforced_errors_level ?? ""
  };
}

export function WorkoutLog() {
  const [workouts, setWorkouts] = useState<WorkoutWithPadel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [minIntensity, setMinIntensity] = useState("");
  const [minFeeling, setMinFeeling] = useState("");
  const [tags, setTags] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const [exportStart, setExportStart] = useState(toISODate(subDays(new Date(), 30)));
  const [exportEnd, setExportEnd] = useState(toISODate(new Date()));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta passlogg.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    const normalizedTags = tags.toLowerCase().trim();

    const base = workouts.filter((workout) => {
      if (type !== "all" && workout.type !== type) {
        return false;
      }

      if (minIntensity && (workout.intensity_1_5 ?? 0) < Number(minIntensity)) {
        return false;
      }

      if (minFeeling && (workout.feeling_1_5 ?? 0) < Number(minFeeling)) {
        return false;
      }

      if (normalizedTags) {
        const workoutTags = workout.padel_session?.tags ?? [];
        const hasTag = workoutTags.some((tag) => tag.toLowerCase().includes(normalizedTags));
        if (!hasTag) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        workout.note,
        workout.padel_session?.partner,
        workout.padel_session?.opponents,
        workout.padel_session?.results,
        workout.type
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });

    return sortWorkouts(base, sortBy);
  }, [minFeeling, minIntensity, search, sortBy, tags, type, workouts]);

  const exportRows = useMemo(
    () => filtered.filter((workout) => workout.date >= exportStart && workout.date <= exportEnd),
    [exportEnd, exportStart, filtered]
  );

  function updateEditField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function startEdit(workout: WorkoutWithPadel) {
    setError(null);
    setEditForm(createEditForm(workout));
  }

  function cancelEdit() {
    setEditForm(null);
  }

  async function saveEdit() {
    if (!editForm) {
      return;
    }

    const duration = Number(editForm.duration_min);
    if (!editForm.date || !Number.isFinite(duration) || duration <= 0) {
      setError("Datum och giltig duration krävs.");
      return;
    }

    setSavingId(editForm.id);
    setError(null);

    try {
      const updated = await updateWorkoutWithOptionalPadel(
        editForm.id,
        {
          date: editForm.date,
          type: editForm.type,
          duration_min: duration,
          intensity_1_5: editForm.intensity_1_5 === "" ? null : Number(editForm.intensity_1_5),
          feeling_1_5: editForm.feeling_1_5 === "" ? null : Number(editForm.feeling_1_5),
          note: editForm.note || null
        },
        editForm.type === "padel"
          ? {
              session_format: editForm.session_format || null,
              partner: editForm.partner || null,
              opponents: editForm.opponents || null,
              results: editForm.results || null,
              match_status: editForm.match_status || null,
              unforced_errors_level: editForm.unforced_errors_level || null
            }
          : undefined
      );

      setWorkouts((current) => current.map((workout) => (workout.id === updated.id ? updated : workout)));
      setEditForm(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunde inte spara ändringar.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteWorkout(workoutId: string) {
    const confirmed = window.confirm("Ta bort detta pass permanent?");
    if (!confirmed) {
      return;
    }

    setDeletingId(workoutId);
    setError(null);

    try {
      await deleteWorkout(workoutId);
      setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
      if (editForm?.id === workoutId) {
        setEditForm(null);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Kunde inte ta bort passet.");
    } finally {
      setDeletingId(null);
    }
  }

  const isEditing = (workoutId: string) => editForm?.id === workoutId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passlogg</CardTitle>
        <CardDescription>Filter, sortering, sök, redigering och Excel-export.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök i anteckningar/resultat"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Alla typer</option>
            <option value="padel">Padel</option>
            <option value="running">Löpning</option>
            <option value="strength">Styrka</option>
            <option value="other">Övrigt</option>
          </Select>

          <Select value={minIntensity} onChange={(event) => setMinIntensity(event.target.value)}>
            <option value="">Intensitet (alla)</option>
            {intensityOptions().map((value) => (
              <option key={value} value={value}>
                Min {value}
              </option>
            ))}
          </Select>

          <Select value={minFeeling} onChange={(event) => setMinFeeling(event.target.value)}>
            <option value="">Känsla (alla)</option>
            {intensityOptions().map((value) => (
              <option key={value} value={value}>
                Min {value}
              </option>
            ))}
          </Select>

          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="date-desc">Nyast först</option>
            <option value="date-asc">Äldst först</option>
            <option value="intensity-desc">Högst intensitet</option>
            <option value="feeling-desc">Högst känsla</option>
          </Select>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <Input placeholder="Taggfilter (ex. lob)" value={tags} onChange={(event) => setTags(event.target.value)} />
          <Input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} />
          <Input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} />
          <ExcelExportButton workouts={exportRows} startDate={exportStart} endDate={exportEnd} />
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Laddar pass...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="hidden rounded-lg border lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Tid</TableHead>
                <TableHead>Intensitet</TableHead>
                <TableHead>Känsla</TableHead>
                <TableHead>Padelinfo</TableHead>
                <TableHead>Kommentar</TableHead>
                <TableHead className="text-right">Åtgärd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Inga pass matchar filtren.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((workout) => {
                  if (isEditing(workout.id) && editForm) {
                    return (
                      <TableRow key={workout.id}>
                        <TableCell colSpan={8}>
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <Input type="date" value={editForm.date} onChange={(event) => updateEditField("date", event.target.value)} />
                            <Select value={editForm.type} onChange={(event) => updateEditField("type", event.target.value as WorkoutType)}>
                              <option value="padel">Padel</option>
                              <option value="running">Löpning</option>
                              <option value="strength">Styrka</option>
                              <option value="other">Övrigt</option>
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              placeholder="Duration (min)"
                              value={editForm.duration_min}
                              onChange={(event) => updateEditField("duration_min", event.target.value)}
                            />
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              step={0.5}
                              placeholder="Intensitet"
                              value={editForm.intensity_1_5}
                              onChange={(event) => updateEditField("intensity_1_5", event.target.value)}
                            />
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              step={0.5}
                              placeholder="Känsla"
                              value={editForm.feeling_1_5}
                              onChange={(event) => updateEditField("feeling_1_5", event.target.value)}
                            />
                            {editForm.type === "padel" ? (
                              <>
                                <Input placeholder="Format" value={editForm.session_format} onChange={(event) => updateEditField("session_format", event.target.value)} />
                                <Input placeholder="Partner" value={editForm.partner} onChange={(event) => updateEditField("partner", event.target.value)} />
                                <Input placeholder="Motstånd" value={editForm.opponents} onChange={(event) => updateEditField("opponents", event.target.value)} />
                                <Input placeholder="Resultat" value={editForm.results} onChange={(event) => updateEditField("results", event.target.value)} />
                                <Select value={editForm.match_status} onChange={(event) => updateEditField("match_status", event.target.value as MatchStatus | "")}>
                                  <option value="">Status</option>
                                  <option value="win">Vinst</option>
                                  <option value="loss">Förlust</option>
                                  <option value="unclear">Oklart</option>
                                  <option value="aborted">Avbruten</option>
                                </Select>
                                <Select
                                  value={editForm.unforced_errors_level}
                                  onChange={(event) => updateEditField("unforced_errors_level", event.target.value as UnforcedErrorsLevel | "")}
                                >
                                  <option value="">Unforced</option>
                                  <option value="low">Låg</option>
                                  <option value="medium">Mellan</option>
                                  <option value="high">Hög</option>
                                </Select>
                              </>
                            ) : null}
                            <div className="xl:col-span-4">
                              <Textarea
                                placeholder="Kommentar"
                                className="min-h-[70px]"
                                value={editForm.note}
                                onChange={(event) => updateEditField("note", event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={savingId === workout.id}>
                              Avbryt
                            </Button>
                            <Button size="sm" onClick={() => void saveEdit()} disabled={savingId === workout.id}>
                              {savingId === workout.id ? "Sparar..." : "Spara"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={workout.id}>
                      <TableCell>{workout.date}</TableCell>
                      <TableCell>
                        <Badge>{workout.type}</Badge>
                      </TableCell>
                      <TableCell>{workout.duration_min} min</TableCell>
                      <TableCell>{workout.intensity_1_5 ?? "-"}</TableCell>
                      <TableCell>{workout.feeling_1_5 ?? "-"}</TableCell>
                      <TableCell>
                        {workout.padel_session ? (
                          <div className="space-y-1 text-xs">
                            <p>Partner: {workout.padel_session.partner || "-"}</p>
                            <p>Motstånd: {workout.padel_session.opponents || "-"}</p>
                            <p>Resultat: {workout.padel_session.results || "-"}</p>
                            <p>Status: {formatMatchStatus(workout.padel_session.match_status)}</p>
                            <p>Unforced: {formatUnforcedLevel(workout.padel_session.unforced_errors_level)}</p>
                            {workout.padel_session.coach_summary ? (
                              <p className="text-primary">Coach: {truncateCoachSummary(workout.padel_session.coach_summary)}</p>
                            ) : null}
                            {workout.pain_logs.length > 0 ? (
                              <p>Smärta: {workout.pain_logs.map((log) => `${log.pain_area} (${log.pain_intensity_0_10}/10)`).join(", ")}</p>
                            ) : null}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{workout.note || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(workout)} disabled={deletingId === workout.id}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Redigera
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDeleteWorkout(workout.id)}
                            disabled={deletingId === workout.id}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {deletingId === workout.id ? "Tar bort..." : "Ta bort"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2 lg:hidden">
          {filtered.length === 0 ? (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">Inga pass matchar filtren.</p>
          ) : (
            filtered.map((workout) => (
              <div key={workout.id} className="rounded-lg border bg-white/80 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">{workout.date}</p>
                  <Badge>{workout.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {workout.duration_min} min · Int {workout.intensity_1_5 ?? "-"} · Känsla {workout.feeling_1_5 ?? "-"}
                </p>
                {workout.padel_session?.results ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Resultat:</span> {workout.padel_session.results}
                  </p>
                ) : null}
                {workout.padel_session ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Status:</span> {formatMatchStatus(workout.padel_session.match_status)}
                  </p>
                ) : null}
                {workout.padel_session ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Mängd unforced:</span> {formatUnforcedLevel(workout.padel_session.unforced_errors_level)}
                  </p>
                ) : null}
                {workout.padel_session?.coach_summary ? (
                  <p className="mt-2 text-sm text-primary">
                    <span className="font-medium">Coach:</span> {truncateCoachSummary(workout.padel_session.coach_summary)}
                  </p>
                ) : null}
                {workout.pain_logs.length > 0 ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Smärta:</span>{" "}
                    {workout.pain_logs.map((log) => `${log.pain_area} (${log.pain_intensity_0_10}/10)`).join(", ")}
                  </p>
                ) : null}
                {workout.note ? <p className="mt-2 text-sm">{workout.note}</p> : null}

                {isEditing(workout.id) && editForm ? (
                  <div className="mt-3 space-y-2 rounded-lg border p-3">
                    <Input type="date" value={editForm.date} onChange={(event) => updateEditField("date", event.target.value)} />
                    <Select value={editForm.type} onChange={(event) => updateEditField("type", event.target.value as WorkoutType)}>
                      <option value="padel">Padel</option>
                      <option value="running">Löpning</option>
                      <option value="strength">Styrka</option>
                      <option value="other">Övrigt</option>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Duration (min)"
                      value={editForm.duration_min}
                      onChange={(event) => updateEditField("duration_min", event.target.value)}
                    />
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      step={0.5}
                      placeholder="Intensitet"
                      value={editForm.intensity_1_5}
                      onChange={(event) => updateEditField("intensity_1_5", event.target.value)}
                    />
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      step={0.5}
                      placeholder="Känsla"
                      value={editForm.feeling_1_5}
                      onChange={(event) => updateEditField("feeling_1_5", event.target.value)}
                    />
                    {editForm.type === "padel" ? (
                      <>
                        <Input placeholder="Format" value={editForm.session_format} onChange={(event) => updateEditField("session_format", event.target.value)} />
                        <Input placeholder="Partner" value={editForm.partner} onChange={(event) => updateEditField("partner", event.target.value)} />
                        <Input placeholder="Motstånd" value={editForm.opponents} onChange={(event) => updateEditField("opponents", event.target.value)} />
                        <Input placeholder="Resultat" value={editForm.results} onChange={(event) => updateEditField("results", event.target.value)} />
                        <Select value={editForm.match_status} onChange={(event) => updateEditField("match_status", event.target.value as MatchStatus | "")}>
                          <option value="">Status</option>
                          <option value="win">Vinst</option>
                          <option value="loss">Förlust</option>
                          <option value="unclear">Oklart</option>
                          <option value="aborted">Avbruten</option>
                        </Select>
                        <Select
                          value={editForm.unforced_errors_level}
                          onChange={(event) => updateEditField("unforced_errors_level", event.target.value as UnforcedErrorsLevel | "")}
                        >
                          <option value="">Unforced</option>
                          <option value="low">Låg</option>
                          <option value="medium">Mellan</option>
                          <option value="high">Hög</option>
                        </Select>
                      </>
                    ) : null}
                    <Textarea
                      placeholder="Kommentar"
                      className="min-h-[70px]"
                      value={editForm.note}
                      onChange={(event) => updateEditField("note", event.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={cancelEdit} disabled={savingId === workout.id}>
                        Avbryt
                      </Button>
                      <Button size="sm" onClick={() => void saveEdit()} disabled={savingId === workout.id}>
                        {savingId === workout.id ? "Sparar..." : "Spara"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(workout)} disabled={deletingId === workout.id}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Redigera
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDeleteWorkout(workout.id)}
                      disabled={deletingId === workout.id}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {deletingId === workout.id ? "Tar bort..." : "Ta bort pass"}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
