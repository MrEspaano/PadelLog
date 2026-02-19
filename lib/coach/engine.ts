import type { MatchStatus, WorkoutInsert } from "@/lib/types";

interface CoachInputPadel {
  results?: string | null;
  match_status?: MatchStatus | null;
  tags?: string[] | null;
}

export interface CoachOutput {
  summary: string;
  tags: string[];
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseSetResults(rawResults: string | null | undefined) {
  if (!rawResults) {
    return [] as Array<{ own: number; opp: number }>;
  }

  const matches = Array.from(rawResults.matchAll(/(\d+)\s*[-:]\s*(\d+)/g));
  return matches.map((match) => ({ own: Number(match[1]), opp: Number(match[2]) }));
}

function hasMomentumDrop(results: string | null | undefined) {
  const sets = parseSetResults(results);
  if (sets.length < 3) {
    return false;
  }

  const first = sets[0];
  const firstDominant = first.own >= 6 && first.opp <= 1;
  const trailingLosses = sets.slice(1).filter((set) => set.own < set.opp).length >= 2;

  return firstDominant && trailingLosses;
}

function normalizeTags(tags: string[] | null | undefined) {
  return (tags ?? []).map((tag) => tag.trim().toLowerCase());
}

export function generateCoachSummary(
  workout: Pick<WorkoutInsert, "intensity_1_5" | "feeling_1_5">,
  padelSession: CoachInputPadel
): CoachOutput {
  const intensity = toNumber(workout.intensity_1_5);
  const feeling = toNumber(workout.feeling_1_5);
  const tags = normalizeTags(padelSession.tags);
  const status = padelSession.match_status ?? "unclear";

  const coachTags: string[] = [];
  const lines: string[] = [];

  if (hasMomentumDrop(padelSession.results)) {
    coachTags.push("momentum_drop", "adjustment_issue");
    lines.push("Du öppnade starkt men tappade matchbilden efter första set. Träna på en tydlig B-plan när motståndet justerar.");
  }

  if (intensity > 0 && intensity < 2 && feeling > 0 && feeling < 3) {
    coachTags.push("low_focus", "low_energy");
    lines.push("Låg intensitet och låg känsla idag. Sätt en enkel processregel nästa pass för att stabilisera fokus.");
  }

  if (intensity >= 4 && feeling >= 4) {
    coachTags.push("stable_performance");
    lines.push("Hög intensitet med hög känsla. Du höll en stabil prestation genom passet.");
  }

  if (status === "loss") {
    coachTags.push("loss_review");
    lines.push("Förlust idag. Välj en konkret detalj att förbättra till nästa pass i stället för att ändra allt.");
  } else if (status === "win") {
    coachTags.push("win_confirmed");
    lines.push("Vinst idag. Behåll samma grundstruktur och finjustera en sak i taget.");
  }

  if (tags.includes("tennistempo")) {
    coachTags.push("tennis_tempo", "b_plan_required");
    lines.push("Tennistempo noterades. Prioritera höjd, djup och tålamod för att styra rytmen bättre.");
  }

  if (lines.length === 0) {
    lines.push("Passet är loggat utan tydliga avvikelser. Fokusera på jämn kvalitet i första 20 minuterna nästa gång.");
    coachTags.push("baseline_review");
  }

  return {
    summary: lines.slice(0, 2).join(" "),
    tags: Array.from(new Set(coachTags))
  };
}
