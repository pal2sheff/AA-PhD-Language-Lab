// Сохранение, миграция данных, план дня и запись ошибок.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultState, migrate } from '../src/lib/state';
import { loadRaw, saveRaw } from '../src/lib/storage';
import { __resetForTests, getState, update, flush, initStore } from '../src/lib/store';
import { recordAnswer, addVocab, ensureTodayPlan, markBlockDone, postponeBlock, finishLesson } from '../src/lib/learning';
import { buildCalendar, generateDayPlan, phaseOf, checkpointDays, courseDay, minutesSplit, weakTopics, nextLesson } from '../src/lib/planner';
import { getLesson } from '../src/data';
import { addDays, today } from '../src/lib/dates';
import { exportJson, importJson } from '../src/lib/backup';

beforeEach(() => {
  __resetForTests(defaultState());
  localStorage.clear();
});

describe('хранение данных', () => {
  it('сохраняет и восстанавливает состояние из IndexedDB', async () => {
    const s = defaultState();
    s.onboarded = true;
    s.settings.dailyMinutes = 45;
    await saveRaw(s);
    const { data, source } = await loadRaw();
    expect(source).toBe('indexeddb');
    expect(migrate(data).settings.dailyMinutes).toBe(45);
  });
  it('повторное открытие приложения продолжает с сохранённого места', async () => {
    update((d) => {
      d.onboarded = true;
      d.lessons['en-01'] = { startedAt: 1, completedAt: null, attempts: 1, lastControl: 0, bestControl: 0, passed: false, step: 5 };
    });
    await flush();
    __resetForTests(defaultState());
    expect(getState().lessons['en-01']).toBeUndefined();
    await initStore();
    expect(getState().lessons['en-01'].step).toBe(5);
    expect(getState().onboarded).toBe(true);
  });
  it('миграция добавляет новые поля и сохраняет старые данные', () => {
    const old = JSON.parse(JSON.stringify(defaultState()));
    delete old.settings.emergency;
    delete old.conversations;
    old.vocab = { x: { id: 'x' } };
    const m = migrate(old);
    expect(m.settings.emergency.active).toBe(false);
    expect(m.conversations).toEqual([]);
    expect(m.vocab.x).toBeTruthy();
  });
  it('отклоняет чужие файлы', () => {
    expect(() => migrate({ foo: 1 })).toThrow();
    expect(() => migrate('строка')).toThrow();
  });
  it('экспорт и импорт JSON', () => {
    update((d) => void (d.settings.courseDays = 180));
    const json = exportJson();
    __resetForTests(defaultState());
    importJson(json);
    expect(getState().settings.courseDays).toBe(180);
  });
});

