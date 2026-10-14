// Компактные конструкторы упражнений для файлов с контентом.
import type {
  GapExercise,
  Lang,
  Level,
  ListenExercise,
  McqExercise,
  MistakeCategory,
  OrderExercise,
  TranslateExercise,
  VocabSeed,
} from './types';

export const mcq = (
  id: string,
  topic: string,
  prompt: string,
  options: string[],
  answer: number,
  explain: string,
  optionWhy?: (string | undefined)[],
  category?: MistakeCategory,
): McqExercise => ({ id, type: 'mcq', topic, prompt, options, answer, explain, optionWhy, category });

export const gap = (
  id: string,
  topic: string,
  prompt: string,
  answers: string[],
  explain: string,
  hint?: string,
  ru?: string,
): GapExercise => ({ id, type: 'gap', topic, prompt, answers, explain, hint, ru });

export const order = (id: string, topic: string, words: string[], answers: string[], explain: string, ru?: string): OrderExercise => ({
  id,
  type: 'order',
  topic,
  words,
  answers,
  explain,
  ru,
});

export const tr = (id: string, topic: string, source: string, answers: string[], explain: string, hint?: string): TranslateExercise => ({
  id,
  type: 'translate',
  topic,
  source,
  answers,
  explain,
  hint,
});

export const listenMcq = (
  id: string,
  topic: string,
  say: string,
  prompt: string,
  options: string[],
  answer: number,
  explain: string,
): ListenExercise => ({ id, type: 'listen', mode: 'mcq', topic, say, prompt, options, answer, explain, category: 'listening' });

export const listenType = (id: string, topic: string, say: string, prompt: string, answers: string[], explain: string): ListenExercise => ({
  id,
  type: 'listen',
  mode: 'type',
  topic,
  say,
  prompt,
  answers,
  explain,
  category: 'listening',
});

export const v = (
  lang: Lang,
  id: string,
  word: string,
  trn: string,
  ex: string,
  exRu: string,
  cat: string,
  level: Level,
  pron?: string,
): VocabSeed => ({ id: `${lang}-v-${id}`, lang, word, tr: trn, ex, exRu, cat, level, pron });
