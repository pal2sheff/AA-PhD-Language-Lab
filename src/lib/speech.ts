// Браузерные речевые технологии: синтез речи, распознавание, запись голоса.
// Всё работает локально в браузере; аудио не отправляется внешним сервисам.

import type { Lang } from '../data/types';
import { getState } from './store';

export type Accent = 'en-GB' | 'en-US' | 'en-AU' | 'en-NZ';
export const ACCENT_NAMES: Record<Accent, string> = {
  'en-GB': 'британский',
  'en-US': 'американский',
  'en-AU': 'австралийский',
  'en-NZ': 'новозеландский',
};

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

let voicesCache: SpeechSynthesisVoice[] = [];
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  const v = speechSynthesis.getVoices();
  if (v.length) {
    voicesCache = v;
    return Promise.resolve(v);
  }
  return new Promise((resolve) => {
    const done = () => {
      voicesCache = speechSynthesis.getVoices();
      resolve(voicesCache);
    };
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

export function voicesFor(prefix: string): SpeechSynthesisVoice[] {
  return voicesCache.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix.toLowerCase()));
}

/** Голоса для акцента: возвращает только голоса, реально помеченные этим регионом. */
export function voiceForAccent(accent: Accent): SpeechSynthesisVoice | null {
  return voicesFor(accent)[0] ?? null;
}

export function availableAccents(): Accent[] {
  return (Object.keys(ACCENT_NAMES) as Accent[]).filter((a) => voicesFor(a).length > 0);
}

export interface SpeakOptions {
  rate?: number;
  accent?: Accent;
  voiceURI?: string;
  onEnd?: () => void;
}

export interface VoiceInfo {
  ok: boolean;
  voiceName: string | null;
  note: string | null;
}

/** Какой голос будет использован для языка (для честной подписи в интерфейсе). */
export function voiceInfo(lang: Lang, accent?: Accent): VoiceInfo {
  if (!ttsSupported()) return { ok: false, voiceName: null, note: 'Браузер не поддерживает синтез речи.' };
  const s = getState().settings.tts;
  if (lang === 'en') {
    const v = (s.enVoice && voicesCache.find((x) => x.voiceURI === s.enVoice)) || (accent ? voiceForAccent(accent) : null) || voicesFor('en-GB')[0] || voicesFor('en')[0];
    if (!v) return { ok: false, voiceName: null, note: 'На устройстве нет английского голоса.' };
    return { ok: true, voiceName: `${v.name} (${v.lang})`, note: accent && !v.lang.replace('_', '-').startsWith(accent) ? `Голос с акцентом ${ACCENT_NAMES[accent]} на устройстве не найден — используется ${v.lang}.` : null };
  }
  const kk = (s.kkVoice && voicesCache.find((x) => x.voiceURI === s.kkVoice)) || voicesFor('kk')[0];
  if (kk) return { ok: true, voiceName: `${kk.name} (${kk.lang})`, note: null };
  if (s.kkFallback !== 'none') {
    const fb = voicesFor(s.kkFallback)[0];
    if (fb) return { ok: true, voiceName: `${fb.name} (${fb.lang})`, note: `Казахского голоса на устройстве нет. Используется ${fb.lang} — особые звуки (қ, ғ, ң, ө, ү, ұ, і) будут произнесены неточно.` };
  }
  return { ok: false, voiceName: null, note: 'На устройстве нет казахского голоса. Текст будет показан для чтения; для озвучки можно включить запасной голос в Настройках или подключить реальные аудиозаписи.' };
}

function pickVoice(lang: Lang, accent?: Accent, voiceURI?: string): SpeechSynthesisVoice | null {
  const s = getState().settings.tts;
  if (voiceURI) {
    const v = voicesCache.find((x) => x.voiceURI === voiceURI);
    if (v) return v;
  }
  if (lang === 'en') {
    if (accent) {
      const a = voiceForAccent(accent);
      if (a) return a;
    }
    return (s.enVoice && voicesCache.find((x) => x.voiceURI === s.enVoice)) || voicesFor('en-GB')[0] || voicesFor('en')[0] || null;
  }
  const kk = (s.kkVoice && voicesCache.find((x) => x.voiceURI === s.kkVoice)) || voicesFor('kk')[0];
  if (kk) return kk;
  if (s.kkFallback !== 'none') return voicesFor(s.kkFallback)[0] ?? null;
  return null;
}

/** Озвучивает текст. Возвращает false, если подходящего голоса нет. */
export function speak(text: string, lang: Lang, opts: SpeakOptions = {}): boolean {
  if (!ttsSupported() || !text.trim()) return false;
  const voice = pickVoice(lang, opts.accent, opts.voiceURI);
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = opts.rate ?? getState().settings.tts.rate;
  if (opts.onEnd) {
    u.onend = opts.onEnd;
    u.onerror = opts.onEnd;
  }
  speechSynthesis.speak(u);
  return true;
}

