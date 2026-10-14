// Интервальное повторение по алгоритму FSRS‑4.5 (Free Spaced Repetition Scheduler).
// Параметры по умолчанию — опубликованные веса FSRS‑4.5. Целевая вероятность вспоминания 0,9.

export type Grade = 1 | 2 | 3 | 4; // 1 — Снова, 2 — Трудно, 3 — Хорошо, 4 — Легко
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface SrsCard {
  state: CardState;
  stability: number; // дни
  difficulty: number; // 1..10
  due: number; // timestamp ms
  lastReview: number | null;
  reps: number;
  lapses: number;
  /** Подряд верных ответов — для критерия «устойчиво освоено». */
  streak: number;
}

export const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072,
  0.0793, 0.3246, 1.587, 0.2272, 2.8755,
];
const DECAY = -0.5;
const FACTOR = 19 / 81;
export const REQUEST_RETENTION = 0.9;
const DAY = 86400000;
const MAX_INTERVAL_DAYS = 365;

export function newCard(now = Date.now()): SrsCard {
  return { state: 'new', stability: 0, difficulty: 0, due: now, lastReview: null, reps: 0, lapses: 0, streak: 0 };
}

export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

export function nextIntervalDays(stability: number, retention = REQUEST_RETENTION): number {
  const i = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(i)));
}

const clampD = (d: number) => Math.min(10, Math.max(1, d));
const initDifficulty = (g: Grade) => clampD(W[4] - (g - 3) * W[5]);
const initStability = (g: Grade) => Math.max(0.1, W[g - 1]);

function nextDifficulty(d: number, g: Grade): number {
  const nd = d - W[6] * (g - 3);
  return clampD(W[7] * initDifficulty(4) + (1 - W[7]) * nd);
}

function stabilityAfterSuccess(d: number, s: number, r: number, g: Grade): number {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hard * easy);
}

function stabilityAfterFailure(d: number, s: number, r: number): number {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]));
}

/** Короткие шаги внутри дня для новых и забытых карточек (минуты). */
const LEARNING_STEP_MIN: Record<Grade, number> = { 1: 1, 2: 6, 3: 10, 4: 0 };

export function review(card: SrsCard, grade: Grade, now = Date.now()): SrsCard {
  const c = { ...card };
  const elapsed = c.lastReview ? Math.max(0, (now - c.lastReview) / DAY) : 0;
  if (c.state === 'new') {
    c.difficulty = initDifficulty(grade);
    c.stability = initStability(grade);
  } else {
    const r = retrievability(elapsed, c.stability);
    c.difficulty = nextDifficulty(c.difficulty, grade);
    c.stability = grade === 1 ? stabilityAfterFailure(c.difficulty, c.stability, r) : stabilityAfterSuccess(c.difficulty, c.stability, r, grade);
  }
  c.reps += 1;
  if (grade === 1) {
    if (c.state === 'review') c.lapses += 1;
    c.state = c.state === 'new' || c.state === 'learning' ? 'learning' : 'relearning';
    c.streak = 0;
    c.due = now + LEARNING_STEP_MIN[1] * 60000;
  } else if ((c.state === 'new' || c.state === 'learning' || c.state === 'relearning') && grade !== 4 && c.streak < 1) {
    // Первое верное воспроизведение — ещё один короткий шаг в течение дня.
    c.state = c.state === 'relearning' ? 'relearning' : 'learning';
    c.streak += 1;
    c.due = now + LEARNING_STEP_MIN[grade] * 60000;
  } else {
    c.state = 'review';
    c.streak += 1;
    c.due = now + nextIntervalDays(c.stability) * DAY;
  }
  c.lastReview = now;
  return c;
}

export type WordStatus = 'new' | 'learning' | 'due' | 'mastered';

/**
 * Статус слова для пользователя.
 * «Устойчиво освоено» — стабильность ≥ 21 дня, не менее 3 повторений и последний ответ верный.
 * Один правильный ответ никогда не делает слово освоенным.
 */
export function wordStatus(card: SrsCard, now = Date.now()): WordStatus {
  if (card.state === 'new') return 'new';
  if (card.due <= now) return 'due';
  if (card.state === 'review' && card.stability >= 21 && card.reps >= 3 && card.streak >= 2) return 'mastered';
  return 'learning';
}

/** Перевод результата упражнения в оценку FSRS. */
export function gradeFromResult(correct: boolean, typo: boolean, usedHint: boolean): Grade {
  if (!correct) return 1;
  if (typo || usedHint) return 2;
  return 3;
}
