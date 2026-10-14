// Банк заданий для адаптивной диагностики. Все задания оригинальные.
import type { DiagItem } from './types';

type L = DiagItem['level'];
const d = (
  lang: DiagItem['lang'],
  skill: DiagItem['skill'],
  level: L,
  id: string,
  topic: string,
  prompt: string,
  options: string[],
  answer: number,
  explain: string,
  extra?: { passage?: string; say?: string },
): DiagItem => ({ id: `${lang}-d-${id}`, lang, skill, level, topic, prompt, options, answer, explain, ...extra });

// ─── АНГЛИЙСКИЙ ─────────────────────────────────────────────────────────────
const EN_R_A1 = 'Tom is a nurse. He works at a small hospital in Leeds. He starts work at 7 a.m. He likes his job because he helps people.';
const EN_R_A1b = 'PHARMACY\nOpen Monday – Friday: 8:00 – 20:00\nSaturday: 9:00 – 14:00\nClosed on Sunday';
const EN_R_A2 = 'Many people in cities now cycle to work. It is cheaper than driving, and it is good for their health. However, some people say that cycling is dangerous because there are not enough bike lanes.';
const EN_R_A2b = 'Hi Anna,\nI’m sorry, but I can’t come to the meeting on Tuesday. I have to take my son to the doctor. Can we meet on Thursday instead?\nBest wishes,\nMark';
const EN_R_B1 = 'Sleep plays an important role in health. Adults who sleep less than six hours a night are more likely to develop obesity and type 2 diabetes. Researchers believe that lack of sleep affects the hormones that control appetite. However, the relationship is complex, and more studies are needed.';
const EN_R_B2 = 'Although telemedicine was initially regarded as a temporary solution during the pandemic, it has since become an integral part of many healthcare systems. Proponents argue that it improves access for patients in remote areas, whereas critics caution that the absence of a physical examination may lead to diagnostic errors. Consequently, many experts now advocate a hybrid model that combines online and face-to-face consultations.';

