// Полная тематическая программа и недельные цели 90‑дневного интенсива.
// Темы с lessonId или route имеют готовый материал; остальные — запланированы, материал ещё не создан.
import type { CurriculumUnit, Lang, Level } from './types';

const u = (
  lang: Lang,
  id: string,
  title: string,
  kind: CurriculumUnit['kind'],
  level: Level,
  phase: CurriculumUnit['phase'],
  topic: string,
  extra: { lessonId?: string; route?: string; minutes?: number } = {},
): CurriculumUnit => ({ id: `${lang}-u-${id}`, lang, title, kind, level, phase, topic, minutes: extra.minutes ?? 15, lessonId: extra.lessonId, route: extra.route });

export const EN_UNITS: CurriculumUnit[] = [
  u('en', '01', 'Глагол to be, местоимения', 'grammar', 'A1', 1, 'en.be', { lessonId: 'en-01' }),
  u('en', '02', 'Present Simple', 'grammar', 'A1', 1, 'en.present-simple', { lessonId: 'en-02' }),
  u('en', 'v1', 'Лексика: знакомство, семья, повседневная жизнь', 'vocab', 'A1', 1, 'en.vocab-daily', { route: '#/vocab/topic/en/Повседневная жизнь' }),
  u('en', '03', 'Present Continuous vs Present Simple', 'grammar', 'A2', 1, 'en.present-continuous', { lessonId: 'en-03' }),
  u('en', '04', 'Артикли a / an / the', 'grammar', 'A2', 1, 'en.articles', { lessonId: 'en-04' }),
  u('en', '05', 'Past Simple', 'grammar', 'A2', 1, 'en.past-simple', { lessonId: 'en-05' }),
  u('en', 'there', 'There is / there are; much, many, a lot of', 'grammar', 'A1', 1, 'en.there-is'),
  u('en', 'poss', 'Притяжательные формы, множественное число', 'grammar', 'A1', 1, 'en.possessive'),
  u('en', '06', 'Present Perfect vs Past Simple', 'grammar', 'B1', 2, 'en.present-perfect', { lessonId: 'en-06' }),
  u('en', '07', 'Будущее время', 'grammar', 'A2', 2, 'en.future', { lessonId: 'en-07' }),
  u('en', '08', 'Сравнительная и превосходная степени', 'grammar', 'A2', 2, 'en.comparatives', { lessonId: 'en-08' }),
  u('en', 'v2', 'Лексика: работа и образование', 'vocab', 'A2', 2, 'en.vocab-work', { route: '#/vocab/topic/en/Работа' }),
  u('en', '09', 'Модальные глаголы', 'grammar', 'B1', 2, 'en.modals', { lessonId: 'en-09' }),
  u('en', 'pc', 'Past Continuous', 'grammar', 'A2', 2, 'en.past-continuous'),
  u('en', 'prep', 'Предлоги места, времени и движения', 'grammar', 'A2', 2, 'en.prepositions'),
  u('en', 'v3', 'Лексика: здоровье и питание', 'vocab', 'A2', 2, 'en.vocab-health', { route: '#/vocab/topic/en/Здоровье' }),
  u('en', '10', 'Пассивный залог', 'grammar', 'B1', 2, 'en.passive', { lessonId: 'en-10' }),
  u('en', 'adj', 'Прилагательные и наречия', 'grammar', 'A2', 2, 'en.adjectives-adverbs'),
  u('en', 'ger', 'Герундий и инфинитив', 'grammar', 'B1', 2, 'en.gerund-infinitive'),
  u('en', 'v4', 'Лексика: путешествия и покупки', 'vocab', 'A2', 2, 'en.vocab-travel', { route: '#/vocab/topic/en/Путешествия' }),
  u('en', '12', 'Условные предложения 0–2', 'grammar', 'B1', 2, 'en.conditionals', { lessonId: 'en-12' }),
  u('en', '11', 'Связующие слова', 'grammar', 'B1', 2, 'en.linking', { lessonId: 'en-11' }),
  u('en', 'rel', 'Относительные придаточные (who, which, that)', 'grammar', 'B1', 2, 'en.relative-clauses'),
  u('en', 'v5', 'Лексика: технологии и наука', 'vocab', 'B1', 2, 'en.vocab-science', { route: '#/vocab/topic/en/Наука' }),
  u('en', 'ppc', 'Present Perfect Continuous', 'grammar', 'B1', 2, 'en.present-perfect-continuous'),
  u('en', 'skR', 'IELTS Reading: skimming и scanning', 'skill', 'B1', 2, 'en.reading-strategy', { route: '#/ielts/reading' }),
  u('en', 'skL', 'IELTS Listening: form completion', 'skill', 'B1', 2, 'en.listening-detail', { route: '#/ielts/listening' }),
  u('en', 'v6', 'Лексика: экология и общество', 'vocab', 'B1', 2, 'en.vocab-society', { route: '#/vocab/topic/en/Общество' }),
  u('en', 'rep', 'Косвенная речь', 'grammar', 'B1', 2, 'en.reported-speech'),
  u('en', 'cx', 'Сложные предложения', 'grammar', 'B1', 2, 'en.complex-sentences'),
  u('en', 'skW1', 'IELTS Writing Task 1: описание графика', 'skill', 'B1', 2, 'en.writing-task1', { route: '#/ielts/writing' }),
  u('en', 'skS', 'IELTS Speaking: Part 1 и Part 2', 'skill', 'B1', 2, 'en.speaking', { route: '#/ielts/speaking' }),
  u('en', 'v7', 'Академическая лексика', 'vocab', 'B1', 2, 'en.vocab-academic', { route: '#/vocab/topic/en/Академическая деятельность' }),
  u('en', 'exR1', 'Reading: True/False/Not Given, Matching Headings', 'exam', 'B1', 3, 'en.reading-tfng', { route: '#/ielts/reading' }),
  u('en', 'exL', 'Listening: Parts 3–4 (лекции, дискуссии)', 'exam', 'B1', 3, 'en.listening-detail', { route: '#/ielts/listening' }),
  u('en', 'exW2', 'Writing Task 2: структура эссе', 'exam', 'B1', 3, 'en.writing-task2', { route: '#/ielts/writing' }),
  u('en', 'acad', 'Академические конструкции, номинализация', 'grammar', 'B2', 3, 'en.academic-structures'),
  u('en', 'exS3', 'Speaking Part 3: аргументация', 'exam', 'B1', 3, 'en.speaking', { route: '#/ielts/speaking' }),
  u('en', 'med', 'Медицинская терминология (доп. модуль)', 'vocab', 'B1', 3, 'en.vocab-medical', { route: '#/medical' }),
  u('en', 'exW1p', 'Writing Task 1: процессы и карты', 'exam', 'B1', 3, 'en.writing-task1', { route: '#/ielts/writing' }),
  u('en', 'exR2', 'Reading: summary и sentence completion', 'exam', 'B1', 3, 'en.reading-detail', { route: '#/ielts/reading' }),
  u('en', 'mock', 'Пробные экзамены и работа над слабыми местами', 'exam', 'B1', 4, 'en.mock', { route: '#/exams' }),
];

