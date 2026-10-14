// IELTS Writing и Speaking: оригинальные задания. Данные графиков — учебные (вымышленные).

export type ChartSpec =
  | { kind: 'bars'; categories: string[]; series: { name: string; values: number[] }[]; unit: string; yMax: number }
  | { kind: 'lines'; x: string[]; series: { name: string; values: number[] }[]; unit: string; yMax: number }
  | { kind: 'table'; head: string[]; rows: (string | number)[][] }
  | { kind: 'process'; steps: string[]; branch?: { after: number; text: string } };

export interface WritingTask {
  id: string;
  task: 'ielts1' | 'ielts2';
  prompt: string;
  chart?: ChartSpec;
  tips: string[];
  model?: string;
}

const T1_INSTR = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.';

export const IELTS_WRITING: WritingTask[] = [
  {
    id: 'w1-bars',
    task: 'ielts1',
    prompt: `The chart below shows the percentage of adults who met recommended physical activity levels in four countries in 2000 and 2020. ${T1_INSTR}`,
    chart: { kind: 'bars', categories: ['Canada', 'Japan', 'UK', 'Kazakhstan'], series: [{ name: '2000', values: [48, 40, 35, 30] }, { name: '2020', values: [55, 38, 52, 44] }], unit: '%', yMax: 60 },
    tips: ['Обзор: в трёх странах из четырёх показатель вырос; Япония — исключение.', 'Сравните самые большие изменения (UK +17, Kazakhstan +14).', 'Не перечисляйте все цифры подряд — группируйте.'],
  },
  {
    id: 'w1-lines',
    task: 'ielts1',
    prompt: `The graph below shows the number of patients (in thousands) attending diabetes clinics in a city between 2010 and 2025. ${T1_INSTR}`,
    chart: { kind: 'lines', x: ['2010', '2015', '2020', '2025'], series: [{ name: 'Type 2 diabetes', values: [12, 18, 27, 31] }, { name: 'Type 1 diabetes', values: [4, 4.5, 5, 5.2] }], unit: 'thousand', yMax: 35 },
    tips: ['Обзор: Type 2 резко вырос, Type 1 почти не изменился.', 'Лексика тенденций: rose steadily, increased sharply, remained stable, levelled off.', 'Сравните итоговые значения 2025 г.'],
  },
  {
    id: 'w1-process',
    task: 'ielts1',
    prompt: `The diagram below shows how blood samples are processed in a hospital laboratory. ${T1_INSTR}`,
    chart: { kind: 'process', steps: ['Sample taken from patient', 'Tube labelled with barcode', 'Sent to laboratory by tube system', 'Centrifuged (10 minutes)', 'Analysed by automatic machine', 'Results checked by specialist', 'Results sent electronically to doctor'], branch: { after: 5, text: 'Abnormal result → doctor telephoned immediately' } },
    tips: ['Процесс описывают в пассиве: The sample is labelled…', 'Используйте first, next, after that, once, finally.', 'Обзор: число этапов, начало и конец процесса.'],
  },
  {
    id: 'w1-table',
    task: 'ielts1',
    prompt: `The table below shows the average number of minutes per day that doctors in one hospital spent on different activities in 2015 and 2025. ${T1_INSTR}`,
    chart: { kind: 'table', head: ['Activity', '2015', '2025'], rows: [['Patient consultations', 210, 180], ['Computer work and paperwork', 90, 150], ['Teaching', 40, 30], ['Research', 20, 25]] },
    tips: ['Главная тенденция: компьютерная работа выросла сильнее всего, консультации сократились.', 'Используйте while / whereas для контраста.'],
  },
  {
    id: 'w2-health',
    task: 'ielts2',
    prompt: 'Some people think that governments should be responsible for people’s health, while others believe that individuals should take responsibility for their own health. Discuss both these views and give your own opinion. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.',
    tips: ['Структура: вступление (перефраз + позиция), абзац 1 — государство, абзац 2 — человек, заключение.', 'Позиция должна быть видна во вступлении и заключении.', 'Пример из врачебной практики — сильный аргумент.'],
  },
  {
    id: 'w2-ageing',
    task: 'ielts2',
    prompt: 'In many countries, people are living longer than ever before. What problems does this cause, and what solutions can you suggest? Write at least 250 words.',
    tips: ['Проблемы: нагрузка на здравоохранение, пенсии, нехватка ухода.', 'Решения — к каждой проблеме.', 'Problem–solution essay: позиция не обязательна, но нужен чёткий вывод.'],
  },
  {
    id: 'w2-online',
    task: 'ielts2',
    prompt: 'Online learning is increasingly replacing traditional classroom teaching. To what extent do you agree or disagree that this is a positive development? Write at least 250 words.',
    tips: ['Выберите позицию (например, частично согласен) и держите её во всём эссе.', 'Каждый абзац — одна главная идея + пример.'],
  },
  {
    id: 'w2-research',
    task: 'ielts2',
    prompt: 'Some people believe that scientific research should only be funded if it has clear practical benefits. To what extent do you agree or disagree? Write at least 250 words.',
    tips: ['Пример: фундаментальные исследования митохондрий привели к пониманию болезней.', 'Используйте уступку: Although…, …'],
  },
  {
    id: 'w2-worklife',
    task: 'ielts2',
    prompt: 'Many people now work long hours and have little time for physical exercise. Why is this happening, and what can be done to address the problem? Write at least 250 words.',
    tips: ['Causes/solutions essay: 2 причины, 2 решения.', 'Связки: One major reason is…, This could be addressed by…'],
  },
  {
    id: 'w2-migration',
    task: 'ielts2',
    prompt: 'Many doctors trained in developing countries move to work in richer countries. Do the advantages of this trend outweigh the disadvantages? Write at least 250 words.',
    tips: ['Advantages vs disadvantages: ответьте на вопрос «outweigh?» явно.', 'Лексика: brain drain, remittances, professional development.'],
  },
];

