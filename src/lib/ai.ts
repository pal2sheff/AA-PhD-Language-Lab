// Клиент AI-преподавателя. Работает только через собственный сервер (server/index.mjs),
// где хранится ключ Anthropic API. Ключ никогда не попадает в браузер.
// Если сервер не настроен — функции честно возвращают ошибку, а интерфейс использует
// заранее подготовленные объяснения. Имитации AI нет.

import { getState } from './store';
import type { Lang } from '../data/types';

export type AiTask = 'tutor' | 'explain' | 'writing' | 'speaking' | 'exercise' | 'conversation' | 'conversation-summary';

export interface AiRequest {
  task: AiTask;
  lang: Lang;
  messages: { role: 'user' | 'assistant'; content: string }[];
  context?: Record<string, unknown>;
}

export class AiUnavailable extends Error {}

export function aiConfigured(): boolean {
  const ai = getState().settings.ai;
  return ai.enabled && !!ai.endpoint;
}

function endpoint(path: string): string {
  const base = getState().settings.ai.endpoint.replace(/\/+$/, '');
  return base + path;
}

export async function aiHealth(): Promise<{ ok: boolean; model?: string; message: string }> {
  const ai = getState().settings.ai;
  if (!ai.endpoint) return { ok: false, message: 'Адрес сервера не указан.' };
  try {
    const r = await fetch(endpoint('/api/health'), { headers: ai.token ? { Authorization: `Bearer ${ai.token}` } : {} });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, message: j.error ?? `Сервер ответил ${r.status}` };
    return { ok: !!j.ai, model: j.model, message: j.ai ? `AI подключён (${j.model}).` : 'Сервер доступен, но ключ Anthropic API на нём не задан.' };
  } catch (e) {
    return { ok: false, message: 'Сервер недоступен: ' + String(e) };
  }
}

export async function aiCall(req: AiRequest): Promise<string> {
  if (!aiConfigured()) throw new AiUnavailable('AI не подключён. Укажите адрес сервера в Настройках.');
  const ai = getState().settings.ai;
  let r: Response;
  try {
    r = await fetch(endpoint('/api/ai'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(ai.token ? { Authorization: `Bearer ${ai.token}` } : {}) },
      body: JSON.stringify(req),
    });
  } catch (e) {
    throw new AiUnavailable('Нет связи с сервером AI: ' + String(e));
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new AiUnavailable(j.error ?? `Ошибка сервера ${r.status}`);
  return String(j.text ?? '');
}

/** Ответ модели с JSON (структурированный вывод на сервере). */
export async function aiJson<T>(req: AiRequest): Promise<T> {
  const text = await aiCall(req);
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new AiUnavailable('Не удалось разобрать ответ AI.');
  }
}

/** Краткая сводка об ученике для персонализации ответов AI. */
export function learnerContext(lang: Lang): Record<string, unknown> {
  const s = getState();
  const diag = s.diagnostics[lang].at(-1);
  const topErrors = Object.entries(
    s.mistakes.filter((m) => m.lang === lang && m.status === 'open').reduce<Record<string, number>>((acc, m) => {
      acc[m.topic] = (acc[m.topic] ?? 0) + m.count;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic, n]) => `${topic} (${n})`);
  return {
    profile: 'Врач-хирург, 20 лет стажа; готовится к PhD (диабетическая стопа, митохондриальная дисфункция, иммунное старение). Родной язык интерфейса — русский.',
    level: diag?.overall ?? 'не определён',
    goal: lang === 'en' ? `IELTS Academic ${s.settings.ieltsMin}–${s.settings.ieltsTarget}` : `КАЗТЕСТ ${s.settings.kazTargetLevel ?? '(уровень не выбран)'}`,
    frequentErrors: topErrors,
  };
}