/** Последовательное озвучивание реплик диалога (разными голосами, если они есть). */
export function speakDialogue(lines: { speaker: number; text: string }[], lang: Lang, rate?: number, onEnd?: () => void): boolean {
  if (!ttsSupported()) return false;
  const pool = lang === 'en' ? voicesFor('en') : voicesFor('kk');
  const fallback = pickVoice(lang);
  if (!fallback) return false;
  speechSynthesis.cancel();
  lines.forEach((l, i) => {
    const u = new SpeechSynthesisUtterance(l.text);
    const v = pool.length > 1 ? pool[l.speaker % pool.length] : fallback;
    u.voice = v;
    u.lang = v.lang;
    u.rate = rate ?? getState().settings.tts.rate;
    if (i === lines.length - 1 && onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    speechSynthesis.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  if (ttsSupported()) speechSynthesis.cancel();
}

// ─── Распознавание речи ───────────────────────────────────────────────────

type RecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return typeof window !== 'undefined' && recognitionCtor() !== null;
}

export interface Recognizer {
  stop(): void;
}

/**
 * Распознавание речи браузером. Важно: в Chrome и Safari распознавание выполняется
 * сервисом производителя браузера (Google / Apple) — об этом пользователь предупреждается в интерфейсе.
 */
export function startRecognition(
  lang: Lang,
  onText: (finalText: string, interim: string) => void,
  onError: (msg: string) => void,
  onEnd: () => void,
): Recognizer | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = lang === 'en' ? 'en-GB' : 'kk-KZ';
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;
  let finalText = '';
  r.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) finalText += res[0].transcript + ' ';
      else interim += res[0].transcript;
    }
    onText(finalText.trim(), interim);
  };
  r.onerror = (e) => {
    const map: Record<string, string> = {
      'not-allowed': 'Доступ к микрофону запрещён. Разрешите его в настройках браузера.',
      'no-speech': 'Речь не распознана. Попробуйте говорить ближе к микрофону.',
      'language-not-supported': 'Распознавание этого языка не поддерживается браузером.',
      network: 'Для распознавания нужен интернет (сервис браузера недоступен).',
    };
    onError(map[e.error] ?? `Ошибка распознавания: ${e.error}`);
  };
  r.onend = onEnd;
  try {
    r.start();
  } catch (e) {
    onError(String(e));
    return null;
  }
  return { stop: () => r.stop() };
}

// ─── Запись голоса ────────────────────────────────────────────────────────

export function recordingSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

export interface Recording {
  stop(): Promise<{ url: string; blob: Blob; seconds: number }>;
  cancel(): void;
}

export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
  const mimeType = types.find((t) => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  const started = Date.now();
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  rec.start();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          release();
          const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
          resolve({ url: URL.createObjectURL(blob), blob, seconds: (Date.now() - started) / 1000 });
        };
        rec.stop();
      }),
    cancel: () => {
      try {
        rec.stop();
      } catch {
        /* уже остановлено */
      }
      release();
    },
  };
}

// ─── Анализ устного ответа по транскрипции ───────────────────────────────

const FILLERS_EN = ['um', 'uh', 'er', 'erm', 'like', 'you know', 'i mean', 'well'];
const LINKERS_EN = ['because', 'however', 'although', 'so', 'for example', 'for instance', 'moreover', 'in addition', 'on the other hand', 'therefore', 'first', 'firstly', 'secondly', 'finally', 'while', 'whereas', 'as a result'];
const FILLERS_KK = ['ээ', 'ммм', 'енді', 'яғни', 'әлгі'];
const LINKERS_KK = ['себебі', 'өйткені', 'бірақ', 'сондықтан', 'мысалы', 'сондай-ақ', 'алайда', 'біріншіден', 'екіншіден', 'дегенмен', 'қорыта келгенде'];

export function speechMetrics(transcript: string, seconds: number, lang: Lang) {
  const text = ' ' + transcript.toLowerCase().replace(/[.,!?;:]/g, ' ') + ' ';
  const words = transcript.trim() ? transcript.trim().split(/\s+/) : [];
  const fillers = (lang === 'en' ? FILLERS_EN : FILLERS_KK).reduce((a, f) => a + (text.split(` ${f} `).length - 1), 0);
  const linking = (lang === 'en' ? LINKERS_EN : LINKERS_KK).reduce((a, f) => a + (text.split(` ${f} `).length - 1), 0);
  const uniq = new Set(words.map((w) => w.toLowerCase().replace(/[^\p{L}']/gu, ''))).size;
  return {
    words: words.length,
    wpm: seconds > 0 ? Math.round((words.length / seconds) * 60) : 0,
    fillers,
    linking,
    uniqueRatio: words.length ? Math.round((uniq / words.length) * 100) / 100 : 0,
  };
}
