// Автоматическая (без AI) проверка письменных работ.
// Проверяет то, что можно проверить надёжно правилами: объём, структуру, связки,
// повторы и типичные ошибки русскоязычных. Балл IELTS без AI НЕ выставляется.

import type { Lang } from '../data/types';
import type { Finding } from './state';
import { splitSentences, wordCount } from './text';

interface Rule {
  re: RegExp;
  kind: string;
  message: string;
  hint: string;
  fix?: (m: string) => string;
}

const EN_RULES: Rule[] = [
  { re: /\b(i|we|they|you) (am|are) agree\b/gi, kind: 'Грамматика', message: 'Agree — глагол, связка am/are не нужна.', hint: 'Уберите am/are.', fix: (m) => m.replace(/ (am|are) agree/i, ' agree') },
  { re: /\b(he|she|it) is agree\b/gi, kind: 'Грамматика', message: 'Agree — глагол: he agrees.', hint: 'He/she + agrees.', fix: (m) => m.replace(/ is agree/i, ' agrees') },
  { re: /\bmore (better|worse|bigger|higher|lower|easier|cheaper|faster)\b/gi, kind: 'Грамматика', message: 'Двойная сравнительная степень.', hint: 'Уберите more.', fix: (m) => m.replace(/^more /i, '') },
  { re: /\b(informations|advices|researches|evidences|equipments|knowledges|furnitures)\b/gi, kind: 'Лексика', message: 'Неисчисляемое существительное не имеет множественного числа.', hint: 'Используйте форму без -s.', fix: (m) => m.replace(/s$/i, '') },
  { re: /\bdiscuss about\b/gi, kind: 'Лексика', message: 'Discuss — без предлога about.', hint: 'discuss something', fix: () => 'discuss' },
  { re: /\bexplain me\b/gi, kind: 'Грамматика', message: 'Explain something to someone.', hint: 'explain to me / explain it to me', fix: () => 'explain to me' },
  { re: /\bdepends? from\b/gi, kind: 'Лексика', message: 'Depend on, а не from.', hint: 'depend on', fix: (m) => m.replace(/from/i, 'on') },
  { re: /\bin the internet\b/gi, kind: 'Лексика', message: 'On the internet.', hint: 'on the internet', fix: () => 'on the internet' },
  { re: /\bmake (a )?research\b/gi, kind: 'Лексика', message: 'Research не сочетается с make.', hint: 'do / conduct research', fix: () => 'conduct research' },
  { re: /\baccording with\b/gi, kind: 'Лексика', message: 'According to.', hint: 'according to', fix: () => 'according to' },
  { re: /\bthe most of\b/gi, kind: 'Грамматика', message: '«Большинство» — most (of the) без the перед most.', hint: 'most people / most of the people', fix: () => 'most of' },
  { re: /\ba (?!(?:eu|one|once|uni|use|usu))(?=[aeio][a-z])\w+/gi, kind: 'Артикли', message: 'Перед гласным звуком используется an.', hint: 'an + гласный звук (an important, an increase).', fix: (m) => m.replace(/^a /i, 'an ') },
  { re: /\ban (?=(university|useful|european|one\b|uniform|unique|user))\w+/gi, kind: 'Артикли', message: 'Слово начинается с согласного звука [j]/[w] — нужен a.', hint: 'a university, a useful…', fix: (m) => m.replace(/^an /i, 'a ') },
  { re: /\b(people|children|police) (is|was|has)\b/gi, kind: 'Грамматика', message: 'Это существительное во множественном числе.', hint: 'people are / children were / police have', fix: (m) => m.replace(/ is$/i, ' are').replace(/ was$/i, ' were').replace(/ has$/i, ' have') },
  { re: /(?<!\b(?:does|did|do|can|could|will|would|should|must|may|might|to|let|make|help|not)\s)\b(he|she|it) (have|do|go|work|live|want|need|think)\b/gi, kind: 'Грамматика', message: 'После he/she/it в Present Simple нужен -s.', hint: 'has / does / goes / works…', fix: (m) => m.replace(/ (\w+)$/, (_x, w: string) => ' ' + (({ have: 'has', do: 'does', go: 'goes' } as Record<string, string>)[w.toLowerCase()] ?? w + 's')) },
  { re: /\b(didn't|did not|doesn't|does not) (\w+ed|went|saw|had|made|took)\b/gi, kind: 'Грамматика', message: 'После did/does not — начальная форма глагола.', hint: 'didn’t go / doesn’t make' },
  { re: /\bdespite (it|they|he|she|we|i|the \w+) (is|are|was|were)\b/gi, kind: 'Связность', message: 'Despite + существительное / -ing, а не предложение.', hint: 'Although + предложение или Despite + существительное.' },
  { re: /\balthough\b[^.]*,\s*but\b/gi, kind: 'Связность', message: 'Although и but в одном предложении не используются.', hint: 'Уберите but.' },
  { re: /\b(don't|doesn't|can't|won't|isn't|aren't|it's|i'm|they're|we're)\b/gi, kind: 'Стиль', message: 'Сокращения нежелательны в академическом письме.', hint: 'Пишите полную форму: do not, cannot…' },
  { re: /\b(gonna|wanna|kids|stuff|a lot of|lots of|things)\b/gi, kind: 'Стиль', message: 'Разговорное слово — для IELTS лучше нейтральный синоним.', hint: 'a lot of → many / a large number of; kids → children; things → factors / aspects.' },
  { re: /(^|[.!?]\s+)i\b/g, kind: 'Орфография', message: 'Местоимение I всегда пишется с заглавной буквы.', hint: 'I' },
  { re: /\s{2,}/g, kind: 'Оформление', message: 'Двойной пробел.', hint: 'Оставьте один пробел.', fix: () => ' ' },
];

