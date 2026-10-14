import { describe, expect, it } from 'vitest';
import { canonical, diffWords, levenshtein, matchAnswer, wordCount } from '../src/lib/text';
import { newCard, review, wordStatus, nextIntervalDays, retrievability } from '../src/lib/srs';
import { answerItem, estimateLevel, newSkillSession, overallLevel, pickNextItem, ITEMS_PER_SKILL } from '../src/lib/diagnostic';
import { EN_DIAG, KK_DIAG } from '../src/data/diagnostic';
import { ieltsOverall, listeningBand, readingBand, roundIeltsOverall, writingBand, kaztestPassCheck } from '../src/lib/scoring';
import { addDays, diffDays } from '../src/lib/dates';
import { ieltsFeasibility } from '../src/lib/feasibility';
import { checkWriting } from '../src/lib/writingCheck';

describe('сравнение ответов', () => {
  it('нормализует регистр, пунктуацию и сокращения', () => {
    expect(canonical("I'm a Doctor.")).toBe('i am a doctor');
    expect(canonical('They aren’t here')).toBe('they are not here');
    expect(matchAnswer("I'm a doctor", ['I am a doctor']).result).toBe('exact');
  });
  it('допускает одну опечатку только в длинных словах', () => {
    expect(matchAnswer('studys', ['studies']).result).toBe('wrong'); // 2 правки
    expect(matchAnswer('studie', ['studies']).result).toBe('typo');
    expect(matchAnswer('it', ['is']).result).toBe('wrong');
  });
  it('считает слова, включая казахские буквы', () => {
    expect(wordCount('Мен дәрігермін. Сіз қайдансыз?')).toBe(4);
    expect(wordCount("It's a well-known fact")).toBe(4);
  });
  it('levenshtein и пословный diff', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    const d = diffWords('My wife works at a school', 'my wife work at school');
    expect(d.filter((x) => !x.ok).map((x) => x.word)).toEqual(['works', 'a']);
  });
});

describe('FSRS', () => {
  const DAY = 86400000;
  it('интервал равен стабильности при целевой вероятности 0,9', () => {
    expect(nextIntervalDays(10)).toBe(10);
    expect(retrievability(0, 5)).toBeCloseTo(1);
  });
  it('слово не становится освоенным после одного правильного ответа', () => {
    let c = newCard(0);
    c = review(c, 3, 0);
    expect(wordStatus(c, 1000)).not.toBe('mastered');
    c = review(c, 3, 10 * 60000);
    expect(c.state).toBe('review');
    expect(wordStatus(c, 11 * 60000)).not.toBe('mastered');
  });
  it('серия верных ответов увеличивает стабильность до «освоено»', () => {
    let c = newCard(0);
    let t = 0;
    for (let i = 0; i < 8 && wordStatus(c, t + 1) !== 'mastered'; i++) {
      c = review(c, 3, t);
      t = c.due;
    }
    expect(c.reps).toBeGreaterThanOrEqual(3);
    expect(c.stability).toBeGreaterThanOrEqual(21);
  });
  it('ошибка возвращает карточку в переобучение и считает провал', () => {
    let c = review(newCard(0), 3, 0);
    c = review(c, 3, 10 * 60000);
    const before = c.stability;
    c = review(c, 1, c.due + DAY);
    expect(c.lapses).toBe(1);
    expect(c.state).toBe('relearning');
    expect(c.stability).toBeLessThan(before);
  });
});

describe('адаптивная диагностика', () => {
  it('поднимает уровень после верного ответа и опускает после неверного', () => {
    let s = newSkillSession('grammar');
    const first = pickNextItem(EN_DIAG, s)!;
    expect(first.level).toBe('A2');
    s = answerItem(s, first, true);
    expect(pickNextItem(EN_DIAG, s)!.level).toBe('B1');
    const second = pickNextItem(EN_DIAG, s)!;
    s = answerItem(s, second, false);
    expect(pickNextItem(EN_DIAG, s)!.level).toBe('A2');
  });
  it('не повторяет вопросы и завершается после 6 заданий', () => {
    for (const bank of [EN_DIAG, KK_DIAG])
      for (const skill of ['grammar', 'vocab', 'reading', 'listening'] as const) {
        let s = newSkillSession(skill);
        const seen = new Set<string>();
        for (let i = 0; i < 10; i++) {
          const it = pickNextItem(bank, s);
          if (!it) break;
          expect(seen.has(it.id)).toBe(false);
          seen.add(it.id);
          s = answerItem(s, it, i % 2 === 0);
        }
        expect(s.answers.length).toBe(ITEMS_PER_SKILL);
      }
  });
  it('оценивает уровень по устойчивой точности', () => {
    const a = (level: 'A1' | 'A2' | 'B1' | 'B2', correct: boolean) => ({ itemId: Math.random() + '', level, topic: 't', correct });
    expect(estimateLevel([a('A2', true), a('B1', false), a('A2', true), a('B1', false), a('A2', true), a('B1', false)]).level).toBe('A2');
    expect(estimateLevel([a('A2', true), a('B1', true), a('B2', true), a('B2', true), a('B2', true), a('B2', true)]).level).toBe('B2');
    expect(estimateLevel([a('A2', false), a('A1', false), a('A1', false)]).level).toBe('A0');
    expect(overallLevel(['A2', 'B1', 'A2', null])).toBe('A2');
  });
  it('у каждого вопроса банка корректный индекс ответа', () => {
    for (const it of [...EN_DIAG, ...KK_DIAG]) {
      expect(it.answer).toBeGreaterThanOrEqual(0);
      expect(it.answer).toBeLessThan(it.options.length);
    }
  });
});

