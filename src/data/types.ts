// Общие типы учебного контента AA PhD Language Lab.

export type Lang = 'en' | 'kk';
export const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type Level = (typeof LEVELS)[number];
export type Skill = 'grammar' | 'vocab' | 'reading' | 'listening' | 'writing' | 'speaking';
export type MistakeCategory =
  | 'grammar'
  | 'vocab'
  | 'spelling'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking';

interface ExerciseBase {
  id: string;
  /** Идентификатор темы (для статистики, ошибок и адаптивного плана). */
  topic: string;
  /** Объяснение правильного ответа (показывается всегда после проверки). */
  explain: string;
  category?: MistakeCategory;
}

export interface McqExercise extends ExerciseBase {
  type: 'mcq';
  prompt: string;
  options: string[];
  answer: number;
  /** Почему конкретный вариант неверен (индекс = индекс варианта). */
  optionWhy?: (string | undefined)[];
}

export interface GapExercise extends ExerciseBase {
  type: 'gap';
  /** Текст с пропуском «___». */
  prompt: string;
  /** Допустимые ответы (сравнение без учёта регистра и лишних пробелов). */
  answers: string[];
  hint?: string;
  /** Перевод/контекст для пользователя. */
  ru?: string;
}

export interface OrderExercise extends ExerciseBase {
  type: 'order';
  words: string[];
  answers: string[];
  ru?: string;
}

export interface TranslateExercise extends ExerciseBase {
  type: 'translate';
  /** Фраза на русском. */
  source: string;
  answers: string[];
  hint?: string;
}

export interface ListenExercise extends ExerciseBase {
  type: 'listen';
  /** Текст, который озвучивается синтезатором речи. */
  say: string;
  mode: 'mcq' | 'type';
  prompt: string;
  options?: string[];
  answer?: number;
  answers?: string[];
}

export type Exercise =
  | McqExercise
  | GapExercise
  | OrderExercise
  | TranslateExercise
  | ListenExercise;

export type TheoryBlock =
  | { type: 'p'; text: string }
  | { type: 'formula'; text: string; note?: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'tip'; text: string };

export interface Example {
  t: string;
  ru: string;
  note?: string;
}

export interface Pitfall {
  wrong: string;
  right: string;
  why: string;
}

export interface MorphBreakdown {
  word: string;
  parts: { part: string; role: string }[];
  ru: string;
}

export interface VocabSeed {
  id: string;
  lang: Lang;
  word: string;
  tr: string;
  /** Транскрипция или подсказка по произношению. */
  pron?: string;
  ex: string;
  exRu: string;
  cat: string;
  level: Level;
}

export interface Lesson {
  id: string;
  lang: Lang;
  order: number;
  level: Level;
  title: string;
  topic: string;
  category: MistakeCategory;
  minutes: number;
  goal: string;
  /** Проверяемые результаты: «после урока вы сможете…» */
  outcomes: string[];
  theory: TheoryBlock[];
  /** Упрощённое объяснение для кнопки «Объясни проще». */
  simple: string;
  examples: Example[];
  extraExamples: Example[];
  pitfalls: Pitfall[];
  morph?: MorphBreakdown[];
  warmup: Exercise[];
  practice: Exercise[];
  listening: { title: string; text: string; ru: string; questions: Exercise[] };
  shadow: Example[];
  control: Exercise[];
  /** Резерв для кнопки «Дай ещё упражнение» и повторения ошибок. */
  extra: Exercise[];
  summary: string[];
  vocab: VocabSeed[];
}

export interface DiagItem {
  id: string;
  lang: Lang;
  skill: 'grammar' | 'vocab' | 'reading' | 'listening';
  level: Exclude<Level, 'A0'>;
  topic: string;
  prompt: string;
  passage?: string;
  say?: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface CurriculumUnit {
  id: string;
  lang: Lang;
  title: string;
  kind: 'grammar' | 'vocab' | 'skill' | 'exam';
  level: Level;
  /** Урок с готовым материалом, если он уже создан. */
  lessonId?: string;
  /** Тренажёр с готовым материалом (для навыков и экзаменационных тем). */
  route?: string;
  /** Тема для статистики. */
  topic: string;
  /** Самый ранний этап программы, на котором уместна тема (1–4). */
  phase: 1 | 2 | 3 | 4;
  minutes: number;
}
