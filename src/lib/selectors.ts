// Производные показатели для главной страницы, статистики и календаря.
import type { Lang } from '../data/types';
import type { AppState } from './state';
import { addDays, diffDays, today, weekday } from './dates';
import { wordStatus } from './srs';
import { UNITS } from '../data/curriculum';
import { checkpointDays, courseDay } from './planner';

export function streak(state: AppState, date = today()): number {
  let n = 0;
  let d = date;
  // Сегодня ещё может быть не начато — тогда считаем с вчерашнего дня.
  if (!((state.activity[d]?.seconds ?? 0) >= 300)) d = addDays(d, -1);
  while ((state.activity[d]?.seconds ?? 0) >= 300 || state.settings.restWeekdays.includes(weekday(d))) {
    if ((state.activity[d]?.seconds ?? 0) >= 300) n++;
    d = addDays(d, -1);
    if (n > 400 || diffDays(d, state.settings.startDate) > 0) break;
  }
  return n;
}

export function vocabStats(state: AppState, lang?: Lang, now = Date.now()) {
  const s = { total: 0, new: 0, learning: 0, due: 0, mastered: 0, nextDue: null as number | null };
  for (const v of Object.values(state.vocab)) {
    if (lang && v.lang !== lang) continue;
    s.total++;
    const st = wordStatus(v.card, now);
    s[st]++;
    if (v.card.state !== 'new' && v.card.due > now && (s.nextDue === null || v.card.due < s.nextDue)) s.nextDue = v.card.due;
  }
  return s;
}

export function lessonProgress(state: AppState, lang: Lang) {
  const units = UNITS[lang];
  const withLesson = units.filter((u) => u.lessonId);
  const passed = withLesson.filter((u) => state.lessons[u.lessonId!]?.passed).length;
  return { totalUnits: units.length, lessonsAvailable: withLesson.length, passed, pctOfProgram: Math.round((passed / units.length) * 100) };
}

export function latestDiag(state: AppState, lang: Lang) {
  return state.diagnostics[lang].at(-1) ?? null;
}

export function firstDiag(state: AppState, lang: Lang) {
  return state.diagnostics[lang][0] ?? null;
}

export function nextCheckpoint(state: AppState, date = today()) {
  const day = courseDay(state.settings, date);
  return checkpointDays(state.settings.courseDays).find((c) => c.day >= day && c.base !== 1) ?? null;
}

export function accuracy(state: AppState, lang?: Lang) {
  let a = 0;
  let c = 0;
  for (const [t, s] of Object.entries(state.topics)) {
    if (lang && !t.startsWith(lang + '.')) continue;
    a += s.attempts;
    c += s.correct;
  }
  return { answered: a, correct: c, pct: a ? Math.round((c / a) * 100) : null };
}

export function studyDaysCount(state: AppState) {
  return Object.values(state.activity).filter((a) => a.seconds >= 300).length;
}

/** Последние результаты секций экзамена (только реальные попытки). */
export function latestSections(state: AppState, exam: 'ielts' | 'kaztest') {
  const out: Record<string, (typeof state.exams)[number]> = {};
  for (const e of state.exams) if (e.exam === exam && (!out[e.section] || out[e.section].finishedAt < e.finishedAt)) out[e.section] = e;
  return out;
}

export function weakSkills(state: AppState, lang: Lang): string[] {
  const d = latestDiag(state, lang);
  if (!d) return [];
  const order = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
  const tested = Object.entries(d.skills).filter(([, v]) => v?.tested && v.level);
  if (!tested.length) return [];
  const min = Math.min(...tested.map(([, v]) => order.indexOf(v!.level!)));
  return tested.filter(([, v]) => order.indexOf(v!.level!) === min).map(([k]) => k);
}

export const SKILL_NAMES: Record<string, string> = {
  grammar: 'Грамматика',
  vocab: 'Лексика',
  reading: 'Чтение',
  listening: 'Аудирование',
  writing: 'Письмо',
  speaking: 'Говорение',
};
