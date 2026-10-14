// Модель данных приложения и значения по умолчанию.

import type { Lang, Level, MistakeCategory, Skill } from '../data/types';
import type { SrsCard } from './srs';
import type { DiagAnswer, SkillSession } from './diagnostic';
import type { KaztestThresholds } from './scoring';
import { today } from './dates';

export type CourseDays = 90 | 180 | 270;
export type DailyMinutes = 30 | 45 | 60 | 90 | 120;

export interface Settings {
  courseDays: CourseDays;
  startDate: string;
  dailyMinutes: DailyMinutes;
  /** Доля английского в дневной нагрузке (0,5–0,85). */
  enShare: number;
  /** Разрешить системе менять долю после диагностики. */
  autoSplit: boolean;
  restWeekdays: number[];
  ieltsMin: number;
  ieltsTarget: number;
  kazTargetLevel: Level | null;
  /** Текст официального требования приёмной комиссии (вводит пользователь). */
  kazRequired: string;
  kazThresholds: KaztestThresholds | null;
  tts: { rate: number; enVoice: string; kkVoice: string; kkFallback: 'none' | 'tr' | 'ru' };
  ai: { enabled: boolean; endpoint: string; token: string; sendAudio: boolean };
  sync: { endpoint: string; token: string; lastSync: number | null };
  /** Режим «Экстренная подготовка» (последние 14 дней перед экзаменом). */
  emergency: { active: boolean; exam: 'ielts' | 'kaztest' };
}

export interface LessonProgress {
  startedAt: number;
  completedAt: number | null;
  attempts: number;
  lastControl: number;
  bestControl: number;
  passed: boolean;
  step: number;
}

export interface TopicStat {
  attempts: number;
  correct: number;
  /** Последние 10 ответов: 1 — верно, 0 — неверно. */
  recent: number[];
  lastAt: number;
}

export interface Mistake {
  id: string;
  /** Идентификатор упражнения (для дедупликации). */
  key: string;
  lang: Lang;
  category: MistakeCategory;
  topic: string;
  prompt: string;
  userAnswer: string;
  correct: string;
  explain: string;
  firstAt: number;
  lastAt: number;
  count: number;
  status: 'open' | 'fixed';
}

export interface VocabEntry {
  id: string;
  lang: Lang;
  word: string;
  tr: string;
  pron?: string;
  ex: string;
  exRu: string;
  cat: string;
  level: Level;
  addedAt: number;
  source: string;
  card: SrsCard;
  history: { at: number; grade: number; mode: string }[];
}

export interface DayActivity {
  seconds: number;
  en: number;
  kk: number;
  answered: number;
  correct: number;
  lessons: string[];
  reviews: number;
}

export type BlockKind =
  | 'diagnostic'
  | 'lesson'
  | 'vocab'
  | 'mistakes'
  | 'topic'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'pronunciation'
  | 'dictation'
  | 'checkpoint'
  | 'mock'
  | 'conversation';

export interface PlanBlock {
  id: string;
  lang: Lang;
  kind: BlockKind;
  title: string;
  minutes: number;
  route: string;
  ref?: string;
  done: boolean;
  postponed?: boolean;
  why?: string;
}

export interface DayPlan {
  date: string;
  createdAt: number;
  blocks: PlanBlock[];
}

export interface SkillResult {
  level: Level | null;
  correct: number;
  total: number;
  confidence: 'low' | 'medium';
  tested: boolean;
}

export interface DiagnosticResult {
  lang: Lang;
  completedAt: number;
  skills: Partial<Record<Skill, SkillResult>>;
  overall: Level | null;
  gaps: string[];
  writing?: { text: string; words: number; prompt: string };
  speaking?: { transcript: string; seconds: number; prompt: string };
}

export interface DiagnosticSession {
  lang: Lang;
  startedAt: number;
  skills: Partial<Record<'grammar' | 'vocab' | 'reading' | 'listening', SkillSession>>;
  writing?: { text: string; words: number; prompt: string };
  speaking?: { transcript: string; seconds: number; prompt: string };
  skipped: Skill[];
}

export interface Finding {
  kind: string;
  message: string;
  excerpt?: string;
  hint?: string;
  fix?: string;
}

export interface WritingEntry {
  id: string;
  lang: Lang;
  task: 'ielts1' | 'ielts2' | 'kaz1' | 'kaz2' | 'diag' | 'free';
  promptId: string;
  prompt: string;
  text: string;
  words: number;
  seconds: number;
  createdAt: number;
  findings: Finding[];
  selfCheck: Record<string, boolean>;
  ai?: { at: number; band: number | null; criteria: Record<string, number>; feedback: string; errors: { quote: string; issue: string; hint: string }[] };
  manualBand?: { band: number; source: string };
}

