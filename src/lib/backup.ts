// Экспорт / импорт JSON и облачная синхронизация через собственный сервер.
import { getState, replaceState, update, flush } from './store';
import { migrate, type AppState } from './state';
import { clearAll } from './storage';
import { today } from './dates';

export function exportJson(): string {
  return JSON.stringify(getState(), null, 2);
}

export function downloadBackup() {
  const blob = new Blob([exportJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aa-language-lab-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  update((d) => {
    d.lastBackupAt = Date.now();
  });
}

export function importJson(text: string): AppState {
  const parsed = JSON.parse(text);
  const next = migrate(parsed);
  replaceState(next);
  return next;
}

export async function resetAll() {
  await clearAll();
}

// ─── Облачная синхронизация ───────────────────────────────────────────────
// Сервер хранит одну копию состояния на токен. Конфликты: побеждает более свежая версия
// (по updatedAt); перед перезаписью локальных данных пользователь подтверждает действие.

export interface SyncInfo {
  remoteUpdatedAt: number | null;
  localUpdatedAt: number;
}

function syncHeaders() {
  const s = getState().settings.sync;
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` };
}

function syncUrl() {
  return getState().settings.sync.endpoint.replace(/\/+$/, '') + '/api/sync';
}

export function syncConfigured() {
  const s = getState().settings.sync;
  return !!s.endpoint && !!s.token;
}

export async function syncStatus(): Promise<SyncInfo> {
  const r = await fetch(syncUrl() + '?meta=1', { headers: syncHeaders() });
  if (r.status === 404) return { remoteUpdatedAt: null, localUpdatedAt: getState().updatedAt };
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `Ошибка ${r.status}`);
  const j = await r.json();
  return { remoteUpdatedAt: j.updatedAt ?? null, localUpdatedAt: getState().updatedAt };
}

export async function pushToCloud(): Promise<void> {
  await flush();
  const body = exportJson();
  const r = await fetch(syncUrl(), { method: 'PUT', headers: syncHeaders(), body });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `Ошибка ${r.status}`);
  update((d) => {
    d.settings.sync.lastSync = Date.now();
  });
}

export async function pullFromCloud(): Promise<void> {
  const r = await fetch(syncUrl(), { headers: syncHeaders() });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `Ошибка ${r.status}`);
  const text = await r.text();
  const keepSync = getState().settings.sync;
  const next = migrate(JSON.parse(text));
  next.settings.sync = { ...keepSync, lastSync: Date.now() };
  replaceState(next);
}
