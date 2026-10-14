// Типы экзаменационных заданий (IELTS и КАЗТЕСТ).
import type { Lang } from './types';

export type QType = 'tfng' | 'ynng' | 'mcq' | 'heading' | 'match' | 'complete' | 'short' | 'map';

export interface ExamQuestion {
  n: number;
  prompt: string;
  /** Для выбора: список вариантов. Для heading/match/map варианты берутся из группы. */
  options?: string[];
  /** Допустимые ответы (для выбора — текст варианта или его буква). */
  answers: string[];
  explain: string;
  /** Перевод вопроса (для КАЗТЕСТ в учебном режиме). */
  ru?: string;
}

export interface QGroup {
  title: string;
  instructions: string;
  type: QType;
  /** Общий список вариантов (заголовки, абзацы, люди, буквы на плане). */
  options?: string[];
  wordLimit?: string;
  questions: ExamQuestion[];
}

export interface ReadingPassage {
  title: string;
  paragraphs: { label?: string; text: string }[];
  groups: QGroup[];
}

export interface ListeningPart {
  title: string;
  context: string;
  lines: { speaker: number; name: string; text: string }[];
  groups: QGroup[];
  /** SVG-план для заданий на карту. */
  map?: 'research-centre';
}

export interface ExamTest {
  id: string;
  exam: 'ielts' | 'kaztest';
  section: 'reading' | 'listening';
  lang: Lang;
  title: string;
  minutes: number;
  /** Соответствует ли тест официальному формату по числу частей и вопросов. */
  fullFormat: boolean;
  formatNote: string;
  passages?: ReadingPassage[];
  parts?: ListeningPart[];
}

export function questionCount(t: ExamTest): number {
  const groups = [...(t.passages ?? []).flatMap((p) => p.groups), ...(t.parts ?? []).flatMap((p) => p.groups)];
  return groups.reduce((a, g) => a + g.questions.length, 0);
}