describe('программа и календарь', () => {
  it('этапы масштабируются по длительности курса', () => {
    expect([phaseOf(1, 90), phaseOf(14, 90), phaseOf(15, 90), phaseOf(45, 90), phaseOf(46, 90), phaseOf(76, 90)]).toEqual([1, 1, 2, 2, 3, 4]);
    expect(phaseOf(28, 180)).toBe(1);
    expect(phaseOf(29, 180)).toBe(2);
    expect(checkpointDays(90).map((c) => c.day)).toEqual([1, 14, 30, 45, 60, 75, 90]);
    expect(checkpointDays(180).map((c) => c.day)).toEqual([1, 28, 60, 90, 120, 150, 180]);
  });
  it('календарь содержит все дни; смена срока не удаляет историю', () => {
    const s = getState();
    const cal = buildCalendar(s, today());
    expect(cal.days.length).toBe(90);
    update((d) => {
      d.activity[today()] = { seconds: 600, en: 600, kk: 0, answered: 3, correct: 2, lessons: [], reviews: 0 };
      d.settings.courseDays = 270;
    });
    const cal2 = buildCalendar(getState(), today());
    expect(cal2.days.length).toBe(270);
    expect(getState().activity[today()].seconds).toBe(600);
  });
  it('пропущенные дни не создают перегрузку: темы сдвигаются вперёд', () => {
    update((d) => void (d.settings.startDate = addDays(today(), -20)));
    const s = getState();
    const plan = generateDayPlan(s, today());
    const total = plan.reduce((a, b) => a + b.minutes, 0);
    expect(total).toBeLessThanOrEqual(s.settings.dailyMinutes);
    expect(courseDay(s.settings, today())).toBe(21);
  });
  it('план дня укладывается в нагрузку и учитывает распределение языков', () => {
    for (const minutes of [30, 45, 60, 90, 120] as const) {
      update((d) => void (d.settings.dailyMinutes = minutes));
      const s = getState();
      const plan = generateDayPlan(s, today());
      const split = minutesSplit(s.settings);
      const en = plan.filter((b) => b.lang === 'en').reduce((a, b) => a + b.minutes, 0);
      const kk = plan.filter((b) => b.lang === 'kk').reduce((a, b) => a + b.minutes, 0);
      expect(en).toBeLessThanOrEqual(split.en);
      expect(kk).toBeLessThanOrEqual(split.kk);
      expect(kk).toBeGreaterThan(0); // оба языка изучаются всегда
      expect(plan.every((b) => b.minutes >= 5 && b.minutes <= 20)).toBe(true);
    }
  });
  it('без диагностики первым идёт диагностический блок', () => {
    const plan = generateDayPlan(getState(), today());
    expect(plan[0].kind).toBe('diagnostic');
  });
  it('отложенный блок переносится на следующий день', () => {
    ensureTodayPlan();
    const b = getState().plans[today()].blocks[0];
    postponeBlock(b.id);
    expect(getState().carryover[0].kind).toBe(b.kind);
    const tomorrow = generateDayPlan(getState(), addDays(today(), 1));
    expect(tomorrow.some((x) => x.why === 'Перенесено с прошлого дня')).toBe(true);
  });
});

describe('ошибки и адаптация', () => {
  const ex = getLesson('en-06')!.practice[0];
  const ex2 = getLesson('en-06')!.practice[1];
  it('ошибка сохраняется с объяснением и счётчиком повторов', () => {
    recordAnswer(ex, 'en', false, 'from');
    recordAnswer(ex, 'en', false, 'during');
    const m = getState().mistakes;
    expect(m.length).toBe(1);
    expect(m[0].count).toBe(2);
    expect(m[0].explain).toBe(ex.explain);
    expect(m[0].status).toBe('open');
  });
  it('повторяющиеся ошибки делают тему слабой, и план назначает упражнения', () => {
    recordAnswer(ex, 'en', false, 'x');
    recordAnswer(ex2, 'en', false, 'x');
    recordAnswer(ex, 'en', false, 'x');
    expect(weakTopics(getState(), 'en')[0].topic).toBe('en.present-perfect');
    const plan = generateDayPlan(getState(), today());
    expect(plan.some((b) => b.kind === 'topic' && b.ref === 'en.present-perfect')).toBe(true);
  });
  it('тема исправлена после двух верных ответов подряд на другие задания', () => {
    recordAnswer(ex, 'en', false, 'x');
    recordAnswer(ex2, 'en', true, 'ok');
    recordAnswer(getLesson('en-06')!.practice[2], 'en', true, 'ok');
    expect(getState().mistakes[0].status).toBe('fixed');
  });
  it('пройденный урок открывает следующий; не пройденный не блокирует программу навсегда', () => {
    expect(nextLesson(getState(), 'en')).toBe('en-01');
    finishLesson('en-01', 'en', 0.5);
    expect(getState().lessons['en-01'].passed).toBe(false);
    finishLesson('en-01', 'en', 0.8);
    expect(nextLesson(getState(), 'en')).toBe('en-02');
  });
  it('выполнение активности отмечает блок плана', () => {
    ensureTodayPlan();
    markBlockDone('diagnostic', 'en');
    expect(getState().plans[today()].blocks.find((b) => b.kind === 'diagnostic' && b.lang === 'en')!.done).toBe(true);
  });
  it('словарь не дублирует слова', () => {
    const v = getLesson('en-01')!.vocab;
    expect(addVocab(v, 'test')).toBe(v.length);
    expect(addVocab(v, 'test')).toBe(0);
  });
});