export const KK_UNITS: CurriculumUnit[] = [
  u('kk', '01', 'Алфавит и особые звуки', 'grammar', 'A1', 1, 'kk.alphabet', { lessonId: 'kk-01' }),
  u('kk', '02', 'Сингармонизм', 'grammar', 'A1', 1, 'kk.harmony', { lessonId: 'kk-02' }),
  u('kk', '03', 'Личные окончания', 'grammar', 'A1', 1, 'kk.personal', { lessonId: 'kk-03' }),
  u('kk', '04', 'Вопрос и отрицание', 'grammar', 'A1', 1, 'kk.question-neg', { lessonId: 'kk-04' }),
  u('kk', '11', 'Числа, время, даты', 'vocab', 'A1', 1, 'kk.numbers-time', { lessonId: 'kk-11' }),
  u('kk', '05', 'Множественное число', 'grammar', 'A1', 1, 'kk.plural', { lessonId: 'kk-05' }),
  u('kk', 'v1', 'Лексика: семья, знакомство', 'vocab', 'A1', 1, 'kk.vocab-daily', { route: '#/vocab/topic/kk/Семья' }),
  u('kk', '06', 'Притяжательные окончания', 'grammar', 'A2', 2, 'kk.possessive', { lessonId: 'kk-06' }),
  u('kk', '07', 'Падежи: барыс, жатыс, шығыс', 'grammar', 'A2', 2, 'kk.cases-spatial', { lessonId: 'kk-07' }),
  u('kk', '08', 'Падежи: ілік, табыс', 'grammar', 'A2', 2, 'kk.cases-gen-acc', { lessonId: 'kk-08' }),
  u('kk', '09', 'Настояще-будущее время', 'grammar', 'A2', 2, 'kk.present', { lessonId: 'kk-09' }),
  u('kk', '10', 'Прошедшее время', 'grammar', 'A2', 2, 'kk.past', { lessonId: 'kk-10' }),
  u('kk', 'instr', 'Көмектес септік (с кем? чем?)', 'grammar', 'A2', 2, 'kk.instrumental'),
  u('kk', 'v2', 'Лексика: покупки, транспорт', 'vocab', 'A2', 2, 'kk.vocab-shopping', { route: '#/vocab/topic/kk/Покупки' }),
  u('kk', 'cont', 'Нақ осы шақ: жатыр, отыр, тұр, жүр', 'grammar', 'A2', 2, 'kk.present-continuous'),
  u('kk', 'fut', 'Будущее время: -мақ, -ар/-ер', 'grammar', 'B1', 2, 'kk.future'),
  u('kk', '12', 'На приёме у врача', 'vocab', 'A2', 2, 'kk.medical', { lessonId: 'kk-12' }),
  u('kk', 'mod', 'Модальность: керек, мүмкін, -а алу', 'grammar', 'B1', 2, 'kk.modality'),
  u('kk', 'cond', 'Шартты рай: -са/-се', 'grammar', 'B1', 2, 'kk.conditional'),
  u('kk', 'imp', 'Повелительное и желательное наклонение', 'grammar', 'A2', 2, 'kk.imperative'),
  u('kk', 'part', 'Причастия (есімше)', 'grammar', 'B1', 2, 'kk.participle'),
  u('kk', 'conv', 'Деепричастия (көсемше)', 'grammar', 'B1', 2, 'kk.converb'),
  u('kk', 'v3', 'Лексика: работа, образование', 'vocab', 'A2', 2, 'kk.vocab-work', { route: '#/vocab/topic/kk/Работа' }),
  u('kk', 'order', 'Порядок слов и естественное построение предложений', 'grammar', 'B1', 2, 'kk.word-order'),
  u('kk', 'cx', 'Сложные предложения', 'grammar', 'B1', 3, 'kk.complex'),
  u('kk', 'exL', 'КАЗТЕСТ: Тыңдалым', 'exam', 'A2', 3, 'kk.listening-detail', { route: '#/kaztest/listening' }),
  u('kk', 'exR', 'КАЗТЕСТ: Оқылым', 'exam', 'A2', 3, 'kk.reading-detail', { route: '#/kaztest/reading' }),
  u('kk', 'exW1', 'КАЗТЕСТ: Жазылым — описание изображения', 'exam', 'A2', 3, 'kk.writing', { route: '#/kaztest/writing' }),
  u('kk', 'exW2', 'КАЗТЕСТ: Жазылым — эссе', 'exam', 'B1', 3, 'kk.writing', { route: '#/kaztest/writing' }),
  u('kk', 'exS', 'КАЗТЕСТ: Айтылым', 'exam', 'A2', 3, 'kk.speaking', { route: '#/kaztest/speaking' }),
  u('kk', 'v4', 'Лексика: государственные учреждения', 'vocab', 'B1', 3, 'kk.vocab-society', { route: '#/vocab/topic/kk/Общество' }),
  u('kk', 'mock', 'Пробный КАЗТЕСТ и слабые места', 'exam', 'A2', 4, 'kk.mock', { route: '#/exams' }),
];

