// Нормализация и сравнение ответов пользователя.

/** Приводит ответ к сравнимому виду: регистр, пробелы, апострофы, конечная пунктуация. */
export function normalize(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”«»"]/g, '')
    .replace(/[.!?,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Раскрывает частые сокращения, чтобы «I'm» и «I am» считались одинаковыми. */
export function expandContractions(s: string): string {
  return s
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\b(he|she|it|that|there|what)'s\b/g, '$1 is')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(i|you|he|she|we|they|it)'ll\b/g, '$1 will')
    .replace(/\b(i|you|he|she|we|they)'d\b/g, '$1 would')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bcan not\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/\b(\w+)n't\b/g, '$1 not');
}

export function canonical(s: string): string {
  return expandContractions(normalize(s));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export type MatchResult = 'exact' | 'typo' | 'wrong';

/**
 * Сравнивает ответ со списком допустимых.
 * «typo» — одна опечатка в слове длиной ≥ 5 символов (засчитывается с пометкой).
 * Для коротких ответов опечатки не допускаются: «is»/«it» — разные слова.
 */
export function matchAnswer(input: string, accepted: string[]): { result: MatchResult; closest: string } {
  const c = canonical(input);
  let closest = accepted[0] ?? '';
  let best = Infinity;
  for (const a of accepted) {
    const ca = canonical(a);
    if (ca === c) return { result: 'exact', closest: a };
    const d = levenshtein(c, ca);
    if (d < best) {
      best = d;
      closest = a;
    }
  }
  const target = canonical(closest);
  if (best === 1 && target.length >= 5 && !target.includes(' ')) return { result: 'typo', closest };
  return { result: 'wrong', closest };
}

export function wordCount(s: string): number {
  const m = s.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return m ? m.length : 0;
}

export function splitSentences(s: string): string[] {
  return s
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Пословное сравнение для диктантов: возвращает разметку совпадений. */
export function diffWords(expected: string, actual: string): { word: string; ok: boolean; got?: string }[] {
  const e = normalize(expected).split(' ').filter(Boolean);
  const a = normalize(actual).split(' ').filter(Boolean);
  // LCS по словам
  const dp: number[][] = Array.from({ length: e.length + 1 }, () => new Array(a.length + 1).fill(0));
  for (let i = e.length - 1; i >= 0; i--)
    for (let j = a.length - 1; j >= 0; j--)
      dp[i][j] = e[i] === a[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { word: string; ok: boolean; got?: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < e.length) {
    if (j < a.length && e[i] === a[j]) {
      out.push({ word: e[i], ok: true });
      i++;
      j++;
    } else if (j < a.length && dp[i][j + 1] > dp[i + 1][j]) {
      j++;
    } else {
      // слово пропущено или написано с ошибкой
      const got = j < a.length && dp[i + 1][j + 1] === dp[i][j] ? a[j] : undefined;
      if (got !== undefined) j++;
      out.push({ word: e[i], ok: false, got });
      i++;
    }
  }
  return out;
}

export function shuffle<T>(arr: T[], seed = Math.random()): T[] {
  const a = arr.slice();
  let s = Math.floor(seed * 2 ** 31) || 1;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(rnd() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
