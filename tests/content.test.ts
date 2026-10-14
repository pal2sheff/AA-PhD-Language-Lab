// Проверка целостности учебного контента: однозначные ответы, наличие объяснений, структура экзаменов.
import { describe, expect, it } from 'vitest';
import { LESSONS, allLessonExercises, lessonsFor } from '../src/data';
import type { Exercise } from '../src/data/types';
import { IELTS_READING_1 } from '../src/data/ielts/reading';
import { IELTS_LISTENING_1 } from '../src/data/ielts/listening';
import { KAZTEST_LISTENING_1, KAZTEST_READING_1 } from '../src/data/kaztest';
import { questionCount } from '../src/data/exam-types';
import { isCorrect, optionKey } from '../src/components/ExamRunner';
import { UNITS } from '../src/data/curriculum';
import { canonical } from '../src/lib/text';

const all: Exercise[] = LESSONS.flatMap((l) => [...l.warmup, ...l.practice, ...l.listening.questions, ...l.control, ...l.extra]);

describe('уроки', () => {
  it('минимум 10 полноценных уроков на каждый язык', () => {
    expect(lessonsFor('en').length).toBeGreaterThanOrEqual(10);
    expect(lessonsFor('kk').length).toBeGreaterThanOrEqual(10);
  });
  it('каждый урок содержит все этапы методики', () => {
    for (const l of LESSONS) {
      expect(l.goal, l.id).toBeTruthy();
      expect(l.theory.length, l.id).toBeGreaterThan(1);
      expect(l.examples.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.pitfalls.length, l.id).toBeGreaterThanOrEqual(2);
      expect(l.warmup.length, l.id).toBeGreaterThanOrEqual(1);
      expect(l.practice.length, l.id).toBeGreaterThanOrEqual(5);
      expect(l.listening.questions.length, l.id).toBeGreaterThanOrEqual(2);
      expect(l.control.length, l.id).toBeGreaterThanOrEqual(4);
      expect(l.vocab.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.simple, l.id).toBeTruthy();
    }
  });
  it('идентификаторы упражнений уникальны', () => {
    const ids = all.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('у каждого упражнения есть объяснение и корректный ответ', () => {
    for (const e of all) {
      expect(e.explain.length, e.id).toBeGreaterThan(3);
      if (e.type === 'mcq') {
        expect(e.answer, e.id).toBeLessThan(e.options.length);
        expect(new Set(e.options).size, `${e.id}: варианты не должны повторяться`).toBe(e.options.length);
      }
      if (e.type === 'listen' && e.mode === 'mcq') expect(e.answer!, e.id).toBeLessThan(e.options!.length);
      if (e.type === 'order') {
        // ответ должен состоять ровно из предложенных слов
        const words = canonical(e.words.join(' ')).split(' ').sort().join(' ');
        expect(e.answers.some((a) => canonical(a).split(' ').sort().join(' ') === words), e.id).toBe(true);
      }
      if (e.type === 'gap' || e.type === 'translate') expect(e.answers.length, e.id).toBeGreaterThan(0);
    }
  });
  it('вопросы аудирования без собственного аудио есть только в блоке listening', () => {
    for (const l of LESSONS) {
      for (const e of allLessonExercises(l)) if (e.type === 'listen') expect(e.say, e.id).toBeTruthy();
    }
  });
  it('все уроки программы существуют', () => {
    for (const u of [...UNITS.en, ...UNITS.kk]) if (u.lessonId) expect(LESSONS.some((l) => l.id === u.lessonId), u.id).toBe(true);
  });
});

describe('экзаменационные тесты', () => {
  it('IELTS Reading и Listening: ровно 40 вопросов, номера 1–40 по порядку', () => {
    for (const t of [IELTS_READING_1, IELTS_LISTENING_1]) {
      expect(questionCount(t)).toBe(40);
      const nums = [...(t.passages ?? []).flatMap((p) => p.groups), ...(t.parts ?? []).flatMap((p) => p.groups)].flatMap((g) => g.questions.map((q) => q.n));
      expect(nums).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    }
    expect(IELTS_READING_1.passages!.length).toBe(3);
    expect(IELTS_LISTENING_1.parts!.length).toBe(4);
  });
  it('КАЗТЕСТ Тыңдалым: 5 + 5 + 10 = 20 вопросов', () => {
    expect(KAZTEST_LISTENING_1.parts!.map((p) => p.groups.reduce((a, g) => a + g.questions.length, 0))).toEqual([5, 5, 10]);
    expect(KAZTEST_READING_1.fullFormat).toBe(false);
  });
  it('правильный ответ каждого вопроса выбора есть среди вариантов', () => {
    for (const t of [IELTS_READING_1, IELTS_LISTENING_1, KAZTEST_LISTENING_1, KAZTEST_READING_1]) {
      for (const g of [...(t.passages ?? []).flatMap((p) => p.groups), ...(t.parts ?? []).flatMap((p) => p.groups)]) {
        for (const q of g.questions) {
          if (g.type === 'complete' || g.type === 'short') {
            expect(isCorrect(g, q, q.answers[0]), `${t.id} q${q.n}`).toBe(true);
            continue;
          }
          const opts = q.options ?? g.options ?? [];
          const keys = opts.map((o) => optionKey(g, o));
          expect(keys, `${t.id} q${q.n}`).toContain(q.answers[0]);
          expect(isCorrect(g, q, q.answers[0])).toBe(true);
        }
      }
    }
  });
  it('учитывает ограничение по числу слов', () => {
    const g = IELTS_READING_1.passages![0].groups[1];
    const q = g.questions[0]; // motor traffic, NO MORE THAN TWO WORDS
    expect(isCorrect(g, q, 'motor traffic')).toBe(true);
    expect(isCorrect(g, q, 'the motor traffic of cars')).toBe(false);
  });
});
