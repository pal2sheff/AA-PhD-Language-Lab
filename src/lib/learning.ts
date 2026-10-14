// Действия обучения: запись ответов, ошибки, словарь, активность, план дня.
import type { Draft } from 'immer';
import type { Exercise, Lang, MistakeCategory, VocabSeed } from '../data/types';
import type { AppState, BlockKind, Mistake, PlanBlock } from './state';
import { emptyDay } from './state';
import { getState, update } from './store';
import { today } from './dates';
import { newCard, review, type Grade } from './srs';
import { generateDayPlan } from './planner';
import { uid } from './text';

function day(d: Draft<AppState>, date = today()) {
  return (d.activity[date] ??= emptyDay());
}

export function correctAnswerText(ex: Exercise): string {
  switch (ex.type) {
    case 'mcq':
      return ex.options[ex.answer];
    case 'gap':
    case 'order':
    case 'translate':
      return ex.answers[0];
    case 'listen':
      return ex.mode === 'mcq' ? ex.options![ex.answer!] : ex.answers![0];
  }
}

export function exercisePrompt(ex: Exercise): string {
  switch (ex.type) {
    case 'translate':
      return `Переведите: «${ex.source}»`;
    case 'order':
      return `Составьте предложение: ${ex.words.join(' / ')}`;
    case 'listen':
      return `${ex.prompt}${ex.say ? ` (аудио: «${ex.say}»)` : ''}`;
    default:
      return ex.prompt;
  }
}

function categoryOf(ex: Exercise, fallback: MistakeCategory): MistakeCategory {
  if (ex.category) return ex.category;
  if (ex.type === 'listen') return 'listening';
  return fallback;
}

/** Записывает ответ: статистика темы, активность дня, ошибки. */
export function recordAnswer(ex: Exercise, lang: Lang, correct: boolean, userAnswer: string, fallbackCategory: MistakeCategory = 'grammar') {
  update((d) => {
    const t = (d.topics[ex.topic] ??= { attempts: 0, correct: 0, recent: [], lastAt: 0 });
    t.attempts++;
    if (correct) t.correct++;
    t.recent.push(correct ? 1 : 0);
    if (t.recent.length > 10) t.recent.splice(0, t.recent.length - 10);
    t.lastAt = Date.now();
    const a = day(d);
    a.answered++;
    if (correct) a.correct++;
    d.seenExercises[ex.id] = Date.now();

    const existing = d.mistakes.find((m) => m.key === ex.id);
    if (!correct) {
      if (existing) {
        existing.count++;
        existing.lastAt = Date.now();
        existing.userAnswer = userAnswer;
        existing.status = 'open';
      } else {
        const m: Mistake = {
          id: uid('m'),
          key: ex.id,
          lang,
          category: categoryOf(ex, fallbackCategory),
          topic: ex.topic,
          prompt: exercisePrompt(ex),
          userAnswer,
          correct: correctAnswerText(ex),
          explain: ex.explain,
          firstAt: Date.now(),
          lastAt: Date.now(),
          count: 1,
          status: 'open',
        };
        d.mistakes.unshift(m);
      }
    } else {
      // Тема считается исправленной, когда на НОВЫЕ задания той же темы даны 2 верных ответа подряд.
      const recent = t.recent.slice(-2);
      if (recent.length === 2 && recent.every((x) => x === 1)) {
        for (const m of d.mistakes) if (m.topic === ex.topic && m.status === 'open' && m.key !== ex.id) m.status = 'fixed';
      }
    }
  });
}

/** Ошибка вне упражнений (письмо, речь, диктант). */
export function recordFreeMistake(m: Omit<Mistake, 'id' | 'firstAt' | 'lastAt' | 'count' | 'status'>) {
  update((d) => {
    const ex = d.mistakes.find((x) => x.key === m.key);
    if (ex) {
      ex.count++;
      ex.lastAt = Date.now();
      ex.status = 'open';
      ex.userAnswer = m.userAnswer;
      return;
    }
    d.mistakes.unshift({ ...m, id: uid('m'), firstAt: Date.now(), lastAt: Date.now(), count: 1, status: 'open' });
  });
}

export function setMistakeStatus(id: string, status: Mistake['status']) {
  update((d) => {
    const m = d.mistakes.find((x) => x.id === id);
    if (m) m.status = status;
  });
}

export function dropMistakeByKey(key: string) {
  update((d) => {
    const m = d.mistakes.find((x) => x.key === key);
    if (!m) return;
    if (m.count > 1) m.count--;
    else d.mistakes = d.mistakes.filter((x) => x.key !== key);
  });
}

export function deleteMistake(id: string) {
  update((d) => {
    d.mistakes = d.mistakes.filter((x) => x.id !== id);
  });
}

// ─── Активное время ───────────────────────────────────────────────────────

export function addStudySeconds(lang: Lang | null, seconds: number) {
  if (seconds <= 0) return;
  update((d) => {
    const a = day(d);
    a.seconds += seconds;
    if (lang) a[lang] += seconds;
  });
}

