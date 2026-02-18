export type WorkoutType = "padel" | "running" | "strength" | "other";

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  type: WorkoutType;
  duration_min: number;
  intensity_1_5: number | null;
  feeling_1_5: number | null;
  note: string | null;
  created_at: string;
}

export interface PadelSession {
  id: string;
  workout_id: string;
  session_format: string | null;
  partner: string | null;
  opponents: string | null;
  results: string | null;
  tags: string[] | null;
  ball_share: number | null;
  created_at: string;
}

export interface WorkoutWithPadel extends Workout {
  padel_session: PadelSession | null;
}

export interface WeightInsert {
  user_id: string;
  date: string;
  weight_kg: number;
  note?: string | null;
}

export interface WorkoutInsert {
  user_id: string;
  date: string;
  type: WorkoutType;
  duration_min: number;
  intensity_1_5?: number | null;
  feeling_1_5?: number | null;
  note?: string | null;
}

export interface PadelSessionInsert {
  session_format?: string | null;
  partner?: string | null;
  opponents?: string | null;
  results?: string | null;
  tags?: string[] | null;
  ball_share?: number | null;
}
