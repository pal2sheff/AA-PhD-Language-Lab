// Планирование: этапы программы, контрольные точки, календарь и ежедневный план.
// Все функции чистые (без побочных эффектов) — их легко тестировать.

import type { CurriculumUnit, Lang } from '../data/types';
import { UNITS, WEEK_GOALS, type WeekGoal } from '../data/curriculum';
import { getLesson } from '../data';
import type { AppState, BlockKind, PlanBlock, Settings } from './state';
import { addDays, diffDays, weekday } from './dates';

export type Phase = 1 | 2 | 3 | 4;

export const PHASE_NAMES: Record<Phase, string> = {
  1: 'Диагностика и устранение пробелов',
  2: 'Интенсивное изучение языков',
  3: 'Экзаменационная подготовка',
  4: 'Экзаменационный интенсив',
};

const scale = (day90: number, total: number) => Math.max(1, Math.round((day90 / 90) * total));

/** Границы этапов, масштабированные на длительность курса (90 → 14/45/75). */
export function phaseBounds(total: number): [number, number, number] {
  return [scale(14, total), scale(45, total), scale(75, total)];
}

export function phaseOf(day: number, total: number): Phase {
  const [a, b, c] = phaseBounds(total);
  if (day <= a) return 1;
  if (day <= b) return 2;
  if (day <= c) return 3;
  return 4;
}

export const CHECKPOINT_DAYS_90 = [1, 14, 30, 45, 60, 75, 90];
export const CHECKPOINT_TITLES: Record<number, string> = {
  1: 'Исходная диагностика',
  14: 'Первый контроль',
  30: 'Промежуточная оценка',
  45: 'Контроль развития навыков',
  60: 'Экзаменационная диагностика',
  75: 'Оценка готовности',
  90: 'Итоговый экзамен',
};

export function checkpointDays(total: number): { day: number; base: number; title: string }[] {
  return CHECKPOINT_DAYS_90.map((b) => ({ day: b === 1 ? 1 : scale(b, total), base: b, title: CHECKPOINT_TITLES[b] }));
}

export function checkpointFor(day: number, total: number) {
  return checkpointDays(total).find((c) => c.day === day && c.base !== 1) ?? null;
}

/** Дни пробных экзаменов: по одной секционной симуляции в этапе 3 и регулярно в этапе 4, без ежедневных полных экзаменов. */
export function mockDays(total: number): number[] {
  const [, b, c] = phaseBounds(total);
  const days = new Set<number>();
  days.add(Math.round((b + c) / 2));
  for (let d = c + 2; d <= total; d += Math.max(3, Math.round(total / 30))) days.add(d);
  days.add(total - 1);
  return [...days].filter((d) => d > 0 && d < total).sort((x, y) => x - y);
}

export function courseDay(settings: Settings, date: string): number {
  return diffDays(settings.startDate, date) + 1;
}

export function stageWeek(day: number, total: number): number {
  const w = Math.floor(((Math.max(1, day) - 1) / total) * 13) + 1;
  return Math.min(13, Math.max(1, w));
}

export function weekGoal(day: number, total: number): WeekGoal {
  return WEEK_GOALS[stageWeek(day, total) - 1];
}

export function isRestDay(settings: Settings, date: string): boolean {
  return settings.restWeekdays.includes(weekday(date));
}

export function minutesSplit(settings: Settings): { en: number; kk: number } {
  const en = Math.round((settings.dailyMinutes * settings.enShare) / 5) * 5;
  return { en, kk: settings.dailyMinutes - en };
}

// ─── Программа: какие темы пройдены ───────────────────────────────────────

export function unitDone(state: AppState, u: CurriculumUnit): boolean {
  if (u.lessonId) return !!state.lessons[u.lessonId]?.passed;
  return false;
}

/** Следующий урок с готовым материалом, который ещё не пройден. */
export function nextLesson(state: AppState, lang: Lang): string | null {
  for (const u of UNITS[lang]) {
    if (u.lessonId && !state.lessons[u.lessonId]?.passed && getLesson(u.lessonId)) return u.lessonId;
  }
  return null;
}