// ─── Уроки ────────────────────────────────────────────────────────────────

export const PASS_THRESHOLD = 0.7;

export function startLesson(id: string) {
  update((d) => {
    const p = (d.lessons[id] ??= { startedAt: Date.now(), completedAt: null, attempts: 0, lastControl: 0, bestControl: 0, passed: false, step: 0 });
    p.attempts++;
  });
}

export function setLessonStep(id: string, step: number) {
  update((d) => {
    const p = d.lessons[id];
    if (p) p.step = step;
  });
}

export function finishLesson(id: string, lang: Lang, controlScore: number) {
  update((d) => {
    const p = (d.lessons[id] ??= { startedAt: Date.now(), completedAt: null, attempts: 1, lastControl: 0, bestControl: 0, passed: false, step: 0 });
    p.lastControl = controlScore;
    p.bestControl = Math.max(p.bestControl, controlScore);
    p.completedAt = Date.now();
    if (controlScore >= PASS_THRESHOLD) p.passed = true;
    const a = day(d);
    if (!a.lessons.includes(id)) a.lessons.push(id);
  });
  markBlockDone('lesson', lang, id);
}

// ─── Словарь ──────────────────────────────────────────────────────────────

export function addVocab(seeds: VocabSeed[], source: string): number {
  let added = 0;
  update((d) => {
    for (const s of seeds) {
      if (d.vocab[s.id]) continue;
      d.vocab[s.id] = { ...s, addedAt: Date.now(), source, card: newCard(), history: [] };
      added++;
    }
  });
  return added;
}

export function addCustomWord(lang: Lang, word: string, tr: string, ex: string, exRu: string, cat: string) {
  const id = `${lang}-custom-${uid()}`;
  update((d) => {
    d.vocab[id] = { id, lang, word, tr, ex, exRu, cat, level: 'A2', addedAt: Date.now(), source: 'Добавлено вручную', card: newCard(), history: [] };
  });
  return id;
}

export function removeVocab(id: string) {
  update((d) => {
    delete d.vocab[id];
  });
}

export function reviewWord(id: string, grade: Grade, mode: string) {
  update((d) => {
    const v = d.vocab[id];
    if (!v) return;
    v.card = review(v.card, grade);
    v.history.push({ at: Date.now(), grade, mode });
    if (v.history.length > 30) v.history.splice(0, v.history.length - 30);
    day(d).reviews++;
  });
}

// ─── План дня ─────────────────────────────────────────────────────────────

export function ensureTodayPlan(date = today()): PlanBlock[] {
  const s = getState();
  if (s.plans[date]) return s.plans[date].blocks;
  const blocks = generateDayPlan(s, date);
  update((d) => {
    d.plans[date] = { date, createdAt: Date.now(), blocks };
    // перенесённые блоки использованы
    d.carryover = [];
  });
  return blocks;
}

export function regenerateTodayPlan(date = today()) {
  const s = getState();
  const old = s.plans[date]?.blocks ?? [];
  const fresh = generateDayPlan({ ...s, carryover: [] }, date);
  // Сохраняем отметки о выполнении
  const doneKeys = new Set(old.filter((b) => b.done).map((b) => b.kind + b.lang + (b.ref ?? '')));
  update((d) => {
    d.plans[date] = { date, createdAt: Date.now(), blocks: fresh.map((b) => ({ ...b, done: doneKeys.has(b.kind + b.lang + (b.ref ?? '')) })) };
  });
}

export function markBlockDone(kind: BlockKind, lang: Lang, ref?: string, date = today()) {
  update((d) => {
    const p = d.plans[date];
    if (!p) return;
    const b = p.blocks.find((x) => !x.done && x.kind === kind && x.lang === lang && (!ref || !x.ref || x.ref === ref));
    if (b) b.done = true;
  });
}

export function moveBlock(id: string, dir: -1 | 1, date = today()) {
  update((d) => {
    const p = d.plans[date];
    if (!p) return;
    const i = p.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= p.blocks.length) return;
    [p.blocks[i], p.blocks[j]] = [p.blocks[j], p.blocks[i]];
  });
}

export function postponeBlock(id: string, date = today()) {
  update((d) => {
    const p = d.plans[date];
    if (!p) return;
    const b = p.blocks.find((x) => x.id === id);
    if (!b) return;
    p.blocks = p.blocks.filter((x) => x.id !== id);
    d.carryover.push({ ...b, postponed: true });
  });
}

export function addBlockToToday(b: Omit<PlanBlock, 'id' | 'done'>, date = today()) {
  update((d) => {
    const p = (d.plans[date] ??= { date, createdAt: Date.now(), blocks: [] });
    p.blocks.push({ ...b, id: uid('b'), done: false });
  });
}

export function toggleBlockDone(id: string, date = today()) {
  update((d) => {
    const b = d.plans[date]?.blocks.find((x) => x.id === id);
    if (b) b.done = !b.done;
  });
}
