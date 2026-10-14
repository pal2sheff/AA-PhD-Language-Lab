import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../data/types';
import { addStudySeconds } from './learning';
import { loadVoices } from './speech';

/**
 * Учёт активного учебного времени: секунды считаются, только пока вкладка видима
 * и пользователь что-то делал в последние 90 секунд.
 */
export function useStudyTimer(lang: Lang | null, active = true) {
  const lastInteraction = useRef(Date.now());
  const pending = useRef(0);
  useEffect(() => {
    if (!active) return;
    const touch = () => (lastInteraction.current = Date.now());
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastInteraction.current < 90_000) pending.current += 1;
      if (pending.current >= 15) {
        addStudySeconds(lang, pending.current);
        pending.current = 0;
      }
    }, 1000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(tick);
      if (pending.current) addStudySeconds(lang, pending.current);
      pending.current = 0;
    };
  }, [lang, active]);
}

export function useVoices() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    loadVoices().then((v) => alive && setN(v.length));
    return () => {
      alive = false;
    };
  }, []);
  return n;
}

export function useCountdown(seconds: number, running: boolean, onEnd?: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const deadline = useRef<number | null>(null);
  useEffect(() => {
    setLeft(seconds);
    deadline.current = null;
  }, [seconds]);
  useEffect(() => {
    if (!running) {
      deadline.current = null;
      return;
    }
    deadline.current = Date.now() + left * 1000;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((deadline.current! - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        endRef.current?.();
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return left;
}

export function useStopwatch(running: boolean) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - sec * 1000;
    const t = setInterval(() => setSec(Math.round((Date.now() - start) / 1000)), 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return sec;
}
