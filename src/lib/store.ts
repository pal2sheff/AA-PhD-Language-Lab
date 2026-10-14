// Глобальное хранилище состояния с автосохранением.

import { useSyncExternalStore } from 'react';
import { produce, type Draft } from 'immer';
import { defaultState, migrate, type AppState } from './state';
import { loadRaw, saveRaw, type SaveStatus } from './storage';

let state: AppState = defaultState();
let loaded = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSave: SaveStatus | null = null;
let loadError: string | null = null;

function emit() {
  for (const l of listeners) l();
}

export function getState(): AppState {
  return state;
}

export function isLoaded() {
  return loaded;
}

export function getSaveStatus() {
  return lastSave;
}

export function getLoadError() {
  return loadError;
}

export async function initStore(): Promise<void> {
  const { data } = await loadRaw();
  if (data) {
    try {
      state = migrate(data);
    } catch (e) {
      loadError = String(e);
      state = defaultState();
    }
  }
  loaded = true;
  emit();
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}

export async function flush(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  lastSave = await saveRaw(state);
  emit();
}

export function update(recipe: (draft: Draft<AppState>) => void): void {
  const next = produce(state, recipe);
  if (next === state) return; // ничего не изменилось — не сохраняем и не перерисовываем
  state = produce(next, (d) => {
    d.updatedAt = Date.now();
  });
  emit();
  scheduleSave();
}

export function replaceState(next: AppState): void {
  state = next;
  emit();
  scheduleSave();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// Сохранение при уходе со страницы / сворачивании (важно для iPhone).
if (typeof window !== 'undefined') {
  const handler = () => {
    if (saveTimer) void flush();
  };
  window.addEventListener('pagehide', handler);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handler();
  });
}

/** Только для тестов: сброс модуля в исходное состояние. */
export function __resetForTests(s: AppState = defaultState()) {
  state = s;
  loaded = true;
}
