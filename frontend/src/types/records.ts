export type RecordType = 'DIET' | 'WORKOUT' | 'BODY';
export type PeriodDays = 7 | 30;

export interface DietIngredient {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export interface BaseFitnessRecord {
  userId: string;
  recordKey: string; // e.g., DIET#2026-11-10T12:00:00Z
  recordType: RecordType;
  recordedAt: string; // ISO8601 UTC
  syncedToCold?: boolean;
}

export interface DietRecord extends BaseFitnessRecord {
  recordType: 'DIET';
  menuName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients?: DietIngredient[];
}

export interface WorkoutRecord extends BaseFitnessRecord {
  recordType: 'WORKOUT';
  workoutName: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface BodyRecord extends BaseFitnessRecord {
  recordType: 'BODY';
  bodyWeight: number;
  bodyFatPercentage?: number;
}

export type FitnessRecord = DietRecord | WorkoutRecord | BodyRecord;

export interface CreateDietInput {
  menuName: string;
  calories?: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients?: DietIngredient[];
  recordedAt?: string;
}

export interface CreateWorkoutInput {
  workoutName: string;
  weight: number;
  reps: number;
  sets: number;
  recordedAt?: string;
}

export interface CreateBodyInput {
  bodyWeight: number;
  bodyFatPercentage?: number;
  recordedAt?: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  idToken: string;
  isMock: boolean;
}