export interface SpeakingEntry {
  id: string;
  lang: Lang;
  context: string;
  prompt: string;
  transcript: string;
  seconds: number;
  createdAt: number;
  metrics: { words: number; wpm: number; fillers: number; linking: number; uniqueRatio: number };
  ai?: { at: number; band: number | null; feedback: string };
  manualBand?: { band: number; source: string };
}

export interface ExamAttempt {
  id: string;
  exam: 'ielts' | 'kaztest';
  section: string;
  testId: string;
  mode: 'exam' | 'training';
  startedAt: number;
  finishedAt: number;
  correct: number;
  total: number;
  /** true — секция полностью соответствует официальному формату (количество вопросов). */
  fullFormat: boolean;
  band: number | null;
  answers: Record<string, string>;
}

export interface CheckpointResult {
  id: string;
  day: number;
  date: string;
  lang: Lang;
  correct: number;
  total: number;
  byTopic: Record<string, { c: number; t: number }>;
}

export interface ExamDates {
  ielts: string;
  kaztest: string;
  phdDeadline: string;
  ieltsRegistered: boolean;
  kaztestRegistered: boolean;
  custom: { id: string; title: string; date: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: number;
}

export interface ConversationLog {
  id: string;
  lang: Lang;
  scenario: string;
  at: number;
  turns: { role: 'tutor' | 'user'; text: string }[];
  summary: { phrases: string[]; issues: string[]; newWords: string[] };
}

export interface AppState {
  version: 1;
  createdAt: number;
  onboarded: boolean;
  settings: Settings;
  diagnostics: { en: DiagnosticResult[]; kk: DiagnosticResult[] };
  diagSessions: { en: DiagnosticSession | null; kk: DiagnosticSession | null };
  lessons: Record<string, LessonProgress>;
  topics: Record<string, TopicStat>;
  mistakes: Mistake[];
  vocab: Record<string, VocabEntry>;
  activity: Record<string, DayActivity>;
  plans: Record<string, DayPlan>;
  carryover: PlanBlock[];
  writings: WritingEntry[];
  speakings: SpeakingEntry[];
  exams: ExamAttempt[];
  checkpoints: CheckpointResult[];
  examDates: ExamDates;
  tutor: { en: ChatMessage[]; kk: ChatMessage[] };
  conversations: ConversationLog[];
  seenExercises: Record<string, number>;
  lastBackupAt: number | null;
  lastRoute: string;
  updatedAt: number;
}

export function defaultSettings(): Settings {
  return {
    courseDays: 90,
    startDate: today(),
    dailyMinutes: 90,
    enShare: 2 / 3,
    autoSplit: true,
    restWeekdays: [],
    ieltsMin: 5.0,
    ieltsTarget: 5.5,
    kazTargetLevel: null,
    kazRequired: '',
    kazThresholds: null,
    tts: { rate: 0.9, enVoice: '', kkVoice: '', kkFallback: 'none' },
    ai: { enabled: false, endpoint: '', token: '', sendAudio: false },
    sync: { endpoint: '', token: '', lastSync: null },
    emergency: { active: false, exam: 'ielts' },
  };
}

export function defaultState(): AppState {
  const now = Date.now();
  return {
    version: 1,
    createdAt: now,
    onboarded: false,
    settings: defaultSettings(),
    diagnostics: { en: [], kk: [] },
    diagSessions: { en: null, kk: null },
    lessons: {},
    topics: {},
    mistakes: [],
    vocab: {},
    activity: {},
    plans: {},
    carryover: [],
    writings: [],
    speakings: [],
    exams: [],
    checkpoints: [],
    examDates: { ielts: '', kaztest: '', phdDeadline: '', ieltsRegistered: false, kaztestRegistered: false, custom: [] },
    tutor: { en: [], kk: [] },
    conversations: [],
    seenExercises: {},
    lastBackupAt: null,
    lastRoute: '#/',
    updatedAt: now,
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Глубокое объединение с умолчаниями: старые сохранения получают новые поля без потери данных. */
function mergeDefaults<T>(def: T, raw: unknown): T {
  if (!isObj(def) || !isObj(raw)) return (raw === undefined ? def : (raw as T));
  const out: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  for (const [k, v] of Object.entries(def as Record<string, unknown>)) {
    if (!(k in out) || out[k] === undefined) out[k] = v;
    else if (isObj(v) && isObj(out[k]) && Object.keys(v).length) out[k] = mergeDefaults(v, out[k]);
  }
  return out as T;
}

export function migrate(raw: unknown): AppState {
  if (!isObj(raw)) throw new Error('Файл не содержит данных приложения');
  if (raw.version !== 1) throw new Error('Неизвестная версия данных: ' + String(raw.version));
  return mergeDefaults(defaultState(), raw);
}

export function emptyDay(): DayActivity {
  return { seconds: 0, en: 0, kk: 0, answered: 0, correct: 0, lessons: [], reviews: 0 };
}

export type { DiagAnswer };
