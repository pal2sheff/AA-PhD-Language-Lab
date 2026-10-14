// Минимальный hash-роутер: работает на любом статическом хостинге и в PWA на iPhone.
import { useSyncExternalStore } from 'react';

function current(): string {
  const h = window.location.hash.replace(/^#/, '') || '/';
  return h.startsWith('/') ? h : '/' + h;
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): { path: string; parts: string[] } {
  const path = useSyncExternalStore(subscribe, current, () => '/');
  const clean = path.split('?')[0];
  return { path: clean, parts: clean.split('/').filter(Boolean).map(decodeURIComponent) };
}

export function navigate(to: string) {
  const target = to.startsWith('#') ? to : '#' + to;
  if (window.location.hash === target) return;
  window.location.hash = target;
  window.scrollTo(0, 0);
}

export function back(fallback = '/') {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}