/** Слабые темы: ≥ 3 попыток и < 60 % в последних 10 ответах, либо ≥ 2 открытые ошибки. */
export function weakTopics(state: AppState, lang?: Lang): { topic: string; accuracy: number; open: number }[] {
  const open = new Map<string, number>();
  for (const m of state.mistakes) if (m.status === 'open' && (!lang || m.lang === lang)) open.set(m.topic, (open.get(m.topic) ?? 0) + 1);
  const res: { topic: string; accuracy: number; open: number }[] = [];
  const topics = new Set([...Object.keys(state.topics), ...open.keys()]);
  for (const t of topics) {
    if (lang && !t.startsWith(lang + '.')) continue;
    const s = state.topics[t];
    const recent = s?.recent ?? [];
    const acc = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 1;
    const o = open.get(t) ?? 0;
    if ((recent.length >= 3 && acc < 0.6) || o >= 2) res.push({ topic: t, accuracy: acc, open: o });
  }
  return res.sort((a, b) => a.accuracy - b.accuracy || b.open - a.open);
}

/** Освоенная тема: ≥ 5 попыток и ≥ 80 % в последних 10 ответах. */
export function topicMastered(state: AppState, topic: string): boolean {
  const s = state.topics[topic];
  if (!s || s.recent.length < 5) return false;
  return s.recent.reduce((a, b) => a + b, 0) / s.recent.length >= 0.8;
}

// ─── Календарь ────────────────────────────────────────────────────────────

export interface CalendarDay {
  date: string;
  day: number;
  phase: Phase;
  week: number;
  rest: boolean;
  checkpoint: string | null;
  mock: boolean;
  units: { lang: Lang; unit: CurriculumUnit; hasContent: boolean }[];
  review: boolean;
  status: 'done' | 'partial' | 'missed' | 'rest' | 'today' | 'future';
  minutes: number;
  examMarks: string[];
}

function hasContent(u: CurriculumUnit) {
  return !!(u.lessonId && getLesson(u.lessonId)) || !!u.route;
}

/**
 * Проекция программы на календарь. Прошедшие дни показывают фактическую активность,
 * будущие — оставшиеся темы, равномерно распределённые по оставшимся учебным дням.
 * Пропуск занятий не создаёт «долгов»: темы просто сдвигаются вперёд.
 */
export function buildCalendar(state: AppState, todayIso: string): { days: CalendarDay[]; overflow: Record<Lang, number> } {
  const s = state.settings;
  const total = s.courseDays;
  const todayDay = courseDay(s, todayIso);
  const queues: Record<Lang, CurriculumUnit[]> = {
    en: UNITS.en.filter((u) => !unitDone(state, u)),
    kk: UNITS.kk.filter((u) => !unitDone(state, u)),
  };
  const futureStudyDays: number[] = [];
  for (let d = Math.max(1, todayDay); d <= total; d++) {
    if (!isRestDay(s, addDays(s.startDate, d - 1))) futureStudyDays.push(d);
  }
  // Сколько тем в день: распределяем равномерно, но не меньше 1 темы на 2 учебных дня
  const assign: Record<number, { lang: Lang; unit: CurriculumUnit }[]> = {};
  const reviewDays = new Set<number>();
  for (const lang of ['en', 'kk'] as Lang[]) {
    const q = queues[lang];
    let qi = 0;
    let studyCount = 0;
    const perDay = Math.max(0.5, q.length / Math.max(1, futureStudyDays.length * 0.85));
    let acc = 0;
    for (const d of futureStudyDays) {
      studyCount++;
      if (studyCount % 7 === 0) {
        reviewDays.add(d); // еженедельный день повторения и мини-теста
        continue;
      }
      if (d === 1) continue; // день 1 — диагностика
      acc += perDay;
      while (acc >= 1 && qi < q.length) {
        const u = q[qi];
        if (u.phase > phaseOf(d, total)) break; // экзаменационные темы — не раньше своего этапа
        (assign[d] ??= []).push({ lang, unit: u });
        qi++;
        acc -= 1;
      }
      if (acc > 1) acc = 1;
    }
    queues[lang] = q.slice(qi);
  }
  const checkpoints = new Map(checkpointDays(total).map((c) => [c.day, c.title]));
  const mocks = new Set(mockDays(total));
  const examMarks = new Map<string, string[]>();
  const ed = state.examDates;
  const mark = (date: string, label: string) => {
    if (!date) return;
    examMarks.set(date, [...(examMarks.get(date) ?? []), label]);
  };
  mark(ed.ielts, 'IELTS');
  mark(ed.kaztest, 'КАЗТЕСТ');
  mark(ed.phdDeadline, 'Подача документов');
  for (const c of ed.custom) mark(c.date, c.title);

  const days: CalendarDay[] = [];
  for (let d = 1; d <= total; d++) {
    const date = addDays(s.startDate, d - 1);
    const act = state.activity[date];
    const minutes = act ? Math.round(act.seconds / 60) : 0;
    const rest = isRestDay(s, date);
    let status: CalendarDay['status'];
    if (d === todayDay) status = 'today';
    else if (d > todayDay) status = rest ? 'rest' : 'future';
    else if (minutes >= s.dailyMinutes * 0.8) status = 'done';
    else if (minutes > 0) status = 'partial';
    else status = rest ? 'rest' : 'missed';
    days.push({
      date,
      day: d,
      phase: phaseOf(d, total),
      week: Math.floor((d - 1) / 7) + 1,
      rest,
      checkpoint: checkpoints.get(d) ?? null,
      mock: mocks.has(d),
      units: (assign[d] ?? []).map((a) => ({ ...a, hasContent: hasContent(a.unit) })),
      review: reviewDays.has(d),
      status,
      minutes,
      examMarks: examMarks.get(date) ?? [],
    });
  }
  return { days, overflow: { en: queues.en.length, kk: queues.kk.length } };
}

