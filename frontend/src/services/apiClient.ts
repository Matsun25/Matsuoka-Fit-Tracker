import {
  CreateBodyInput,
  CreateDietInput,
  CreateWorkoutInput,
  FitnessRecord,
  RecordType,
} from '../types/records';
import { authService } from './authService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const MOCK_RECORDS_STORAGE_KEY = 'fit_tracker_mock_records_v2';

/**
 * 初回起動時に「1週間 (7日)」と「1ヶ月 (30日)」の切り替えがすぐ体感できる30日分のシードデータを生成
 */
function buildInitialSeedRecords(userId: string): FitnessRecord[] {
  const now = new Date();
  const records: FitnessRecord[] = [];

  const sampleMenus = [
    {
      name: '朝食: オートミール + プロテイン + バナナ',
      p: 38,
      f: 7,
      c: 55,
      ingredients: [
        { name: 'オートミール 50g', protein: 6.8, fat: 2.8, carbs: 34.5, calories: 190 },
        { name: 'ホエイプロテイン 1杯', protein: 24.0, fat: 1.5, carbs: 3.0, calories: 122 },
        { name: 'バナナ 1本', protein: 1.1, fat: 0.2, carbs: 22.5, calories: 96 },
      ],
    },
    {
      name: '昼食: 鶏胸肉グリル + 玄米200g + ブロッコリー',
      p: 48,
      f: 6,
      c: 72,
      ingredients: [
        { name: '鶏胸肉(皮なし) 200g', protein: 44.0, fat: 3.8, carbs: 0.0, calories: 210 },
        { name: '玄米ごはん 200g', protein: 5.6, fat: 2.0, carbs: 71.2, calories: 325 },
      ],
    },
    {
      name: '夕食: 焼き鮭 + 納豆 + 味噌汁 + 白米',
      p: 36,
      f: 14,
      c: 65,
      ingredients: [
        { name: '銀鮭 1切れ', protein: 22.0, fat: 10.5, carbs: 0.2, calories: 183 },
        { name: '納豆 1パック', protein: 8.3, fat: 5.0, carbs: 6.1, calories: 100 },
        { name: '白米 160g', protein: 4.0, fat: 0.5, carbs: 59.0, calories: 256 },
      ],
    },
    {
      name: '間食: ギリシャヨーグルト + プロテインバー',
      p: 32,
      f: 5,
      c: 28,
    },
    {
      name: '夕食: 牛赤身ステーキ + 温野菜 + ライ麦パン',
      p: 46,
      f: 15,
      c: 40,
    },
    {
      name: '昼食: サバ缶パスタ + サラダチキン',
      p: 52,
      f: 18,
      c: 68,
    },
    {
      name: '朝食: 卵かけご飯 + ホエイプロテイン',
      p: 34,
      f: 9,
      c: 58,
    },
  ];

  const sampleWorkouts = [
    { name: 'ベンチプレス', baseWeight: 72.5, reps: 10, sets: 3 },
    { name: 'スクワット', baseWeight: 95, reps: 8, sets: 4 },
    { name: 'ラットプルダウン', baseWeight: 57.5, reps: 12, sets: 3 },
    { name: 'デッドリフト', baseWeight: 110, reps: 6, sets: 3 },
    { name: 'ショルダープレス', baseWeight: 42.5, reps: 10, sets: 3 },
  ];

  // 直近30日分のデータを生成
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const progress = (29 - i) / 29; // 0.0 -> 1.0 (30日間の成長・減量トレンド)

    // 1. 朝の体重測定 (約 70.4kg -> 68.0kg へ緩やかに推移)
    const morning = new Date(day);
    morning.setHours(7, 30, 0, 0);
    const morningIso = morning.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const wave = Math.sin(i * 0.6) * 0.25;
    const bodyWeight = Number((70.4 - progress * 2.4 + wave).toFixed(1));
    const bodyFat = Number((16.2 - progress * 1.6 + wave * 0.5).toFixed(1));

    records.push({
      userId,
      recordKey: `BODY#${morningIso}`,
      recordType: 'BODY',
      recordedAt: morningIso,
      bodyWeight,
      bodyFatPercentage: bodyFat,
      syncedToCold: i > 2,
    });

    // 2. 昼食・夕食の2回分を記録
    const lunch = new Date(day);
    lunch.setHours(12, 15, 0, 0);
    const lunchIso = lunch.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const menu1 = sampleMenus[i % sampleMenus.length];
    const cal1 = Math.round(menu1.p * 4 + menu1.f * 9 + menu1.c * 4);

    records.push({
      userId,
      recordKey: `DIET#${lunchIso}`,
      recordType: 'DIET',
      recordedAt: lunchIso,
      menuName: menu1.name,
      calories: cal1,
      protein: menu1.p,
      fat: menu1.f,
      carbs: menu1.c,
      ingredients: menu1.ingredients,
      syncedToCold: i > 2,
    });

    const dinner = new Date(day);
    dinner.setHours(19, 30, 0, 0);
    const dinnerIso = dinner.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const menu2 = sampleMenus[(i + 3) % sampleMenus.length];
    const cal2 = Math.round(menu2.p * 4 + menu2.f * 9 + menu2.c * 4);

    records.push({
      userId,
      recordKey: `DIET#${dinnerIso}`,
      recordType: 'DIET',
      recordedAt: dinnerIso,
      menuName: menu2.name,
      calories: cal2,
      protein: menu2.p,
      fat: menu2.f,
      carbs: menu2.c,
      ingredients: menu2.ingredients,
      syncedToCold: i > 2,
    });

    // 3. トレーニング記録 (2日に1回 + 直近3日は毎日)
    if (i % 2 === 0 || i <= 3) {
      const workoutTime = new Date(day);
      workoutTime.setHours(18, 0, 0, 0);
      const workoutIso = workoutTime.toISOString().replace(/\.\d{3}Z$/, 'Z');
      const wo = sampleWorkouts[(29 - i) % sampleWorkouts.length];
      const weight = Number((wo.baseWeight + Math.floor(progress * 3) * 2.5).toFixed(1));

      records.push({
        userId,
        recordKey: `WORKOUT#${workoutIso}`,
        recordType: 'WORKOUT',
        recordedAt: workoutIso,
        workoutName: wo.name,
        weight,
        reps: wo.reps,
        sets: wo.sets,
        syncedToCold: i > 2,
      });
    }
  }

  return records.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

