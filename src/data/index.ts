// Реестр учебного контента.
import type { Exercise, Lang, Lesson, VocabSeed } from './types';
import { enLesson01, enLesson02, enLesson03, enLesson04, enLesson05, enLesson06 } from './en/lessons1';
import { enLesson07, enLesson08, enLesson09, enLesson10, enLesson11, enLesson12 } from './en/lessons2';
import { kkLesson01, kkLesson02, kkLesson03, kkLesson04, kkLesson05, kkLesson06 } from './kk/lessons1';
import { kkLesson07, kkLesson08, kkLesson09, kkLesson10, kkLesson11, kkLesson12 } from './kk/lessons2';
import { EN_VOCAB, KK_VOCAB } from './vocab';
import { UNITS } from './curriculum';
import { MED_EXERCISES } from './medical';

export const LESSONS: Lesson[] = [
  enLesson01, enLesson02, enLesson03, enLesson04, enLesson05, enLesson06,
  enLesson07, enLesson08, enLesson09, enLesson10, enLesson11, enLesson12,
  kkLesson01, kkLesson02, kkLesson03, kkLesson04, kkLesson05, kkLesson06,
  kkLesson07, kkLesson08, kkLesson09, kkLesson10, kkLesson11, kkLesson12,
];

const byId = new Map(LESSONS.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson | undefined {
  return byId.get(id);
}

/** Уроки языка в порядке учебной программы. */
export function lessonsFor(lang: Lang): Lesson[] {
  const order = UNITS[lang].map((u) => u.lessonId).filter(Boolean) as string[];
  return order.map((id) => byId.get(id)!).filter(Boolean);
}

export function allLessonExercises(l: Lesson): Exercise[] {
  return [...l.warmup, ...l.practice, ...l.listening.questions.filter((q) => q.type !== 'listen' || q.say), ...l.control, ...l.extra];
}

/** Все упражнения по теме (для «Дай ещё упражнение» и повторения ошибок). */
export function exercisesForTopic(topic: string): Exercise[] {
  const out: Exercise[] = [];
  for (const l of LESSONS) for (const ex of allLessonExercises(l)) if (ex.topic === topic) out.push(ex);
  for (const ex of MED_EXERCISES) if (ex.topic === topic) out.push(ex);
  return out;
}

export function findExercise(id: string): { ex: Exercise; lesson: Lesson } | undefined {
  for (const l of LESSONS) {
    for (const ex of [...l.warmup, ...l.practice, ...l.listening.questions, ...l.control, ...l.extra]) if (ex.id === id) return { ex, lesson: l };
  }
  return undefined;
}

export function lessonForTopic(topic: string): Lesson | undefined {
  return LESSONS.find((l) => l.topic === topic);
}

export const VOCAB_SEEDS: Record<Lang, VocabSeed[]> = {
  en: [...EN_VOCAB, ...LESSONS.filter((l) => l.lang === 'en').flatMap((l) => l.vocab)],
  kk: [...KK_VOCAB, ...LESSONS.filter((l) => l.lang === 'kk').flatMap((l) => l.vocab)],
};

export function vocabCategories(lang: Lang): string[] {
  return [...new Set(VOCAB_SEEDS[lang].map((v) => v.cat))];
}
