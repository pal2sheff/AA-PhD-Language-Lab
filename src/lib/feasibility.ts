// Оценка реалистичности цели. Используются публикуемые Cambridge English ориентиры
// «guided learning hours» (накопительно: A2 ≈ 180–200 ч, B1 ≈ 350–400 ч, B2 ≈ 500–600 ч).
// Индивидуальная скорость может отличаться в 1,5–2 раза — это ориентир, а не прогноз.

import type { Level } from '../data/types';

const CUMULATIVE_HOURS: Record<Level, [number, number]> = {
  A0: [0, 0],
  A1: [90, 100],
  A2: [180, 200],
  B1: [350, 400],
  B2: [500, 600],
  C1: [700, 800],
};

/** Целевой ориентир по часам для IELTS 5.0 (≈ середина B1) и 5.5 (≈ B1+/порог B2). */
function ieltsTargetHours(band: number): [number, number] {
  if (band <= 4.5) return [300, 350];
  if (band <= 5.0) return [350, 425];
  if (band <= 5.5) return [425, 500];
  if (band <= 6.0) return [500, 575];
  return [575, 650];
}

export type Verdict = 'realistic' | 'possible' | 'unlikely' | 'unknown';

export interface Feasibility {
  verdict: Verdict;
  neededHours: [number, number];
  availableHours: number;
  /** Минут в день на этот язык, чтобы закрыть нижнюю границу потребности. */
  minutesPerDayNeeded: number;
  /** Дней при текущей нагрузке до нижней границы. */
  daysNeeded: number;
  explanation: string;
}

function evaluate(start: [number, number], target: [number, number], minutesPerDay: number, studyDays: number): Omit<Feasibility, 'explanation'> {
  // Начальная точка — середина диапазона текущего уровня (уровень уже достигнут, но не полностью освоен следующий).
  const startMid = (start[0] + start[1]) / 2;
  const needed: [number, number] = [Math.max(0, target[0] - startMid), Math.max(0, target[1] - startMid)];
  const available = (minutesPerDay / 60) * studyDays;
  let verdict: Verdict;
  if (needed[1] <= available) verdict = 'realistic';
  else if (needed[0] * 0.8 <= available) verdict = 'possible';
  else verdict = 'unlikely';
  const minutesPerDayNeeded = studyDays > 0 ? Math.ceil(((needed[0] * 60) / studyDays) / 5) * 5 : 0;
  const daysNeeded = minutesPerDay > 0 ? Math.ceil((needed[0] * 60) / minutesPerDay) : Infinity;
  return { verdict, neededHours: [Math.round(needed[0]), Math.round(needed[1])], availableHours: Math.round(available), minutesPerDayNeeded, daysNeeded };
}

export function ieltsFeasibility(level: Level | null, band: number, enMinutesPerDay: number, studyDaysLeft: number): Feasibility {
  if (!level) {
    return { verdict: 'unknown', neededHours: [0, 0], availableHours: Math.round((enMinutesPerDay / 60) * studyDaysLeft), minutesPerDayNeeded: 0, daysNeeded: 0, explanation: 'Пройдите диагностику английского — без неё оценка достижимости невозможна.' };
  }
  const r = evaluate(CUMULATIVE_HOURS[level], ieltsTargetHours(band), enMinutesPerDay, studyDaysLeft);
  return { ...r, explanation: explain(r, `IELTS ${band.toFixed(1)}`, level) };
}

export function kazFeasibility(level: Level | null, target: Level | null, kkMinutesPerDay: number, studyDaysLeft: number): Feasibility {
  if (!level || !target) {
    return { verdict: 'unknown', neededHours: [0, 0], availableHours: Math.round((kkMinutesPerDay / 60) * studyDaysLeft), minutesPerDayNeeded: 0, daysNeeded: 0, explanation: !level ? 'Пройдите диагностику казахского.' : 'Выберите целевой уровень КАЗТЕСТ в настройках.' };
  }
  // Для казахского используем ту же шкалу CEFR как грубый ориентир (официальных данных о часах для КАЗТЕСТ нет).
  const r = evaluate(CUMULATIVE_HOURS[level], CUMULATIVE_HOURS[target], kkMinutesPerDay, studyDaysLeft);
  return { ...r, explanation: explain(r, `КАЗТЕСТ ${target}`, level) + ' Для казахского языка используется общая шкала CEFR — официальных норм учебных часов для КАЗТЕСТ нет.' };
}

function explain(r: Omit<Feasibility, 'explanation'>, goal: string, level: Level): string {
  const base = `От уровня ${level} до цели «${goal}» по ориентирам нужно примерно ${r.neededHours[0]}–${r.neededHours[1]} ч. При текущей нагрузке до конца курса доступно ≈ ${r.availableHours} ч.`;
  if (r.verdict === 'realistic') return `${base} Цель реалистична при регулярных занятиях.`;
  if (r.verdict === 'possible') return `${base} Цель достижима только при высокой регулярности и интенсивной самостоятельной работе; рекомендуется ≈ ${r.minutesPerDayNeeded} мин в день на этот язык.`;
  return `${base} За оставшийся срок цель маловероятна. Варианты: увеличить нагрузку до ≈ ${r.minutesPerDayNeeded} мин в день на этот язык или продлить подготовку (при текущей нагрузке ≈ ${r.daysNeeded} учебных дней).`;
}