export const EN_DIAG: DiagItem[] = [
  // grammar
  d('en', 'grammar', 'A1', 'g1', 'en.be', 'She ___ a nurse.', ['am', 'is', 'are'], 1, 'She → is.'),
  d('en', 'grammar', 'A1', 'g2', 'en.present-simple', 'I ___ like coffee.', ['don’t', 'doesn’t', 'not'], 0, 'I → don’t.'),
  d('en', 'grammar', 'A1', 'g3', 'en.there-is', 'There ___ two patients in the room.', ['is', 'are', 'be'], 1, 'Множественное число → there are.'),
  d('en', 'grammar', 'A2', 'g4', 'en.past-simple', 'Yesterday we ___ to the cinema.', ['go', 'went', 'gone'], 1, 'Past Simple: went.'),
  d('en', 'grammar', 'A2', 'g5', 'en.present-continuous', 'Look! The baby ___.', ['sleeps', 'is sleeping', 'sleep'], 1, 'Действие сейчас → is sleeping.'),
  d('en', 'grammar', 'A2', 'g6', 'en.comparatives', 'This hospital is ___ than the old one.', ['big', 'bigger', 'biggest'], 1, 'Сравнение → bigger than.'),
  d('en', 'grammar', 'B1', 'g7', 'en.present-perfect', 'I ___ here since 2015.', ['work', 'have worked', 'worked'], 1, 'Since 2015 до сих пор → have worked.'),
  d('en', 'grammar', 'B1', 'g8', 'en.passive', 'The samples ___ every morning.', ['collect', 'are collected', 'collected'], 1, 'Пассив: are collected.'),
  d('en', 'grammar', 'B1', 'g9', 'en.conditionals', 'If I ___ more time, I would study more.', ['have', 'had', 'will have'], 1, 'Второй тип: if + Past Simple.'),
  d('en', 'grammar', 'B2', 'g10', 'en.past-perfect', 'By the time we arrived, the operation ___.', ['finished', 'had finished', 'has finished'], 1, 'Действие до другого прошлого → Past Perfect.'),
  d('en', 'grammar', 'B2', 'g11', 'en.reported-speech', 'She asked me where ___.', ['I worked', 'did I work', 'do I work'], 0, 'В косвенном вопросе — прямой порядок слов.'),
  d('en', 'grammar', 'B2', 'g12', 'en.linking', '___ the high cost, the treatment remains popular.', ['Although', 'Despite', 'However'], 1, 'Перед существительным → Despite.'),
  // vocab
  d('en', 'vocab', 'A1', 'v1', 'en.vocab-daily', 'Where do you ___? — In Astana.', ['live', 'life', 'leave'], 0, 'Live — жить.'),
  d('en', 'vocab', 'A1', 'v2', 'en.vocab-daily', 'The opposite of “cheap” is…', ['expensive', 'old', 'small'], 0, 'Cheap — дешёвый, expensive — дорогой.'),
  d('en', 'vocab', 'A1', 'v3', 'en.vocab-work', 'A doctor usually works in a ___.', ['hospital', 'library', 'shop'], 0, 'Hospital — больница.'),
  d('en', 'vocab', 'A2', 'v4', 'en.vocab-health', 'I need to ___ an appointment with the dentist.', ['make', 'do', 'take'], 0, 'Устойчивое сочетание: make an appointment.'),
  d('en', 'vocab', 'A2', 'v5', 'en.vocab-travel', 'My flight was ___ because of fog.', ['delayed', 'late', 'slowed'], 0, 'Flight was delayed — рейс задержали.'),
  d('en', 'vocab', 'A2', 'v6', 'en.vocab-education', 'He ___ his exam and was very happy.', ['passed', 'past', 'missed'], 0, 'Pass an exam — сдать экзамен.'),
  d('en', 'vocab', 'B1', 'v7', 'en.vocab-academic', 'The study ___ that exercise reduces stress.', ['suggests', 'advises', 'proposes to'], 0, 'The study suggests that… — исследование указывает, что…'),
  d('en', 'vocab', 'B1', 'v8', 'en.vocab-health', 'Smoking is a major ___ factor for heart disease.', ['risk', 'danger', 'threat'], 0, 'Устойчивое сочетание: risk factor.'),
  d('en', 'vocab', 'B1', 'v9', 'en.vocab-society', 'The government should ___ more money in education.', ['invest', 'spend', 'pay'], 0, 'Invest money in… (spend money on…).'),
  d('en', 'vocab', 'B2', 'v10', 'en.vocab-academic', 'Choose the word closest in meaning to “harmful”.', ['detrimental', 'beneficial', 'negligible'], 0, 'Detrimental — вредный.'),
  d('en', 'vocab', 'B2', 'v11', 'en.vocab-academic', 'The instructions were ___: they could be understood in two different ways.', ['ambiguous', 'accurate', 'obvious'], 0, 'Ambiguous — двусмысленный.'),
  d('en', 'vocab', 'B2', 'v12', 'en.vocab-academic', 'Researchers must ___ their claims with reliable data.', ['substantiate', 'subscribe', 'subside'], 0, 'Substantiate — обосновать, подтвердить.'),
  // reading
  d('en', 'reading', 'A1', 'r1', 'en.reading-detail', 'Where does Tom work?', ['in a big hospital', 'in a small hospital', 'in a pharmacy'], 1, '“He works at a small hospital in Leeds.”', { passage: EN_R_A1 }),
  d('en', 'reading', 'A1', 'r2', 'en.reading-detail', 'Why does Tom like his job?', ['it is well paid', 'he helps people', 'it starts late'], 1, '“…because he helps people.”', { passage: EN_R_A1 }),
  d('en', 'reading', 'A1', 'r3', 'en.reading-detail', 'Can you buy medicine at this pharmacy on Sunday?', ['Yes', 'No', 'Only in the morning'], 1, '“Closed on Sunday.”', { passage: EN_R_A1b }),
  d('en', 'reading', 'A2', 'r4', 'en.reading-detail', 'Why do people cycle to work?', ['it is fast and fun', 'it is cheap and healthy', 'there are many bike lanes'], 1, '“cheaper than driving… good for their health”.', { passage: EN_R_A2 }),
  d('en', 'reading', 'A2', 'r5', 'en.reading-detail', 'What problem does the text mention?', ['not enough bike lanes', 'bicycles are expensive', 'the weather'], 0, '“there are not enough bike lanes”.', { passage: EN_R_A2 }),
  d('en', 'reading', 'A2', 'r6', 'en.reading-detail', 'Why can’t Mark come on Tuesday?', ['he is ill', 'he has to take his son to the doctor', 'he has another meeting'], 1, '“I have to take my son to the doctor.”', { passage: EN_R_A2b }),
  d('en', 'reading', 'B1', 'r7', 'en.reading-detail', 'According to the text, short sleep is linked to…', ['better appetite control', 'obesity and type 2 diabetes', 'heart attacks'], 1, '“more likely to develop obesity and type 2 diabetes”.', { passage: EN_R_B1 }),
  d('en', 'reading', 'B1', 'r8', 'en.reading-main', 'What does the writer say about the research?', ['it is complete', 'more studies are needed', 'it is wrong'], 1, '“…the relationship is complex, and more studies are needed.”', { passage: EN_R_B1 }),
  d('en', 'reading', 'B1', 'r9', 'en.reading-tfng', 'Statement: “Sleeping more than nine hours is harmful.” True, False or Not Given?', ['True', 'False', 'Not Given'], 2, 'Текст ничего не говорит о сне более девяти часов → Not Given.', { passage: EN_R_B1 }),
  d('en', 'reading', 'B2', 'r10', 'en.reading-main', 'What is the main idea of the paragraph?', ['Telemedicine should be banned.', 'Telemedicine has become important, but it has limitations, so a mixed approach is recommended.', 'Physical examinations are no longer necessary.'], 1, 'Текст описывает роль телемедицины, критику и вывод — гибридную модель.', { passage: EN_R_B2 }),
  d('en', 'reading', 'B2', 'r11', 'en.reading-detail', 'What are critics worried about?', ['high costs', 'diagnostic errors without physical examination', 'poor internet in cities'], 1, '“…the absence of a physical examination may lead to diagnostic errors.”', { passage: EN_R_B2 }),
  d('en', 'reading', 'B2', 'r12', 'en.reading-vocab', 'The word “integral” in the text is closest in meaning to…', ['essential', 'temporary', 'optional'], 0, 'Integral part — неотъемлемая часть.', { passage: EN_R_B2 }),
  // listening
  d('en', 'listening', 'A1', 'l1', 'en.listening-numbers', 'How old is Sara?', ['13', '30', '33'], 1, '“I am thirty years old.”', { say: 'My name is Sara. I am thirty years old.' }),
  d('en', 'listening', 'A1', 'l2', 'en.listening-numbers', 'When does the bus leave?', ['8:00', '8:30', '9:30'], 1, '“half past eight” = 8:30.', { say: 'The bus to the hospital leaves at half past eight.' }),
  d('en', 'listening', 'A1', 'l3', 'en.listening-detail', 'What does the speaker want?', ['tea', 'coffee', 'water'], 0, '“a cup of tea”.', { say: 'Can I have a cup of tea, please?' }),
  d('en', 'listening', 'A2', 'l4', 'en.listening-detail', 'When can the patient see Dr Brown?', ['today', 'tomorrow at eleven', 'tomorrow at seven'], 1, '“Can you come tomorrow at eleven?”', { say: 'I’m sorry, Doctor Brown is not available today. Can you come tomorrow at eleven?' }),
  d('en', 'listening', 'A2', 'l5', 'en.listening-numbers', 'How many tablets should the patient take per day?', ['one', 'two', 'five'], 1, '“one tablet twice a day” → две таблетки в день.', { say: 'Take one tablet twice a day, after meals, for five days.' }),
  d('en', 'listening', 'A2', 'l6', 'en.listening-detail', 'Where is the library?', ['on the first floor', 'on the second floor, next to the lecture hall', 'next to the canteen'], 1, '“on the second floor, next to the lecture hall”.', { say: 'The library is on the second floor, next to the lecture hall.' }),
  d('en', 'listening', 'B1', 'l7', 'en.listening-detail', 'What was the problem with the new drug?', ['it did not lower blood sugar', 'some patients had stomach problems', 'it was too expensive'], 1, '“about ten percent of patients reported stomach problems”.', { say: 'Although the new drug lowered blood sugar effectively, about ten percent of patients reported stomach problems, so doctors should monitor them carefully.' }),
  d('en', 'listening', 'B1', 'l8', 'en.listening-detail', 'Why was the seminar moved?', ['Room 12 is closed', 'more people registered than expected', 'the lecturer asked for it'], 1, '“because more people registered than expected”.', { say: 'The seminar has been moved from Room 12 to the main hall because more people registered than expected.' }),
  d('en', 'listening', 'B1', 'l9', 'en.listening-detail', 'What does the speaker do now?', ['works night shifts', 'mostly does day surgery', 'does not work'], 1, '“now I mostly do day surgery”.', { say: 'I used to work night shifts, but now I mostly do day surgery, which gives me more time with my family.' }),
  d('en', 'listening', 'B2', 'l10', 'en.listening-detail', 'What surprised the researchers most?', ['the overall reduction in complications', 'that the reduction was largest in patients over seventy', 'that there was no effect'], 1, 'Ключ: “not the overall reduction…, but the fact that it was largest among patients over seventy”.', { say: 'What surprised the researchers most was not the overall reduction in complications, but the fact that it was largest among patients over seventy.' }),
  d('en', 'listening', 'B2', 'l11', 'en.listening-inference', 'What does the speaker mean?', ['The funding was approved late, so fewer participants were recruited.', 'They recruited many participants.', 'The funding was rejected.'], 0, 'Had the funding been approved earlier… = финансирование одобрили поздно.', { say: 'Had the funding been approved earlier, we would have been able to recruit far more participants.' }),
  d('en', 'listening', 'B2', 'l12', 'en.listening-detail', 'According to the lecturer…', ['weight loss alone matters most', 'moderate exercise affects insulin sensitivity more than weight loss alone', 'exercise has no effect'], 1, '“…moderate exercise has a greater impact on insulin sensitivity than weight loss alone”.', { say: 'The lecturer argued that, contrary to popular belief, moderate exercise has a greater impact on insulin sensitivity than weight loss alone.' }),
];