export const UNITS: Record<Lang, CurriculumUnit[]> = { en: EN_UNITS, kk: KK_UNITS };

export interface WeekGoal {
  week: number;
  phase: 1 | 2 | 3 | 4;
  title: string;
  goals: string[];
  results: string[];
}

export const WEEK_GOALS: WeekGoal[] = [
  { week: 1, phase: 1, title: 'Диагностика и старт', goals: ['Пройти диагностику английского и казахского', 'EN: to be, Present Simple', 'KK: алфавит, сингармонизм'], results: ['Диагностический профиль по 4 навыкам каждого языка', '≥ 70 % в контроле уроков недели', '≥ 30 слов в словаре'] },
  { week: 2, phase: 1, title: 'Устранение базовых пробелов', goals: ['EN: Present Continuous, артикли, Past Simple', 'KK: личные окончания, вопрос, числа', 'День 14 — первый контроль'], results: ['Контрольная точка дня 14: ≥ 60 %', 'Ошибки по артиклям и to be — не более 1 из 5 в контроле'] },
  { week: 3, phase: 2, title: 'Времена и опыт', goals: ['EN: Present Perfect, будущее время', 'KK: множественное число, притяжательные окончания', 'Ежедневное аудирование 10 минут'], results: ['≥ 75 % в контроле Present Perfect', 'Диктант A2 без ошибок в окончаниях'] },
  { week: 4, phase: 2, title: 'Сравнение и модальность', goals: ['EN: сравнения, модальные глаголы', 'KK: падежи барыс / жатыс / шығыс', 'День 30 — промежуточная оценка'], results: ['Контрольная точка дня 30', '≥ 100 слов в словаре, ≥ 30 % в статусе «изучаемые»'] },
  { week: 5, phase: 2, title: 'Научный стиль', goals: ['EN: пассивный залог, прилагательные и наречия', 'KK: ілік и табыс, настоящее время', 'Первый опыт IELTS Reading'], results: ['Reading-тренировка: ≥ 50 % верных ответов', 'Пассив — ≥ 75 % в контроле'] },
  { week: 6, phase: 2, title: 'Связность речи', goals: ['EN: условные предложения, связующие слова', 'KK: прошедшее время, медицинский диалог', 'День 45 — контроль навыков'], results: ['Контрольная точка дня 45', 'Первое эссе-абзац ≥ 120 слов со связками'] },
  { week: 7, phase: 2, title: 'Переход к экзаменационным форматам', goals: ['EN: Writing Task 1, Speaking Part 1–2', 'KK: модальность, условное наклонение', 'Listening Part 1–2'], results: ['Task 1 ≥ 150 слов с overview', 'Монолог Part 2 — 1,5–2 минуты'] },
  { week: 8, phase: 3, title: 'IELTS Reading и КАЗТЕСТ Оқылым', goals: ['TFNG, Matching headings', 'Оқылым: тексты 1–2 на время', 'Регулярное повторение ошибок'], results: ['Reading: ≥ 55 % по секции', 'Оқылым: ≥ 60 %'] },
  { week: 9, phase: 3, title: 'Writing Task 2 и Жазылым', goals: ['Структура эссе Task 2', 'КАЗТЕСТ: описание изображения', 'День 60 — экзаменационная диагностика'], results: ['Эссе ≥ 250 слов за 40 минут', 'Контрольная точка дня 60'] },
  { week: 10, phase: 3, title: 'Listening и Тыңдалым на время', goals: ['Listening Parts 3–4', 'Тыңдалым: диалоги и текст', 'Работа с ограничением времени'], results: ['Listening: ≥ 22/40 (≈ 5.5) при экстраполяции', 'Тыңдалым: ≥ 60 %'] },
  { week: 11, phase: 3, title: 'Speaking и Айтылым', goals: ['Speaking Part 3', 'Айтылым: мнение и ситуация', 'День 75 — оценка готовности'], results: ['3 записи Speaking с анализом', 'Контрольная точка дня 75'] },
  { week: 12, phase: 4, title: 'Экзаменационный интенсив I', goals: ['Полные секции IELTS на время', 'Пробный КАЗТЕСТ по блокам', 'Повторение слабых тем'], results: ['Пробный экзамен IELTS (все доступные секции)', 'Пробный КАЗТЕСТ'] },
  { week: 13, phase: 4, title: 'Экзаменационный интенсив II и итог', goals: ['Финальная отработка стратегий', 'Восстановление и режим', 'День 90 — итоговая оценка готовности'], results: ['Итоговая контрольная точка', 'Отчёт о готовности по каждому компоненту'] },
];