export interface SpeakingPart1Topic {
  id: string;
  topic: string;
  questions: string[];
}

export interface CueCard {
  id: string;
  title: string;
  bullets: string[];
  part3: string[];
}

export const IELTS_SPEAKING_P1: SpeakingPart1Topic[] = [
  { id: 'work', topic: 'Work', questions: ['What do you do?', 'Why did you choose this job?', 'What do you like most about your work?', 'Would you like to change anything about your job in the future?'] },
  { id: 'home', topic: 'Hometown', questions: ['Where is your hometown?', 'What is it known for?', 'How has it changed in recent years?', 'Would you like to live there in the future?'] },
  { id: 'free', topic: 'Free time', questions: ['What do you usually do in your free time?', 'Do you prefer to relax alone or with other people?', 'Did you have more free time when you were younger?', 'Is there a new hobby you would like to try?'] },
  { id: 'tech', topic: 'Technology', questions: ['How often do you use a computer?', 'Which app do you use the most?', 'Do you think people spend too much time on their phones?', 'Has technology made your work easier?'] },
  { id: 'food', topic: 'Food and health', questions: ['What kind of food do you like?', 'Do you think you have a healthy diet?', 'Do people in your country cook at home a lot?', 'Is it easy to eat healthily where you live?'] },
  { id: 'study', topic: 'Studying', questions: ['Are you studying anything at the moment?', 'Do you prefer studying in the morning or in the evening?', 'What is the most difficult thing about learning a language?', 'How do you usually prepare for exams?'] },
];

export const IELTS_CUE_CARDS: CueCard[] = [
  { id: 'teacher', title: 'Describe a teacher who had an important influence on you.', bullets: ['who this teacher was', 'what subject he or she taught', 'what this teacher was like', 'and explain why this teacher influenced you'], part3: ['What qualities make a good teacher?', 'Is the role of teachers changing because of technology?', 'Should teachers be paid more than they are now?', 'Do you think students learn better from teachers or from each other?'] },
  { id: 'skill', title: 'Describe a skill you learned as an adult.', bullets: ['what the skill is', 'when and how you learned it', 'how difficult it was', 'and explain how this skill has helped you'], part3: ['Is it harder for adults than for children to learn new skills? Why?', 'Which skills will be most important in the future?', 'Should employers pay for their staff to learn new skills?', 'How has the internet changed the way people learn?'] },
  { id: 'device', title: 'Describe a piece of technology that you use in your work.', bullets: ['what it is', 'how long you have used it', 'what you use it for', 'and explain how your work would be different without it'], part3: ['How has technology changed medicine in your country?', 'Are there any risks in relying too much on technology?', 'Will computers replace doctors in the future?', 'How can older people be helped to use new technology?'] },
  { id: 'decision', title: 'Describe an important decision you made.', bullets: ['what the decision was', 'when you made it', 'who you discussed it with', 'and explain why it was important'], part3: ['Do young people make decisions differently from older people?', 'Should parents make important decisions for their children?', 'Is it better to make decisions quickly or slowly?', 'What decisions do governments find most difficult?'] },
];

/** Полезные фразы для ответов (оригинальные). */
export const SPEAKING_PHRASES = [
  'That’s an interesting question. I’d say that…',
  'Well, to be honest, …',
  'One reason is that… Another reason is…',
  'For example, in my hospital…',
  'On the one hand…, but on the other hand…',
  'It depends on the situation, but generally…',
  'I’ve never really thought about it, but I suppose…',
];
