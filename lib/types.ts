export type WorkoutType = "padel" | "running" | "strength" | "other";
export type UnforcedErrorsLevel = "low" | "medium" | "high";
export type MatchStatus = "win" | "loss" | "unclear" | "aborted";
export type PainArea =
  | "nacke"
  | "rygg"
  | "axel"
  | "armbåge"
  | "handled"
  | "höft"
  | "knä"
  | "vad"
  | "fot"
  | "annan";
export type PainType = "stelhet" | "skarp" | "molande" | "domning" | "annat";

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
  match_status: MatchStatus | null;
  unforced_errors_level: UnforcedErrorsLevel | null;
  coach_summary: string | null;
  coach_tags: string[] | null;
  tags: string[] | null;
  ball_share: number | null;
  created_at: string;
}

export interface PainLog {
  id: string;
  user_id: string;
  workout_id: string;
  pain_area: PainArea;
  pain_intensity_0_10: number;
  pain_type: PainType | null;
  pain_note: string | null;
  created_at: string;
}

export interface WorkoutWithPadel extends Workout {
  padel_session: PadelSession | null;
  pain_logs: PainLog[];
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
  match_status?: MatchStatus | null;
  unforced_errors_level?: UnforcedErrorsLevel | null;
  tags?: string[] | null;
  ball_share?: number | null;
}

export interface PainLogInsert {
  pain_area: PainArea;
  pain_intensity_0_10: number;
  pain_type?: PainType | null;
  pain_note?: string | null;
}
