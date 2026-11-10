import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import {
  BodyRecord,
  CreateBodyInput,
  CreateDietInput,
  CreateWorkoutInput,
  DietRecord,
  FitnessRecord,
  WorkoutRecord,
} from '../types/records';

export function useFitnessRecords(isAuthenticated: boolean) {
  const [records, setRecords] = useState<FitnessRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRecords(undefined, 150);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const addDietRecord = useCallback(async (input: CreateDietInput) => {
    const created = await apiClient.postDiet(input);
    setRecords((prev) =>
      [created, ...prev].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    );
    return created;
  }, []);

  const addWorkoutRecord = useCallback(async (input: CreateWorkoutInput) => {
    const created = await apiClient.postWorkout(input);
    setRecords((prev) =>
      [created, ...prev].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    );
    return created;
  }, []);

  const addBodyRecord = useCallback(async (input: CreateBodyInput) => {
    const created = await apiClient.postBody(input);
    setRecords((prev) =>
      [created, ...prev].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    );
    return created;
  }, []);

  const dietRecords = useMemo(
    () => records.filter((r): r is DietRecord => r.recordType === 'DIET'),
    [records]
  );

  const workoutRecords = useMemo(
    () => records.filter((r): r is WorkoutRecord => r.recordType === 'WORKOUT'),
    [records]
  );

  const bodyRecords = useMemo(
    () => records.filter((r): r is BodyRecord => r.recordType === 'BODY'),
    [records]
  );

  return {
    records,
    dietRecords,
    workoutRecords,
    bodyRecords,
    loading,
    error,
    refresh: fetchRecords,
    addDietRecord,
    addWorkoutRecord,
    addBodyRecord,
  };
}