// ─── Ежедневный план ──────────────────────────────────────────────────────

let blockSeq = 0;
function block(lang: Lang, kind: BlockKind, title: string, minutes: number, route: string, ref?: string, why?: string): PlanBlock {
  blockSeq++;
  return { id: `${lang}-${kind}-${ref ?? ''}-${blockSeq}`, lang, kind, title, minutes, route, ref, why, done: false };
}

function dueVocabCount(state: AppState, lang: Lang, now: number) {
  return Object.values(state.vocab).filter((v) => v.lang === lang && v.card.state !== 'new' && v.card.due <= now).length;
}

function fit(cands: PlanBlock[], budget: number): PlanBlock[] {
  const out: PlanBlock[] = [];
  let left = budget;
  for (const b of cands) {
    if (left < 5) break;
    if (b.minutes <= left) {
      out.push(b);
      left -= b.minutes;
    } else if (left >= 5 && b.kind !== 'checkpoint' && b.kind !== 'mock') {
      out.push({ ...b, minutes: Math.floor(left / 5) * 5 });
      left = 0;
    }
  }
  return out;
}

/**
 * Формирует план на день. Блоки по 5–15 (иногда 20) минут — микрообучение.
 * Приоритеты: диагностика → контрольная точка → новый урок → слабые темы → словарь → навыки по этапу.
 */