describe('шкалы IELTS и КАЗТЕСТ', () => {
  it('переводит сырые баллы в band', () => {
    expect(listeningBand(40)).toBe(9);
    expect(listeningBand(23)).toBe(6);
    expect(listeningBand(18)).toBe(5.5);
    expect(listeningBand(16)).toBe(5);
    expect(readingBand(30)).toBe(7);
    expect(readingBand(23)).toBe(6);
    expect(readingBand(15)).toBe(5);
  });
  it('округляет общий балл по правилам IELTS', () => {
    expect(roundIeltsOverall(6.125)).toBe(6);
    expect(roundIeltsOverall(6.25)).toBe(6.5);
    expect(roundIeltsOverall(6.75)).toBe(7);
    expect(ieltsOverall({ listening: 5.5, reading: 5, writing: 5, speaking: 5.5 })).toBe(5.5);
  });
  it('не считает общий балл без всех четырёх компонентов', () => {
    expect(ieltsOverall({ listening: 6, reading: 6, writing: 6 })).toBeNull();
  });
  it('Task 2 весит вдвое больше Task 1', () => {
    expect(writingBand(4, 6)).toBe(5); // (4 + 2·6) / 3 = 5.33 → консервативно вниз до 5.0
    expect(writingBand(4, 6)).toBeGreaterThan(writingBand(6, 4));
    expect(writingBand(6, 4)).toBe(4.5);
  });
  it('КАЗТЕСТ: без порогов результат не оценивается как «сдано»', () => {
    const r = kaztestPassCheck({ listening: { correct: 15, total: 20 } }, null);
    expect(r.find((x) => x.block === 'listening')).toEqual({ block: 'listening', percent: 75, passed: null });
    const r2 = kaztestPassCheck({ listening: { correct: 15, total: 20 } }, { source: 'doc', level: 'B1', unit: 'percent', perBlock: { listening: 60 } });
    expect(r2.find((x) => x.block === 'listening')!.passed).toBe(true);
  });
});

describe('даты и реалистичность цели', () => {
  it('арифметика дат', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(diffDays('2026-01-01', '2026-03-01')).toBe(59);
  });
  it('с уровня A2 при 60 мин/день за 90 дней IELTS 5.5 маловероятен', () => {
    const f = ieltsFeasibility('A2', 5.5, 60, 90);
    expect(f.verdict).toBe('unlikely');
    expect(f.minutesPerDayNeeded).toBeGreaterThan(60);
  });
  it('с уровня B1 цель 5.0 реалистична', () => {
    expect(ieltsFeasibility('B1', 5.0, 60, 90).verdict).not.toBe('unlikely');
  });
  it('без диагностики оценки нет', () => {
    expect(ieltsFeasibility(null, 5, 60, 90).verdict).toBe('unknown');
  });
});

describe('автопроверка письма', () => {
  it('находит типичные ошибки русскоязычных', () => {
    const r = checkWriting('I am agree with this. People is busy. We need more informations. She have a car. In conclusion, it is more better.', 'en', 'ielts2', 'Discuss both views and give your opinion');
    const msgs = r.findings.map((f) => f.excerpt?.toLowerCase());
    expect(msgs).toContain('i am agree');
    expect(msgs).toContain('people is');
    expect(msgs).toContain('informations');
    expect(msgs).toContain('she have');
    expect(msgs).toContain('more better');
    expect(r.structure.some((s) => !s.ok && s.message.includes('250'))).toBe(true);
  });
  it('не помечает does she work как ошибку', () => {
    const r = checkWriting('Does she work at the hospital? Yes, and he wants to stay.', 'en', 'free');
    expect(r.findings.some((f) => f.excerpt?.toLowerCase() === 'she work')).toBe(false);
  });
  it('казахский: проверяет окончания множественного числа', () => {
    const r = checkWriting('Біздің қалада кітаплар көп. Балалар мектепке барады. Сонымен қатар адамлар жұмыс істейді.', 'kk', 'free');
    const ex = r.findings.map((f) => f.excerpt);
    expect(ex).toContain('кітаплар');
    expect(ex).toContain('адамлар');
    expect(ex).not.toContain('балалар');
    expect(ex).not.toContain('қатар');
  });
});
