// Дополнительный модуль «Английский для врача и исследователя». Тексты — оригинальные учебные фрагменты.
import { mcq, gap } from './builders';
import type { Exercise } from './types';

export interface TermGroup {
  title: string;
  terms: { en: string; ru: string; note?: string }[];
}

export const MED_TERMS: TermGroup[] = [
  { title: 'Диабетическая стопа и раны', terms: [
    { en: 'diabetic foot ulcer (DFU)', ru: 'синдром диабетической стопы, язва' }, { en: 'peripheral neuropathy', ru: 'периферическая нейропатия' }, { en: 'peripheral arterial disease', ru: 'заболевание периферических артерий' },
    { en: 'offloading', ru: 'разгрузка (стопы)' }, { en: 'debridement', ru: 'хирургическая обработка раны', note: '/dɪˈbriːdmənt/' }, { en: 'wound healing', ru: 'заживление раны' },
    { en: 'osteomyelitis', ru: 'остеомиелит' }, { en: 'minor / major amputation', ru: 'малая / высокая ампутация' }, { en: 'Wagner grade', ru: 'степень по Вагнеру' },
  ] },
  { title: 'Митохондрии и метаболизм', terms: [
    { en: 'mitochondrial dysfunction', ru: 'митохондриальная дисфункция' }, { en: 'oxidative phosphorylation', ru: 'окислительное фосфорилирование' }, { en: 'reactive oxygen species (ROS)', ru: 'активные формы кислорода' },
    { en: 'mitophagy', ru: 'митофагия' }, { en: 'insulin resistance', ru: 'инсулинорезистентность' }, { en: 'glycated haemoglobin (HbA1c)', ru: 'гликированный гемоглобин' },
  ] },
  { title: 'Иммунное старение', terms: [
    { en: 'immunosenescence', ru: 'иммунное старение', note: '/ɪˌmjuːnəʊsɪˈnesns/' }, { en: 'inflammageing', ru: 'хроническое воспаление при старении' }, { en: 'chronic low-grade inflammation', ru: 'хроническое вялотекущее воспаление' },
    { en: 'cytokine', ru: 'цитокин' }, { en: 'innate / adaptive immunity', ru: 'врождённый / приобретённый иммунитет' },
  ] },
  { title: 'Методология и статистика', terms: [
    { en: 'randomised controlled trial (RCT)', ru: 'рандомизированное контролируемое исследование' }, { en: 'cohort study', ru: 'когортное исследование' }, { en: 'cross-sectional study', ru: 'поперечное исследование' },
    { en: 'sample size', ru: 'размер выборки' }, { en: 'confidence interval (CI)', ru: 'доверительный интервал' }, { en: 'statistically significant (p < 0.05)', ru: 'статистически значимый' },
    { en: 'odds ratio / hazard ratio', ru: 'отношение шансов / отношение рисков' }, { en: 'confounding factor', ru: 'вмешивающийся фактор' }, { en: 'inclusion / exclusion criteria', ru: 'критерии включения / исключения' },
  ] },
];

export interface AbstractText {
  id: string;
  title: string;
  parts: { label: string; en: string; ru: string; note: string }[];
}

export const MED_ABSTRACTS: AbstractText[] = [
  {
    id: 'abs1',
    title: 'Учебная аннотация (вымышленное исследование): митохондриальная функция и заживление язв',
    parts: [
      { label: 'Background', en: 'Impaired wound healing is a major cause of amputation in patients with diabetes. Mitochondrial dysfunction has been proposed as a contributing factor, but clinical evidence is limited.', ru: 'Нарушение заживления ран — одна из главных причин ампутаций у пациентов с диабетом. Митохондриальная дисфункция рассматривается как возможный фактор, однако клинических данных мало.', note: 'Background: что известно + пробел в знаниях («but clinical evidence is limited»). Present Perfect Passive: has been proposed.' },
      { label: 'Methods', en: 'We conducted a prospective cohort study of 120 patients with neuropathic foot ulcers. Mitochondrial respiration was measured in skin biopsies taken at baseline. The primary outcome was complete healing at 12 weeks.', ru: 'Мы провели проспективное когортное исследование 120 пациентов с нейропатическими язвами стопы. Митохондриальное дыхание измеряли в биоптатах кожи, взятых исходно. Первичная конечная точка — полное заживление через 12 недель.', note: 'Methods: Past Simple + пассив (was measured). Primary outcome — первичная конечная точка.' },
      { label: 'Results', en: 'Patients in the lowest tertile of mitochondrial respiration were less likely to heal (odds ratio 0.42; 95% CI 0.21–0.83; p = 0.01), after adjustment for HbA1c and ulcer size.', ru: 'Пациенты из нижнего тертиля митохондриального дыхания реже достигали заживления (ОШ 0,42; 95% ДИ 0,21–0,83; p = 0,01) с поправкой на HbA1c и размер язвы.', note: 'Results: числа + after adjustment for… — «с поправкой на». Сравнительная конструкция less likely to.' },
      { label: 'Conclusions', en: 'Reduced mitochondrial function in the skin was independently associated with poor healing. Interventional studies are needed to determine whether this relationship is causal.', ru: 'Сниженная функция митохондрий кожи была независимо связана с плохим заживлением. Необходимы интервенционные исследования, чтобы установить, является ли эта связь причинной.', note: 'Conclusions: осторожные формулировки (associated with, not «caused»). Это важно и для IELTS Writing.' },
    ],
  },
];