// ─── КАЗАХСКИЙ ──────────────────────────────────────────────────────────────
const KK_R_A1 = 'Менің атым Айгүл. Мен мұғаліммін. Мен Шымкентте тұрамын. Менің екі балам бар.';
const KK_R_A1b = 'ДӘРІХАНА\nДүйсенбі – жұма: 8:00 – 20:00\nСенбі, жексенбі: жабық';
const KK_R_A2 = 'Ерлан ауруханада хирург болып жұмыс істейді. Ол күнде таңертең сағат жетіде жұмысқа барады. Демалыс күндері ол отбасымен бірге саябаққа барады.';
const KK_R_B1 = 'Қазіргі кезде көп адам денсаулығына көңіл бөледі. Олар дұрыс тамақтанады және спортпен айналысады. Дегенмен дәрігерлер жыл сайын медициналық тексеруден өтуге кеңес береді.';
const KK_R_B2 = 'Қант диабеті — бүкіл әлемде кең таралған созылмалы ауру. Сарапшылардың пікірінше, аурудың алдын алуда салауатты өмір салты шешуші рөл атқарады. Алайда тек жеке адамның жауапкершілігімен шектелу жеткіліксіз: мемлекет те профилактикалық бағдарламаларды қолдауы тиіс.';

export const KK_DIAG: DiagItem[] = [
  // grammar
  d('kk', 'grammar', 'A1', 'g1', 'kk.personal', 'Мен дәрігер___. (я врач)', ['мін', 'мын', 'сің'], 0, 'Мягкое слово, «я» → -мін.'),
  d('kk', 'grammar', 'A1', 'g2', 'kk.question-neg', 'Бұл кітап ___? (это книга?)', ['ма', 'па', 'бе'], 1, 'После глухой п → па.'),
  d('kk', 'grammar', 'A1', 'g3', 'kk.plural', 'кітап → мн. ч.', ['кітаплар', 'кітаптар', 'кітапдар'], 1, 'После глухой → -тар.'),
  d('kk', 'grammar', 'A2', 'g4', 'kk.present', 'Мен күнде жұмысқа ___.', ['барамын', 'бардым', 'бармын'], 0, 'Регулярное действие → ауыспалы осы шақ.'),
  d('kk', 'grammar', 'A2', 'g5', 'kk.past', 'Кеше мен кітап ___.', ['оқимын', 'оқыдым', 'оқиды'], 1, 'Кеше → прошедшее: оқыдым.'),
  d('kk', 'grammar', 'A2', 'g6', 'kk.possessive', 'Менің ___ ауырады. (голова — бас)', ['басым', 'басы', 'басың'], 0, 'Менің → -ым.'),
  d('kk', 'grammar', 'B1', 'g7', 'kk.conditional', 'Уақытым ___, саған көмектесемін.', ['болса', 'болды', 'болады'], 0, 'Условие «если будет» → болса.'),
  d('kk', 'grammar', 'B1', 'g8', 'kk.participle', 'Кеше ___ кітабым өте қызықты.', ['оқыған', 'оқитын', 'оқу'], 0, 'Прошедшее причастие: оқыған (прочитанная).'),
  d('kk', 'grammar', 'B1', 'g9', 'kk.modality', 'Маған дәрігерге бару ___.', ['керек', 'емес', 'жоқ'], 0, '… бару керек — нужно пойти.'),
  d('kk', 'grammar', 'B2', 'g10', 'kk.complex', 'Ауа райы жаман ___, ұшақ кешікті.', ['болғандықтан', 'болса да', 'болып'], 0, 'Причина → болғандықтан (так как).'),
  d('kk', 'grammar', 'B2', 'g11', 'kk.complex', 'Ол ауырса ___, жұмысқа келді.', ['да', 'ма', 'ғой'], 0, '-са да — уступка: «хотя и болел».'),
  d('kk', 'grammar', 'B2', 'g12', 'kk.passive', 'Бұл ғимарат 1985 жылы ___.', ['салынды', 'салды', 'салынады'], 0, 'Страдательный залог, прошлое: салынды (был построен).'),
  // vocab
  d('kk', 'vocab', 'A1', 'v1', 'kk.vocab-work', '«дәрігер» —', ['врач', 'учитель', 'студент'], 0, 'Дәрігер — врач.'),
  d('kk', 'vocab', 'A1', 'v2', 'kk.vocab-daily', '«үй» —', ['дом', 'город', 'день'], 0, 'Үй — дом.'),
  d('kk', 'vocab', 'A1', 'v3', 'kk.vocab-daily', '«су» —', ['вода', 'молоко', 'хлеб'], 0, 'Су — вода.'),
  d('kk', 'vocab', 'A2', 'v4', 'kk.vocab-health', '«дәріхана» —', ['больница', 'аптека', 'школа'], 1, 'Дәріхана — аптека (дәрі — лекарство).'),
  d('kk', 'vocab', 'A2', 'v5', 'kk.vocab-time', '«кеше» —', ['вчера', 'завтра', 'сегодня'], 0, 'Кеше — вчера; ертең — завтра; бүгін — сегодня.'),
  d('kk', 'vocab', 'A2', 'v6', 'kk.vocab-shopping', '«қымбат» —', ['дорогой', 'дешёвый', 'новый'], 0, 'Қымбат — дорогой; арзан — дешёвый.'),
  d('kk', 'vocab', 'B1', 'v7', 'kk.vocab-health', '«денсаулық» —', ['здоровье', 'болезнь', 'лечение'], 0, 'Денсаулық — здоровье.'),
  d('kk', 'vocab', 'B1', 'v8', 'kk.vocab-science', '«зерттеу» —', ['исследование', 'образование', 'преподавание'], 0, 'Зерттеу — исследование.'),
  d('kk', 'vocab', 'B1', 'v9', 'kk.vocab-society', '«мүмкіндік» —', ['возможность', 'необходимость', 'трудность'], 0, 'Мүмкіндік — возможность.'),
  d('kk', 'vocab', 'B2', 'v10', 'kk.vocab-science', '«тұжырым» —', ['вывод, заключение', 'вопрос', 'метод'], 0, 'Тұжырым — вывод, заключение.'),
  d('kk', 'vocab', 'B2', 'v11', 'kk.vocab-society', '«өзекті» —', ['актуальный', 'устаревший', 'лишний'], 0, 'Өзекті мәселе — актуальная проблема.'),
  d('kk', 'vocab', 'B2', 'v12', 'kk.vocab-society', '«салдар» —', ['последствие', 'причина', 'решение'], 0, 'Салдар — последствие; себеп — причина.'),
  // reading
  d('kk', 'reading', 'A1', 'r1', 'kk.reading-detail', 'Кем работает Айгүл?', ['врачом', 'учителем', 'медсестрой'], 1, '«Мен мұғаліммін».', { passage: KK_R_A1 }),
  d('kk', 'reading', 'A1', 'r2', 'kk.reading-detail', 'Сколько у неё детей?', ['один', 'два', 'три'], 1, '«екі балам бар».', { passage: KK_R_A1 }),
  d('kk', 'reading', 'A1', 'r3', 'kk.reading-detail', 'Работает ли аптека в субботу?', ['да', 'нет', 'только утром'], 1, '«Сенбі, жексенбі: жабық» — закрыто.', { passage: KK_R_A1b }),
  d('kk', 'reading', 'A2', 'r4', 'kk.reading-detail', 'Кем работает Ерлан?', ['хирургом', 'учителем', 'водителем'], 0, '«хирург болып жұмыс істейді».', { passage: KK_R_A2 }),
  d('kk', 'reading', 'A2', 'r5', 'kk.reading-detail', 'Что Ерлан делает в выходные?', ['работает', 'ходит с семьёй в парк', 'ездит в Алматы'], 1, '«отбасымен бірге саябаққа барады».', { passage: KK_R_A2 }),
  d('kk', 'reading', 'A2', 'r6', 'kk.reading-detail', 'Во сколько он идёт на работу?', ['в 6', 'в 7', 'в 8'], 1, '«сағат жетіде».', { passage: KK_R_A2 }),
  d('kk', 'reading', 'B1', 'r7', 'kk.reading-main', 'Главная мысль текста:', ['люди не заботятся о здоровье', 'многие заботятся о здоровье, но нужен ежегодный осмотр', 'спорт вреден'], 1, 'Текст: люди заботятся о здоровье; «дегенмен» вводит рекомендацию врачей.', { passage: KK_R_B1 }),
  d('kk', 'reading', 'B1', 'r8', 'kk.reading-detail', 'Что советуют врачи?', ['больше спать', 'ежегодно проходить медосмотр', 'меньше есть'], 1, '«жыл сайын медициналық тексеруден өтуге».', { passage: KK_R_B1 }),
  d('kk', 'reading', 'B1', 'r9', 'kk.reading-vocab', '«Дегенмен» в тексте означает…', ['тем не менее', 'поэтому', 'например'], 0, 'Дегенмен — тем не менее, однако.', { passage: KK_R_B1 }),
  d('kk', 'reading', 'B2', 'r10', 'kk.reading-detail', 'Что, по мнению экспертов, играет решающую роль в профилактике?', ['лекарства', 'здоровый образ жизни', 'государство'], 1, '«салауатты өмір салты шешуші рөл атқарады».', { passage: KK_R_B2 }),
  d('kk', 'reading', 'B2', 'r11', 'kk.reading-main', 'Позиция автора:', ['за здоровье отвечает только человек', 'государство тоже должно поддерживать программы профилактики', 'профилактика не нужна'], 1, '«мемлекет те … қолдауы тиіс».', { passage: KK_R_B2 }),
  d('kk', 'reading', 'B2', 'r12', 'kk.reading-vocab', '«созылмалы ауру» —', ['хроническое заболевание', 'острое заболевание', 'инфекционное заболевание'], 0, 'Созылмалы — хронический.', { passage: KK_R_B2 }),
  // listening
  d('kk', 'listening', 'A1', 'l1', 'kk.listening-numbers', 'Сколько лет Дане?', ['15', '25', '35'], 1, '«жиырма бес жастамын».', { say: 'Менің атым Дана. Мен жиырма бес жастамын.' }),
  d('kk', 'listening', 'A1', 'l2', 'kk.listening-numbers', 'Когда начинается урок?', ['в 7', 'в 8', 'в 9'], 1, '«Сағат сегізде».', { say: 'Сағат сегізде сабақ басталады.' }),
  d('kk', 'listening', 'A1', 'l3', 'kk.listening-detail', 'Что просит говорящий?', ['чай', 'кофе', 'воду'], 0, '«бір шыны шай».', { say: 'Маған бір шыны шай беріңізші.' }),
  d('kk', 'listening', 'A2', 'l4', 'kk.listening-detail', 'Когда нужно прийти?', ['сегодня', 'завтра в 10', 'завтра в 2'], 1, '«Ертең сағат онда келіңіз».', { say: 'Дәрігер бүгін жоқ. Ертең сағат онда келіңіз.' }),
  d('kk', 'listening', 'A2', 'l5', 'kk.listening-numbers', 'Сколько раз в день принимать лекарство?', ['1', '2', '3'], 2, '«күніне үш рет».', { say: 'Бұл дәріні күніне үш рет, тамақтан кейін ішіңіз.' }),
  d('kk', 'listening', 'A2', 'l6', 'kk.listening-detail', 'Где библиотека?', ['на первом этаже', 'на втором этаже, рядом со столовой', 'рядом с аптекой'], 1, '«екінші қабатта, асхананың жанында».', { say: 'Кітапхана екінші қабатта, асхананың жанында.' }),
  d('kk', 'listening', 'B1', 'l7', 'kk.listening-detail', 'Почему собрание пройдёт в большом зале?', ['зал удобнее', 'участников стало больше', 'малый зал на ремонте'], 1, '«қатысушылар саны көбейді».', { say: 'Ертеңгі жиналыс үлкен залда өтеді, өйткені қатысушылар саны көбейді.' }),
  d('kk', 'listening', 'B1', 'l8', 'kk.listening-detail', 'Как говорящий работает сейчас?', ['ночные дежурства', 'только днём', 'не работает'], 1, '«қазір тек күндіз жұмыс істеймін».', { say: 'Мен бұрын түнгі кезекшілікте жұмыс істейтінмін, қазір тек күндіз жұмыс істеймін.' }),
  d('kk', 'listening', 'B1', 'l9', 'kk.listening-detail', 'При каком условии они поедут в горы?', ['если будет хорошая погода', 'если будет время', 'в любом случае'], 0, '«Егер ауа райы жақсы болса».', { say: 'Егер ауа райы жақсы болса, демалыс күні тауға барамыз.' }),
  d('kk', 'listening', 'B2', 'l10', 'kk.listening-detail', 'Что оказалось неожиданным?', ['осложнений стало больше', 'сильнее всего осложнения снизились у пациентов старше 70', 'эффекта не было'], 1, '«асқынулар саны ең көп азайған топ — жетпістен асқан науқастар».', { say: 'Зерттеу нәтижелері күтпеген жерден шықты: асқынулар саны ең көп азайған топ — жетпістен асқан науқастар.' }),
  d('kk', 'listening', 'B2', 'l11', 'kk.listening-inference', 'Что имеет в виду говорящий?', ['финансирование выделили поздно, поэтому участников было меньше', 'участников было очень много', 'финансирования не было вообще'], 0, '«…уақытында бөлінгенде, … тарта алар едік» — если бы выделили вовремя, могли бы привлечь больше.', { say: 'Қаржыландыру уақытында бөлінгенде, біз әлдеқайда көп қатысушы тарта алар едік.' }),
  d('kk', 'listening', 'B2', 'l12', 'kk.listening-detail', 'По словам лектора…', ['важнее всего снижение веса', 'умеренная физическая активность влияет на чувствительность к инсулину больше, чем снижение веса', 'физическая активность не влияет'], 1, '«дене белсенділігі салмақ тастаудан гөрі … көбірек әсер етеді».', { say: 'Лектордың айтуынша, қалыпты дене белсенділігі салмақ тастаудан гөрі инсулинге сезімталдыққа көбірек әсер етеді.' }),
];

export const DIAG_WRITING_PROMPTS = {
  en: 'Write 80–120 words: introduce yourself, describe your work and explain why you want to study for a PhD.',
  kk: 'Өзіңіз туралы 50–80 сөз жазыңыз: атыңыз, жұмысыңыз, отбасыңыз және бос уақытыңыз. (Напишите о себе 50–80 слов: имя, работа, семья, свободное время.)',
};

export const DIAG_SPEAKING_PROMPTS = {
  en: 'Speak for about 1 minute: Describe your typical working day.',
  kk: 'Шамамен 1 минут сөйлеңіз: Сіздің әдеттегі жұмыс күніңіз қалай өтеді? (Расскажите о своём обычном рабочем дне.)',
};
