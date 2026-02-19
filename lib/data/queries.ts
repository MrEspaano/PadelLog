import type {
  MatchStatus,
  PainLog,
  PainLogInsert,
  PadelSessionInsert,
  WeightEntry,
  WeightInsert,
  Workout,
  WorkoutInsert,
  WorkoutWithPadel
} from "@/lib/types";

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchWeights() {
  return requestJson<WeightEntry[]>("/api/weights");
}

export async function createWeight(payload: Omit<WeightInsert, "user_id">) {
  return requestJson<WeightEntry>("/api/weights", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchWorkouts() {
  return requestJson<WorkoutWithPadel[]>("/api/workouts");
}

export async function fetchWorkoutsInRange(
  startDate: string,
  endDate: string
) {
  return requestJson<WorkoutWithPadel[]>(
    `/api/workouts?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  );
}

export async function fetchLatestPadelSessions(count = 10) {
  return requestJson<WorkoutWithPadel[]>(
    `/api/workouts?type=padel&limit=${encodeURIComponent(String(count))}`
  );
}

export async function createWorkoutWithOptionalPadel(
  workout: Omit<WorkoutInsert, "user_id">,
  padel?: PadelSessionInsert,
  painLogs: PainLogInsert[] = []
) {
  const created = await requestJson<WorkoutWithPadel>("/api/workouts", {
    method: "POST",
    body: JSON.stringify({
      workout,
      padel: padel ?? null,
      pain_logs: painLogs
    })
  });

  return {
    workout: created as Workout,
    padel: created.padel_session
  };
}

export async function deleteWorkout(workoutId: string) {
  return requestJson<{ ok: boolean; id: string }>(`/api/workouts/${encodeURIComponent(workoutId)}`, {
    method: "DELETE"
  });
}

export async function addPainLog(workoutId: string, painLog: PainLogInsert) {
  return requestJson<PainLog>(`/api/workouts/${encodeURIComponent(workoutId)}/pain-logs`, {
    method: "POST",
    body: JSON.stringify(painLog)
  });
}

interface WinRateRow {
  periodDays: number | null;
  total: {
    wins: number;
    losses: number;
    unclear: number;
    winRate: number | null;
  };
  partnerWinRate: Array<{
    partner: string;
    wins: number;
    losses: number;
    matches: number;
    winRate: number | null;
  }>;
  opponentWinRate: Array<{
    opponents: string;
    wins: number;
    losses: number;
    matches: number;
    winRate: number | null;
  }>;
  recentMatches: Array<{
    id: string;
    date: string;
    partner: string | null;
    opponents: string | null;
    results: string | null;
    match_status: MatchStatus;
  }>;
}

export async function fetchWinRateStats(days: 30 | 90 | "all" = "all") {
  return requestJson<WinRateRow>(`/api/stats/win-rate?days=${days}`);
}

interface PainStatsRow {
  weekly: Array<{
    iso_week: string;
    pain_logs: number;
    avg_intensity: number;
  }>;
  topAreas: Array<{
    pain_area: string;
    count: number;
  }>;
}

export async function fetchPainStats() {
  return requestJson<PainStatsRow>("/api/stats/pain");
}