export const MED_PHRASES: { title: string; items: { en: string; ru: string }[] }[] = [
  { title: 'Научный доклад', items: [
    { en: 'Today I would like to present the results of our study on…', ru: 'Сегодня я хотел бы представить результаты нашего исследования…' },
    { en: 'As you can see on this slide, …', ru: 'Как видно на этом слайде, …' },
    { en: 'These findings suggest that…', ru: 'Эти результаты позволяют предположить, что…' },
    { en: 'I would be happy to answer any questions.', ru: 'С удовольствием отвечу на вопросы.' },
  ] },
  { title: 'Академическая дискуссия', items: [
    { en: 'That’s a good point. However, …', ru: 'Это хорошее замечание. Однако…' },
    { en: 'Could you clarify what you mean by…?', ru: 'Не могли бы вы уточнить, что вы имеете в виду под…?' },
    { en: 'Our data do not support that interpretation.', ru: 'Наши данные не подтверждают такую интерпретацию.' },
  ] },
  { title: 'Научная переписка', items: [
    { en: 'Dear Professor Smith, I am writing to enquire about…', ru: 'Уважаемый профессор Смит, пишу, чтобы узнать о…' },
    { en: 'Please find attached the revised manuscript.', ru: 'Во вложении — исправленная рукопись.' },
    { en: 'We thank the reviewers for their helpful comments.', ru: 'Благодарим рецензентов за полезные замечания.' },
    { en: 'I look forward to hearing from you. Kind regards, …', ru: 'Жду вашего ответа. С уважением, …' },
  ] },
  { title: 'Структура тезисов (IMRaD)', items: [
    { en: 'Introduction / Background — why the study was needed', ru: 'Введение — актуальность и пробел в знаниях' },
    { en: 'Methods — design, participants, measurements', ru: 'Методы — дизайн, участники, измерения' },
    { en: 'Results — main numbers with CI and p-values', ru: 'Результаты — ключевые цифры с ДИ и p' },
    { en: 'Discussion / Conclusions — careful interpretation, limitations', ru: 'Обсуждение — осторожная интерпретация, ограничения' },
  ] },
];

export const MED_EXERCISES: Exercise[] = [
  mcq('med-1', 'en.vocab-medical', '“Debridement” means…', ['removal of dead or infected tissue', 'a type of bandage', 'measuring blood flow'], 0, 'Debridement — хирургическая обработка (удаление нежизнеспособных тканей).'),
  mcq('med-2', 'en.vocab-medical', 'A study that follows a group of people over time is a…', ['cross-sectional study', 'cohort study', 'case report'], 1, 'Cohort study — когортное исследование: наблюдение за группой во времени.'),
  mcq('med-3', 'en.vocab-medical', '“95% CI 0.21–0.83” refers to…', ['the confidence interval', 'the sample size', 'the p-value'], 0, 'CI — confidence interval, доверительный интервал.'),
  gap('med-4', 'en.vocab-medical', 'Reduced mitochondrial function was independently ______ with poor healing. (связана)', ['associated'], 'be associated with — быть связанным с (без утверждения причинности).'),
  mcq('med-5', 'en.vocab-medical', 'Which sentence is most appropriate for a Conclusions section?', ['Mitochondria cause ulcers.', 'Our results prove that mitochondria cause poor healing.', 'Our findings suggest an association between mitochondrial function and healing.'], 2, 'В выводах наблюдательного исследования говорят об ассоциации, а не о доказанной причинности.'),
  gap('med-6', 'en.vocab-medical', 'The primary ______ was complete healing at 12 weeks. (конечная точка)', ['outcome', 'endpoint', 'end point'], 'Primary outcome / primary endpoint — первичная конечная точка.'),
  mcq('med-7', 'en.vocab-medical', '“Inflammageing” describes…', ['acute infection', 'chronic low-grade inflammation associated with ageing', 'wound healing in young people'], 1, 'Inflammageing = inflammation + ageing.'),
];
