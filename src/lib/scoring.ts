// Экзаменационные шкалы.
//
// IELTS: таблицы перевода «сырых» баллов (из 40) в Band Score для Listening и Academic Reading
// соответствуют ориентировочным таблицам, публикуемым IELTS (ielts.org). Точная граница
// может немного отличаться от версии теста к версии — поэтому результат помечается как ориентировочный.

export type Band = number;

const LISTENING_TABLE: [number, Band][] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5],
];
const READING_ACADEMIC_TABLE: [number, Band][] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5],
];

function lookup(table: [number, Band][], raw: number): Band {
  for (const [min, band] of table) if (raw >= min) return band;
  return raw > 0 ? 2 : 0;
}

export function listeningBand(raw: number): Band {
  return lookup(LISTENING_TABLE, Math.max(0, Math.min(40, raw)));
}

export function readingBand(raw: number): Band {
  return lookup(READING_ACADEMIC_TABLE, Math.max(0, Math.min(40, raw)));
}

/**
 * Округление общего балла IELTS: среднее четырёх модулей округляется до ближайшей половины,
 * при этом .25 округляется вверх до .5, а .75 — вверх до следующего целого.
 */
export function roundIeltsOverall(avg: number): Band {
  const whole = Math.floor(avg);
  const frac = avg - whole;
  if (frac < 0.25) return whole;
  if (frac < 0.75) return whole + 0.5;
  return whole + 1;
}

export function ieltsOverall(parts: { listening?: Band; reading?: Band; writing?: Band; speaking?: Band }): Band | null {
  const vals = [parts.listening, parts.reading, parts.writing, parts.speaking];
  if (vals.some((v) => v === undefined || v === null || Number.isNaN(v))) return null;
  const avg = (vals as number[]).reduce((a, b) => a + b, 0) / 4;
  return roundIeltsOverall(avg);
}

/** Writing: Task 2 весит вдвое больше Task 1. Итог округляется до 0,5 вниз (консервативно). */
export function writingBand(task1: Band, task2: Band): Band {
  const v = (task1 + 2 * task2) / 3;
  return Math.floor(v * 2) / 2;
}

/** Средний балл по четырём критериям одного задания Writing/Speaking (округление вниз до 0,5). */
export function criteriaBand(criteria: number[]): Band {
  const v = criteria.reduce((a, b) => a + b, 0) / criteria.length;
  return Math.floor(v * 2) / 2;
}

/**
 * Экстраполяция результата неполной секции на 40 вопросов.
 * Используется только с явной пометкой «низкая точность».
 */
export function extrapolateTo40(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 40);
}

// ─── КАЗТЕСТ ────────────────────────────────────────────────────────────────
// Параметры структуры взяты из технического задания. Официальные пороговые баллы
// в приложение не встроены: их нужно ввести по актуальным данным Национального центра тестирования.

export const KAZTEST_STRUCTURE = {
  listening: { key: 'listening', kz: 'Тыңдалым', ru: 'Аудирование', questions: 20, minutes: 20 },
  reading: { key: 'reading', kz: 'Оқылым', ru: 'Чтение', questions: 40, minutes: 50 },
  writing: { key: 'writing', kz: 'Жазылым', ru: 'Письмо', questions: 2, minutes: 50 },
  speaking: { key: 'speaking', kz: 'Айтылым', ru: 'Говорение', questions: 2, minutes: 7 },
} as const;
export const KAZTEST_TOTAL_MINUTES = 127;
export const KAZTEST_MAX_POINTS = 160;

export type KaztestBlock = keyof typeof KAZTEST_STRUCTURE;

export interface KaztestThresholds {
  /** Источник (ссылка/документ), откуда пользователь взял пороги. */
  source: string;
  level: string;
  /** Минимальный процент или балл по блоку — как указано в официальном документе. */
  perBlock: Partial<Record<KaztestBlock, number>>;
  unit: 'percent' | 'points';
}

export function kaztestPassCheck(
  results: Partial<Record<KaztestBlock, { correct: number; total: number } | undefined>>,
  t: KaztestThresholds | null,
): { block: KaztestBlock; percent: number | null; passed: boolean | null }[] {
  return (Object.keys(KAZTEST_STRUCTURE) as KaztestBlock[]).map((block) => {
    const r = results[block];
    const percent = r && r.total > 0 ? Math.round((r.correct / r.total) * 100) : null;
    const thr = t?.perBlock[block];
    let passed: boolean | null = null;
    if (percent !== null && thr !== undefined && t?.unit === 'percent') passed = percent >= thr;
    return { block, percent, passed };
  });
}

// ─── Соответствие CEFR и IELTS (ориентир) ──────────────────────────────────
// Ориентир по публикациям IELTS/CEFR: B1 ≈ 4.0–5.0, B2 ≈ 5.5–6.5. Для оценки достижимости цели.
export const CEFR_TO_IELTS: Record<string, [number, number]> = {
  A0: [0, 2.5],
  A1: [2.5, 3.0],
  A2: [3.0, 3.5],
  B1: [4.0, 5.0],
  B2: [5.5, 6.5],
  C1: [7.0, 8.0],
};