function getMockRecords(userId: string): FitnessRecord[] {
  const raw = localStorage.getItem(MOCK_RECORDS_STORAGE_KEY);
  if (!raw) {
    const seeded = buildInitialSeedRecords(userId);
    localStorage.setItem(MOCK_RECORDS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as FitnessRecord[];
  } catch {
    return [];
  }
}

function saveMockRecord(record: FitnessRecord): FitnessRecord {
  const existing = getMockRecords(record.userId);
  const updated = [
    record,
    ...existing.filter((r) => r.recordKey !== record.recordKey),
  ].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  localStorage.setItem(MOCK_RECORDS_STORAGE_KEY, JSON.stringify(updated));
  return record;
}

function shouldUseMock(): boolean {
  const user = authService.getCurrentUser();
  // API_BASE_URL が未設定、またはダミーの localhost:8000 の間はローカルストレージ保存を自動使用する
  const isDummyApiUrl =
    !API_BASE_URL || API_BASE_URL.includes('localhost:8000');
  return isDummyApiUrl || Boolean(user?.isMock);
}

async function authorizedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await authService.getValidIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API エラー (${response.status})`);
  }
  return data as T;
}

export const apiClient = {
  isMockMode(): boolean {
    return shouldUseMock();
  },

  async getRecords(type?: RecordType, limit = 300): Promise<FitnessRecord[]> {
    const user = authService.getCurrentUser();
    const userId = user?.userId || 'demo-user-001';

    if (shouldUseMock()) {
      const all = getMockRecords(userId);
      const filtered = type ? all.filter((r) => r.recordType === type) : all;
      return filtered.slice(0, limit);
    }

    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.set('type', type);
    const res = await authorizedFetch<{ records: FitnessRecord[] }>(
      `/records?${params.toString()}`
    );
    return res.records;
  },

  async postDiet(input: CreateDietInput): Promise<FitnessRecord> {
    const user = authService.getCurrentUser();
    const userId = user?.userId || 'demo-user-001';

    if (shouldUseMock()) {
      const recordedAt =
        input.recordedAt || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const calories =
        input.calories ??
        Math.round(input.protein * 4 + input.fat * 9 + input.carbs * 4);
      const record: FitnessRecord = {
        userId,
        recordKey: `DIET#${recordedAt}`,
        recordType: 'DIET',
        recordedAt,
        menuName: input.menuName,
        calories,
        protein: input.protein,
        fat: input.fat,
        carbs: input.carbs,
        ingredients: input.ingredients,
        syncedToCold: false,
      };
      return saveMockRecord(record);
    }

    const res = await authorizedFetch<{ record: FitnessRecord }>('/records/diet', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.record;
  },

  async postWorkout(input: CreateWorkoutInput): Promise<FitnessRecord> {
    const user = authService.getCurrentUser();
    const userId = user?.userId || 'demo-user-001';

    if (shouldUseMock()) {
      const recordedAt =
        input.recordedAt || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const record: FitnessRecord = {
        userId,
        recordKey: `WORKOUT#${recordedAt}`,
        recordType: 'WORKOUT',
        recordedAt,
        workoutName: input.workoutName,
        weight: input.weight,
        reps: input.reps,
        sets: input.sets,
        syncedToCold: false,
      };
      return saveMockRecord(record);
    }

    const res = await authorizedFetch<{ record: FitnessRecord }>('/records/workout', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.record;
  },

  async postBody(input: CreateBodyInput): Promise<FitnessRecord> {
    const user = authService.getCurrentUser();
    const userId = user?.userId || 'demo-user-001';

    if (shouldUseMock()) {
      const recordedAt =
        input.recordedAt || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const record: FitnessRecord = {
        userId,
        recordKey: `BODY#${recordedAt}`,
        recordType: 'BODY',
        recordedAt,
        bodyWeight: input.bodyWeight,
        bodyFatPercentage: input.bodyFatPercentage,
        syncedToCold: false,
      };
      return saveMockRecord(record);
    }

    const res = await authorizedFetch<{ record: FitnessRecord }>('/records/body', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.record;
  },

  resetMockData(): void {
    localStorage.removeItem(MOCK_RECORDS_STORAGE_KEY);
  },
};