/** Названия тем для отображения в «Моих ошибках» и статистике. */
export const TOPIC_NAMES: Record<string, string> = Object.fromEntries(
  [...EN_UNITS, ...KK_UNITS].map((u) => [u.topic, u.title]),
);
Object.assign(TOPIC_NAMES, {
  'en.reading-detail': 'Reading: детали',
  'en.reading-main': 'Reading: главная мысль',
  'en.reading-tfng': 'Reading: True/False/Not Given',
  'en.reading-vocab': 'Reading: лексика в контексте',
  'en.reading-headings': 'Reading: Matching Headings',
  'en.listening-detail': 'Listening: детали',
  'en.listening-numbers': 'Listening: числа и время',
  'en.listening-inference': 'Listening: вывод',
  'en.past-perfect': 'Past Perfect',
  'en.vocab-daily': 'Лексика: повседневная',
  'en.vocab-work': 'Лексика: работа',
  'en.vocab-health': 'Лексика: здоровье',
  'en.vocab-travel': 'Лексика: путешествия',
  'en.vocab-education': 'Лексика: образование',
  'en.vocab-academic': 'Академическая лексика',
  'en.vocab-society': 'Лексика: общество',
  'en.vocab-science': 'Лексика: наука',
  'en.vocab-medical': 'Медицинская лексика',
  'en.spelling': 'Орфография (EN)',
  'en.vocab-words': 'Словарь: слова (EN)',
  'kk.vocab-words': 'Словарь: слова (KK)',
  'en.speaking': 'Говорение (EN)',
  'kk.speaking': 'Айтылым',
  'en.writing': 'Письмо (EN)',
  'kk.writing': 'Жазылым',
  'en.dictation': 'Диктант (EN)',
  'kk.dictation': 'Диктант (KK)',
  'kk.reading-detail': 'Оқылым: детали',
  'kk.reading-main': 'Оқылым: главная мысль',
  'kk.reading-vocab': 'Оқылым: лексика',
  'kk.listening-detail': 'Тыңдалым: детали',
  'kk.listening-numbers': 'Тыңдалым: числа и время',
  'kk.listening-inference': 'Тыңдалым: вывод',
  'kk.vocab-work': 'Лексика: работа (KK)',
  'kk.vocab-daily': 'Лексика: повседневная (KK)',
  'kk.vocab-health': 'Лексика: здоровье (KK)',
  'kk.vocab-time': 'Лексика: время (KK)',
  'kk.vocab-shopping': 'Лексика: покупки (KK)',
  'kk.vocab-science': 'Лексика: наука (KK)',
  'kk.vocab-society': 'Лексика: общество (KK)',
  'kk.passive': 'Страдательный залог (KK)',
  'kk.spelling': 'Орфография (KK)',
});

export function topicName(id: string): string {
  return TOPIC_NAMES[id] ?? id;
}