const EN_LINKERS = ['however', 'therefore', 'moreover', 'furthermore', 'in addition', 'although', 'while', 'whereas', 'for example', 'for instance', 'as a result', 'consequently', 'on the other hand', 'in conclusion', 'to sum up', 'overall', 'firstly', 'secondly', 'finally', 'because', 'since', 'despite', 'in contrast', 'similarly'];
const KK_LINKERS = ['біріншіден', 'екіншіден', 'үшіншіден', 'сондай-ақ', 'сонымен қатар', 'бірақ', 'алайда', 'дегенмен', 'сондықтан', 'себебі', 'өйткені', 'мысалы', 'қорыта келгенде', 'қорытындылай келе', 'менің ойымша', 'меніңше', 'әрине'];
const STOP_EN = new Set('the a an and or of to in on at for is are was were be been it this that with as by from have has had not but which their they them can will would there these those than more also its our we i you he she his her'.split(' '));

const KK_NON_PLURAL = new Set(['қатар', 'қадар', 'базар', 'жайдар', 'айтар', 'жатар', 'кетер']);

/** Проверка гармонии в суффиксах множественного числа казахского языка. */
function kkPluralIssues(text: string): Finding[] {
  const out: Finding[] = [];
  const BACK = 'аоұы';
  const FRONT = 'әөүіе';
  const words = text.toLowerCase().match(/[\p{L}-]+/gu) ?? [];
  const seen = new Set<string>();
  for (const w of words) {
    const m = w.match(/^(.+?)(лар|лер|дар|дер|тар|тер)$/);
    if (!m || m[1].length < 2 || seen.has(w) || KK_NON_PLURAL.has(w)) continue;
    const stem = m[1];
    const suf = m[2];
    const vowels = [...stem].filter((ch) => BACK.includes(ch) || FRONT.includes(ch) || ch === 'и' || ch === 'у' || ch === 'я' || ch === 'ю' || ch === 'э' || ch === 'ё');
    const lastV = [...vowels].reverse().find((ch) => BACK.includes(ch) || FRONT.includes(ch));
    if (!lastV) continue;
    const expectedVowel = BACK.includes(lastV) ? 'а' : 'е';
    const last = stem[stem.length - 1];
    const vowelEnd = 'аоұыәөүіеиюя'.includes(last);
    let expectedCons: string;
    if (vowelEnd || 'рйу'.includes(last)) expectedCons = 'л';
    else if ('лмнңзж'.includes(last)) expectedCons = 'д';
    else if ('кқпстшфхцчщбвгд'.includes(last)) expectedCons = 'т';
    else continue;
    // После гласной -дар/-тар обычно не мн. число, а другая форма (айтар, қадар): проверяем только гармонию.
    if (vowelEnd && suf[0] !== 'л') expectedCons = suf[0];
    const expected = expectedCons + expectedVowel + 'р';
    if (suf !== expected) {
      seen.add(w);
      out.push({ kind: 'Морфология', message: `Возможная ошибка в окончании множественного числа: «${w}».`, excerpt: w, hint: 'Проверьте гармонию гласных (а/е) и первую согласную окончания (л/д/т).', fix: stem + expected });
    }
  }
  return out;
}

