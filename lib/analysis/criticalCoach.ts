import type { WorkoutWithPadel } from "@/lib/types";

export interface CoachInsight {
  windowSize: number;
  metricTitle: string;
  metricValue: string;
  pattern: string;
  alternatives: [string, string];
  challenge: string;
}

function estimateWinRate(sessions: WorkoutWithPadel[]) {
  const statuses = sessions
    .map((session) => session.padel_session?.match_status)
    .filter((status): status is "win" | "loss" => status === "win" || status === "loss");

  if (statuses.length > 0) {
    const wins = statuses.filter((status) => status === "win").length;
    return wins / statuses.length;
  }

  const results = sessions
    .map((session) => session.padel_session?.results)
    .filter((result): result is string => Boolean(result?.trim()))
    .map((result) => result.toLowerCase());

  if (!results.length) {
    return null;
  }

  const wins = results.filter(
    (result) =>
      result.includes("w") ||
      result.includes("vinst") ||
      result.includes("win") ||
      result.includes("2-0") ||
      result.includes("2-1")
  ).length;

  return wins / results.length;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function analyzeCriticalCoach(sessions: WorkoutWithPadel[]): CoachInsight | null {
  if (sessions.length < 3) {
    return null;
  }

  const scoped = sessions.slice(0, 10);
  const windowSize = Math.min(10, Math.max(3, scoped.length));

  const rawAvgIntensity = scoped.reduce((sum, session) => sum + toNumber(session.intensity_1_5), 0) / windowSize;
  const rawAvgFeeling = scoped.reduce((sum, session) => sum + toNumber(session.feeling_1_5), 0) / windowSize;
  const rawAvgDuration = scoped.reduce((sum, session) => sum + toNumber(session.duration_min), 0) / windowSize;

  const avgIntensity = Number.isFinite(rawAvgIntensity) ? rawAvgIntensity : 0;
  const avgFeeling = Number.isFinite(rawAvgFeeling) ? rawAvgFeeling : 0;
  const avgDuration = Number.isFinite(rawAvgDuration) ? rawAvgDuration : 0;

  const rawQualityRatio = avgIntensity === 0 ? 1 : avgFeeling / avgIntensity;
  const qualityRatio = Number.isFinite(rawQualityRatio) ? rawQualityRatio : 1;
  const winRate = estimateWinRate(scoped);
  const metricTitle = "Vinstprocent";
  const metricValue = winRate === null ? "Ingen matchdata" : `${Math.round(winRate * 100)}%`;

  let pattern =
    "Du tränar relativt jämnt, men känslan följer inte alltid intensiteten. Det tyder på att uppladdning och återhämtning styr utfallet mer än total mängd.";

  if (qualityRatio < 0.85) {
    pattern =
      "Du driver hög belastning men känslan hänger inte med. Mönstret pekar på att intensiteten ofta är för hög i relation till dagsform.";
  } else if (qualityRatio > 1.1) {
    pattern =
      "Känslan är starkare än belastningen. Du kan sannolikt höja kvaliteten i nyckelpass utan att tappa kontroll.";
  }

  const alternatives: [string, string] = [
    `Alternativ tolkning A: Snittlängd ${avgDuration.toFixed(
      0
    )} min kan vara huvudorsaken. Långa pass drar ned precision även när intensitetsskalan ser rimlig ut.`,
    winRate === null
      ? "Alternativ tolkning B: Du loggar för få resultat för att bedöma tävlingsutfall. Trenden kan vara bättre eller sämre än känslan antyder."
      : `Alternativ tolkning B: Vinstfrekvensen (${Math.round(
          winRate * 100
        )}%) kan maskera utveckling. Bra resultat kan komma från motståndsnivå, inte nödvändigtvis från bättre spelkvalitet.`
  ];

  const challenge =
    "Kritisk fråga: Om du tvingas välja en sak att ändra nästa vecka, är det verkligen teknik du saknar eller borde du först optimera belastningsnivån per pass?";

  return {
    windowSize,
    metricTitle,
    metricValue,
    pattern,
    alternatives,
    challenge
  };
}