export function generateDayPlan(state: AppState, date: string, now = Date.now()): PlanBlock[] {
  const s = state.settings;
  const total = s.courseDays;
  const day = courseDay(s, date);
  const phase = phaseOf(Math.max(1, day), total);
  const split = minutesSplit(s);
  const cp = checkpointFor(day, total);
  const mock = mockDays(total).includes(day);
  const result: PlanBlock[] = [];
  const carry = state.carryover.filter((b) => !b.done);

  const emergencyLang: Lang | null = s.emergency?.active ? (s.emergency.exam === 'ielts' ? 'en' : 'kk') : null;
  for (const lang of ['en', 'kk'] as Lang[]) {
    const budget = split[lang];
    // В экстренном режиме для языка экзамена — только экзаменационные форматы и слабые места
    const ph: Phase = lang === emergencyLang ? 4 : phase;
    if (budget <= 0) continue;
    const c: PlanBlock[] = [];
    const L = lang === 'en' ? 'английского' : 'казахского';
    for (const b of carry.filter((x) => x.lang === lang)) c.push({ ...b, id: b.id + '-c', postponed: false, why: 'Перенесено с прошлого дня' });

    if (!state.diagnostics[lang].length) c.push(block(lang, 'diagnostic', `Диагностика ${L} (можно частями)`, 15, `#/diagnostic/${lang}`, undefined, 'Без диагностики план не персонализирован'));
    if (cp) c.push(block(lang, 'checkpoint', `Контрольная точка: ${cp.title}`, 15, `#/checkpoint/${lang}`, String(cp.base), `День ${day}: плановый контроль`));
    if ((mock && ph >= 3) || (lang === emergencyLang && day % 4 === 0)) c.push(block(lang, 'mock', lang === 'en' ? 'Пробная секция IELTS на время' : 'Пробный блок КАЗТЕСТ на время', 20, '#/exams', undefined, 'Плановая экзаменационная симуляция'));

    const weak = weakTopics(state, lang)[0];
    const next = nextLesson(state, lang);
    const lessonBlock = next ? block(lang, 'lesson', `Урок: ${getLesson(next)!.title}`, getLesson(next)!.minutes, `#/lesson/${next}`, next, 'Следующая тема программы') : null;
    const weakBlock = weak ? block(lang, 'topic', `Повторение слабой темы`, 10, `#/practice/${encodeURIComponent(weak.topic)}`, weak.topic, `Точность ${Math.round(weak.accuracy * 100)} %, открытых ошибок: ${weak.open}`) : null;
    const due = dueVocabCount(state, lang, now);
    const vocabBlock = block(lang, 'vocab', due ? `Повторение слов (${due} к повтору)` : 'Новые слова', 10, `#/vocab/review/${lang}`, undefined, due ? 'Интервальное повторение по FSRS' : 'Пополнение словаря');
    const openMistakes = state.mistakes.filter((m) => m.lang === lang && m.status === 'open').length;
    const mistakesBlock = openMistakes ? block(lang, 'mistakes', `Работа над ошибками (${openMistakes})`, 10, `#/mistakes/review/${lang}`, undefined, 'Новые упражнения по темам ваших ошибок') : null;

    if (ph <= 2) {
      if (lessonBlock) c.push(lessonBlock);
      if (weakBlock) c.push(weakBlock);
      c.push(vocabBlock);
      if (mistakesBlock) c.push(mistakesBlock);
      c.push(block(lang, 'dictation', 'Аудиодиктант', 10, `#/dictation/${lang}`));
      c.push(block(lang, 'pronunciation', 'Произношение: повтор за диктором', 5, `#/pronunciation/${lang}`));
      if (ph === 2) {
        if (lang === 'en') {
          c.push(block(lang, 'reading', 'IELTS Reading: стратегия', 15, '#/ielts/reading'));
          c.push(block(lang, 'speaking', 'Разговорная практика', 10, '#/conversation'));
          if (day % 3 === 0) c.push(block(lang, 'writing', 'IELTS Writing: короткое задание', 20, '#/ielts/writing'));
        } else {
          c.push(block(lang, 'listening', 'Тыңдалым: тренировка', 10, '#/kaztest/listening'));
          c.push(block(lang, 'speaking', 'Разговорная практика', 10, '#/conversation'));
        }
      }
    } else {
      // Этапы 3–4: экзаменационные форматы, новые темы — только если остались важные
      if (weakBlock) c.push(weakBlock);
      if (mistakesBlock) c.push(mistakesBlock);
      if (lang === 'en') {
        const rot = day % 4;
        c.push(rot === 0 ? block(lang, 'reading', 'IELTS Reading на время', 20, '#/ielts/reading') : rot === 1 ? block(lang, 'listening', 'IELTS Listening', 15, '#/ielts/listening') : rot === 2 ? block(lang, 'writing', 'IELTS Writing Task 2', 20, '#/ielts/writing') : block(lang, 'speaking', 'IELTS Speaking', 15, '#/ielts/speaking'));
      } else {
        const rot = day % 3;
        c.push(rot === 0 ? block(lang, 'reading', 'КАЗТЕСТ: Оқылым', 15, '#/kaztest/reading') : rot === 1 ? block(lang, 'listening', 'КАЗТЕСТ: Тыңдалым', 15, '#/kaztest/listening') : block(lang, 'writing', 'КАЗТЕСТ: Жазылым', 15, '#/kaztest/writing'));
      }
      c.push(vocabBlock);
      if (lessonBlock && ph === 3) c.push(lessonBlock);
      c.push(block(lang, 'speaking', lang === 'en' ? 'Speaking: ответы на вопросы' : 'Айтылым: ответы на вопросы', 10, lang === 'en' ? '#/ielts/speaking' : '#/kaztest/speaking'));
    }
    result.push(...fit(c, budget));
  }
  return result;
}

/** Сколько минут плана выполнено. */
export function planProgress(blocks: PlanBlock[]): { done: number; total: number; pct: number } {
  const total = blocks.reduce((a, b) => a + b.minutes, 0);
  const done = blocks.filter((b) => b.done).reduce((a, b) => a + b.minutes, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Рекомендуемая доля английского после диагностики (оба языка изучаются всегда). */
export function recommendEnShare(enLevel: string | null, kkLevel: string | null, kazTarget: string | null): number {
  const idx = (l: string | null) => (l ? ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'].indexOf(l) : -1);
  const enGap = Math.max(0, 3.5 - idx(enLevel)); // цель IELTS 5.0–5.5 ≈ B1–B1+
  const kkGap = Math.max(0, idx(kazTarget ?? 'B1') - idx(kkLevel));
  if (enLevel === null || kkLevel === null) return 2 / 3;
  const raw = enGap / Math.max(0.5, enGap + kkGap);
  return Math.min(0.8, Math.max(0.55, Math.round(raw * 20) / 20));
}