export interface WritingReport {
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentence: number;
  linkers: string[];
  lexicalVariety: number;
  repeated: { word: string; count: number }[];
  findings: Finding[];
  structure: { ok: boolean; message: string }[];
}

export function checkWriting(text: string, lang: Lang, task: 'ielts1' | 'ielts2' | 'kaz1' | 'kaz2' | 'diag' | 'free', promptText = ''): WritingReport {
  const words = wordCount(text);
  const sentences = splitSentences(text).length;
  const paragraphs = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean).length;
  const lower = ' ' + text.toLowerCase().replace(/[.,!?;:()«»"]/g, ' ') + ' ';
  const linkers = (lang === 'en' ? EN_LINKERS : KK_LINKERS).filter((l) => lower.includes(' ' + l + ' '));
  const tokens = (text.toLowerCase().match(/[\p{L}'-]+/gu) ?? []).filter((w) => w.length > 2);
  const content = lang === 'en' ? tokens.filter((t) => !STOP_EN.has(t)) : tokens;
  const freq = new Map<string, number>();
  for (const t of content) freq.set(t, (freq.get(t) ?? 0) + 1);
  const repeated = [...freq.entries()].filter(([, c]) => c >= (words > 200 ? 5 : 4)).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([word, count]) => ({ word, count }));
  const lexicalVariety = content.length ? Math.round((new Set(content).size / content.length) * 100) / 100 : 0;

  const findings: Finding[] = [];
  if (lang === 'en') {
    for (const r of EN_RULES) {
      const seen = new Set<string>();
      for (const m of text.matchAll(r.re)) {
        const ex = m[0];
        if (seen.has(ex.toLowerCase())) continue;
        seen.add(ex.toLowerCase());
        findings.push({ kind: r.kind, message: r.message, excerpt: ex.trim(), hint: r.hint, fix: r.fix ? r.fix(ex).trim() : undefined });
      }
    }
    // Предложение с маленькой буквы
    for (const s of splitSentences(text)) if (/^[a-z]/.test(s)) findings.push({ kind: 'Орфография', message: 'Предложение начинается со строчной буквы.', excerpt: s.slice(0, 40), hint: 'Начните с заглавной буквы.' });
    // Очень длинные предложения
    for (const s of splitSentences(text)) if (wordCount(s) > 40) findings.push({ kind: 'Связность', message: 'Очень длинное предложение (более 40 слов) — риск ошибок и потери ясности.', excerpt: s.slice(0, 60) + '…', hint: 'Разделите на 2 предложения.' });
  } else {
    findings.push(...kkPluralIssues(text));
    if (/[кгнуоиe]/.test(text) && !/[әғқңөұүһі]/i.test(text) && words > 15) {
      findings.push({ kind: 'Орфография', message: 'В тексте нет ни одной специфической казахской буквы — возможно, использована русская раскладка.', hint: 'Включите казахскую клавиатуру: ә, ғ, қ, ң, ө, ұ, ү, һ, і.' });
    }
  }

  const structure: { ok: boolean; message: string }[] = [];
  const min = task === 'ielts1' ? 150 : task === 'ielts2' ? 250 : task === 'diag' ? (lang === 'en' ? 80 : 50) : task === 'kaz1' ? 80 : task === 'kaz2' ? 120 : 0;
  if (min) structure.push({ ok: words >= min, message: words >= min ? `Объём: ${words} слов (минимум ${min}).` : `Объём: ${words} слов — меньше минимума ${min}. В IELTS недостаток объёма снижает балл по Task Achievement / Task Response.` });
  if (task === 'ielts2') {
    structure.push({ ok: paragraphs >= 4, message: paragraphs >= 4 ? `Абзацев: ${paragraphs} — структура вступление / основная часть / заключение возможна.` : `Абзацев: ${paragraphs}. Рекомендуется 4–5: вступление, 2–3 абзаца аргументов, заключение.` });
    const concl = /(in conclusion|to sum up|to conclude|overall)/i.test(text);
    structure.push({ ok: concl, message: concl ? 'Есть явное заключение.' : 'Не найдено явного заключения (In conclusion / To sum up).' });
    const opinion = /(i believe|in my opinion|i think|i agree|i disagree|from my perspective|in my view)/i.test(text);
    if (/agree|disagree|opinion|extent/i.test(promptText)) structure.push({ ok: opinion, message: opinion ? 'Позиция автора выражена.' : 'Вопрос требует вашей позиции — она не выражена явно.' });
  }
  if (task === 'ielts1') {
    const overview = /\b(overall|in general|it is clear that|it can be seen that)\b/i.test(text);
    structure.push({ ok: overview, message: overview ? 'Есть обзор (overview) — обязательный элемент Task 1.' : 'Нет обзора (Overall, …) — без него балл Task Achievement обычно не выше 5.' });
    const nums = (text.match(/\d+([.,]\d+)?\s?(%|percent|per cent|million|thousand)?/gi) ?? []).length;
    structure.push({ ok: nums >= 3, message: nums >= 3 ? `Приведены данные (${nums} числовых значений).` : 'Мало конкретных данных — подкрепите описание цифрами.' });
    const opinion = /(i think|i believe|in my opinion)/i.test(text);
    if (opinion) structure.push({ ok: false, message: 'В Task 1 не выражают личное мнение — только описание данных.' });
  }
  if (sentences > 0) {
    structure.push({ ok: linkers.length >= (task === 'ielts2' ? 4 : 2), message: `Связующие слова: ${linkers.length ? linkers.join(', ') : 'не найдены'}.` });
  }
  if (promptText && lang === 'en') {
    const keys = (promptText.toLowerCase().match(/[a-z]{5,}/g) ?? []).filter((w) => !STOP_EN.has(w) && !['write', 'least', 'words', 'reasons', 'answer', 'include', 'relevant', 'examples', 'knowledge', 'experience', 'summarise', 'information', 'selecting', 'reporting', 'features', 'comparisons'].includes(w));
    const uniqueKeys = [...new Set(keys)];
    const hit = uniqueKeys.filter((k) => lower.includes(k.slice(0, 5)));
    if (uniqueKeys.length >= 3) structure.push({ ok: hit.length / uniqueKeys.length >= 0.4, message: `Соответствие теме: использовано ${hit.length} из ${uniqueKeys.length} ключевых понятий задания (грубая проверка по словам).` });
  }
  return { words, sentences, paragraphs, avgSentence: sentences ? Math.round(words / sentences) : 0, linkers, lexicalVariety, repeated, findings, structure };
}

/** Критерии самопроверки по опубликованным дескрипторам IELTS (упрощённо). */
export const IELTS_SELF_CHECK: Record<'ielts1' | 'ielts2', { id: string; criterion: string; text: string }[]> = {
  ielts1: [
    { id: 'ta1', criterion: 'Task Achievement', text: 'Есть обзор главных тенденций (overview)' },
    { id: 'ta2', criterion: 'Task Achievement', text: 'Ключевые данные выбраны и подкреплены цифрами' },
    { id: 'cc1', criterion: 'Coherence & Cohesion', text: 'Логичные абзацы, связки используются уместно' },
    { id: 'lr1', criterion: 'Lexical Resource', text: 'Разнообразные слова для тенденций (rise, decline, fluctuate)' },
    { id: 'gr1', criterion: 'Grammatical Range & Accuracy', text: 'Есть сложные предложения; ошибки не мешают пониманию' },
  ],
  ielts2: [
    { id: 'tr1', criterion: 'Task Response', text: 'Ответил(а) на все части вопроса и чётко выразил(а) позицию' },
    { id: 'tr2', criterion: 'Task Response', text: 'Каждая идея раскрыта и подкреплена примером' },
    { id: 'cc1', criterion: 'Coherence & Cohesion', text: 'Каждый абзац — одна главная мысль; связки уместны' },
    { id: 'lr1', criterion: 'Lexical Resource', text: 'Нет повторов одних и тех же слов; использованы тематические выражения' },
    { id: 'gr1', criterion: 'Grammatical Range & Accuracy', text: 'Разнообразные конструкции (условные, пассив, придаточные)' },
  ],
};
