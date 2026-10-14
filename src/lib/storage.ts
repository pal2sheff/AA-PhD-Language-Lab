// Надёжное локальное хранение: IndexedDB (основное) + копия в localStorage (резерв).
// Это локальное хранение на одном устройстве, а не синхронизация между устройствами.

const DB_NAME = 'aa-phd-language-lab';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'aa-lab-state-v1';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB недоступен'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface LoadResult {
  data: unknown | null;
  source: 'indexeddb' | 'localstorage' | 'none';
}

export async function loadRaw(): Promise<LoadResult> {
  let fromIdb: { updatedAt?: number } | undefined;
  try {
    fromIdb = await idbGet(KEY);
  } catch {
    fromIdb = undefined;
  }
  let fromLs: { updatedAt?: number } | undefined;
  try {
    const s = localStorage.getItem(LS_KEY);
    fromLs = s ? JSON.parse(s) : undefined;
  } catch {
    fromLs = undefined;
  }
  // Берём более свежую копию.
  if (fromIdb && (!fromLs || (fromIdb.updatedAt ?? 0) >= (fromLs.updatedAt ?? 0))) return { data: fromIdb, source: 'indexeddb' };
  if (fromLs) return { data: fromLs, source: 'localstorage' };
  return { data: null, source: 'none' };
}

export type SaveStatus = { ok: boolean; idb: boolean; ls: boolean; error?: string; at: number };

export async function saveRaw(state: { updatedAt: number }): Promise<SaveStatus> {
  let idb = false;
  let ls = false;
  let error: string | undefined;
  try {
    await idbSet(KEY, state);
    idb = true;
  } catch (e) {
    error = String(e);
  }
  try {
    const json = JSON.stringify(state);
    if (json.length < 4_500_000) {
      localStorage.setItem(LS_KEY, json);
      ls = true;
    }
  } catch (e) {
    error = error ?? String(e);
  }
  return { ok: idb || ls, idb, ls, error, at: Date.now() };
}

export async function clearAll(): Promise<void> {
  try {
    await idbDelete(KEY);
  } catch {
    /* нет IndexedDB */
  }
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* нет localStorage */
  }
}

/** Просим браузер не удалять данные при нехватке места (важно для Safari/iOS). */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* не поддерживается */
  }
  return null;
}
