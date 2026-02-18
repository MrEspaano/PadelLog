import type { WorkoutWithPadel } from "@/lib/types";

export interface CoachInsight {
  windowSize: number;
  kpiTitle: string;
  kpiValue: string;
  pattern: string;
  alternatives: [string, string];
  challenge: string;
}

function estimateWinRate(results: Array<string | null>) {
  const normalized = results
    .filter((result): result is string => Boolean(result?.trim()))
    .map((result) => result.toLowerCase());

  if (!normalized.length) {
    return null;
  }

  const wins = normalized.filter(
    (result) =>
      result.includes("w") ||
      result.includes("vinst") ||
      result.includes("win") ||
      result.includes("2-0") ||
      result.includes("2-1")
  ).length;

  return wins / normalized.length;
}

export function analyzeCriticalCoach(sessions: WorkoutWithPadel[]): CoachInsight | null {
  if (sessions.length < 3) {
    return null;
  }

  const scoped = sessions.slice(0, 10);
  const windowSize = Math.min(10, Math.max(3, scoped.length));

  const avgIntensity =
    scoped.reduce((sum, session) => sum + (session.intensity_1_5 ?? 0), 0) / windowSize;
  const avgFeeling = scoped.reduce((sum, session) => sum + (session.feeling_1_5 ?? 0), 0) / windowSize;
  const avgDuration = scoped.reduce((sum, session) => sum + session.duration_min, 0) / windowSize;

  const qualityRatio = avgIntensity === 0 ? 0 : avgFeeling / avgIntensity;
  const winRate = estimateWinRate(scoped.map((session) => session.padel_session?.results ?? null));

  const kpiTitle = "KPI: Kvalitetskvot (känsla/intensitet)";
  const kpiValue = `${qualityRatio.toFixed(2)} (${avgFeeling.toFixed(1)}/${avgIntensity.toFixed(1)})`;

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
    kpiTitle,
    kpiValue,
    pattern,
    alternatives,
    challenge
  };
}
