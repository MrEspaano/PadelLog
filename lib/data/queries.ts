import type {
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
  padel?: PadelSessionInsert
) {
  const created = await requestJson<WorkoutWithPadel>("/api/workouts", {
    method: "POST",
    body: JSON.stringify({
      workout,
      padel: padel ?? null
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
