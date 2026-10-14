// Адаптивная диагностика: «лестничный» алгоритм.
// Верный ответ → следующий вопрос на уровень выше, неверный → на уровень ниже.
// Уровень навыка = самый высокий уровень, на котором пользователь ответил верно
// не менее чем на 60 % вопросов (минимум 2 вопроса на этом уровне).

import type { DiagItem, Level } from '../data/types';

export const DIAG_LEVELS: Exclude<Level, 'A0'>[] = ['A1', 'A2', 'B1', 'B2'];
export const ITEMS_PER_SKILL = 6;
export const OBJECTIVE_SKILLS = ['grammar', 'vocab', 'reading', 'listening'] as const;
export type ObjectiveSkill = (typeof OBJECTIVE_SKILLS)[number];

export interface DiagAnswer {
  itemId: string;
  level: Exclude<Level, 'A0'>;
  topic: string;
  correct: boolean;
}

export interface SkillSession {
  skill: ObjectiveSkill;
  levelIdx: number;
  answers: DiagAnswer[];
  done: boolean;
}

export function newSkillSession(skill: ObjectiveSkill, startLevel: Exclude<Level, 'A0'> = 'A2'): SkillSession {
  return { skill, levelIdx: DIAG_LEVELS.indexOf(startLevel), answers: [], done: false };
}

/** Выбор следующего вопроса: текущий уровень, иначе ближайший уровень с неиспользованными вопросами. */
export function pickNextItem(bank: DiagItem[], s: SkillSession): DiagItem | null {
  if (s.done || s.answers.length >= ITEMS_PER_SKILL) return null;
  const used = new Set(s.answers.map((a) => a.itemId));
  const pool = bank.filter((i) => i.skill === s.skill && !used.has(i.id));
  if (!pool.length) return null;
  for (let dist = 0; dist < DIAG_LEVELS.length; dist++) {
    for (const idx of [s.levelIdx - dist, s.levelIdx + dist]) {
      if (idx < 0 || idx >= DIAG_LEVELS.length) continue;
      const cand = pool.filter((i) => i.level === DIAG_LEVELS[idx]);
      if (cand.length) return cand[0];
    }
  }
  return null;
}

export function answerItem(s: SkillSession, item: DiagItem, correct: boolean): SkillSession {
  const answers = [...s.answers, { itemId: item.id, level: item.level, topic: item.topic, correct }];
  const cur = DIAG_LEVELS.indexOf(item.level);
  const levelIdx = Math.max(0, Math.min(DIAG_LEVELS.length - 1, cur + (correct ? 1 : -1)));
  return { ...s, answers, levelIdx, done: answers.length >= ITEMS_PER_SKILL };
}

export interface SkillEstimate {
  level: Level | null;
  correct: number;
  total: number;
  confidence: 'low' | 'medium';
}

export function estimateLevel(answers: DiagAnswer[]): SkillEstimate {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  if (!total) return { level: null, correct, total, confidence: 'low' };
  let level: Level = 'A0';
  for (const lv of DIAG_LEVELS) {
    const at = answers.filter((a) => a.level === lv);
    if (at.length >= 2 && at.filter((a) => a.correct).length / at.length >= 0.6) level = lv;
    else if (at.length === 1 && at[0].correct && lv !== 'A1') {
      // Один верный ответ на уровне — уровень не подтверждён, но предыдущий засчитываем,
      // если на нём не было провалов.
      const prev = DIAG_LEVELS[DIAG_LEVELS.indexOf(lv) - 1];
      const prevAns = answers.filter((a) => a.level === prev);
      if (prevAns.length && prevAns.every((a) => a.correct)) level = prev;
    }
  }
  if (level === 'A0') {
    // Нет подтверждённого уровня: если есть хотя бы один верный ответ A1 — «A1 (неуверенно)»
    const a1 = answers.filter((a) => a.level === 'A1');
    if (a1.some((a) => a.correct)) level = 'A1';
  }
  return { level, correct, total, confidence: total >= ITEMS_PER_SKILL ? 'medium' : 'low' };
}

/** Темы, в которых были ошибки — кандидаты в «грамматические пробелы». */
export function gapTopics(answers: DiagAnswer[]): string[] {
  const wrong = new Map<string, number>();
  for (const a of answers) if (!a.correct) wrong.set(a.topic, (wrong.get(a.topic) ?? 0) + 1);
  return [...wrong.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

const ORDER: Level[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
export function levelIndex(l: Level | null | undefined): number {
  return l ? ORDER.indexOf(l) : -1;
}

/** Общий уровень — медиана проверенных навыков (короткий тест не даёт официального уровня). */
export function overallLevel(levels: (Level | null | undefined)[]): Level | null {
  const idx = levels.map(levelIndex).filter((i) => i >= 0).sort((a, b) => a - b);
  if (!idx.length) return null;
  return ORDER[idx[Math.floor((idx.length - 1) / 2)]];
}
