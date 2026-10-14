import type { Lesson } from '../types';
import { gap, listenMcq, listenType, mcq, order, tr, v } from '../builders';

const T7 = 'en.future';
export const enLesson07: Lesson = {
  id: 'en-07',
  lang: 'en',
  order: 7,
  level: 'A2',
  title: 'Будущее: will, be going to, Present Continuous',
  topic: T7,
  category: 'grammar',
  minutes: 15,
  goal: 'Выбирать форму будущего времени по смыслу: решение в момент речи, план, договорённость, прогноз.',
  outcomes: [
    'использовать will для спонтанных решений, обещаний и прогнозов-мнений',
    'использовать be going to для планов и прогнозов на основе фактов',
    'использовать Present Continuous для договорённостей с конкретным временем',
  ],
  theory: [
    { type: 'table', head: ['Форма', 'Значение', 'Пример'], rows: [
      ['will + V', 'решение сейчас, обещание, мнение о будущем', 'I’ll call you back. I think the exam will be difficult.'],
      ['am/is/are going to + V', 'план (решение уже принято), прогноз по признакам', 'I’m going to apply for a PhD. Look at the clouds — it’s going to rain.'],
      ['am/is/are + V-ing', 'договорённость, запланировано с датой/временем', 'I’m meeting my supervisor on Monday.'],
    ] },
    { type: 'p', text: 'После **when, if, before, after, as soon as** в придаточном времени будущее выражается Present Simple: When I **finish** the course, I **will take** the exam (не «when I will finish»).' },
    { type: 'tip', text: 'Для IELTS Task 1 прогнозы: “The population is expected to reach…”, “It is predicted that… will…”.' },
  ],
  simple: 'Только что решил → will. Уже решил раньше, это мой план → going to. Договорился, есть дата → am/is/are + -ing. После when / if — обычное настоящее время, даже если речь о будущем.',
  examples: [
    { t: 'I’m going to take IELTS in March.', ru: 'Я собираюсь сдавать IELTS в марте.' },
    { t: 'The phone is ringing. — I’ll answer it.', ru: 'Звонит телефон. — Я отвечу.' },
    { t: 'We’re meeting the dean at 10 tomorrow.', ru: 'Завтра в 10 у нас встреча с деканом.' },
    { t: 'When I get the results, I’ll send them to you.', ru: 'Когда получу результаты, пришлю вам.' },
  ],
  extraExamples: [
    { t: 'I think artificial intelligence will change medicine.', ru: 'Думаю, ИИ изменит медицину.' },
    { t: 'She’s pale. She’s going to faint!', ru: 'Она бледная. Она сейчас упадёт в обморок!' },
  ],
  pitfalls: [
    { wrong: 'When I will finish, I will call you.', right: 'When I finish, I will call you.', why: 'После when — Present Simple.' },
    { wrong: 'I will meet my supervisor tomorrow at 10. (договорились заранее)', right: 'I’m meeting my supervisor tomorrow at 10.', why: 'Договорённость с конкретным временем звучит естественнее в Continuous.' },
    { wrong: 'I am going to help you! (решение в момент речи)', right: 'I’ll help you!', why: 'Спонтанное решение / предложение помощи → will.' },
  ],
  warmup: [
    mcq('en07-w1', T7, '— I’m thirsty. — Wait, I ___ you some water.', ['get', '’ll get', 'am going to get'], 1, 'Решение в момент речи → will (’ll get).', ['Present Simple не выражает решение помочь прямо сейчас.', undefined, 'Going to — для решения, принятого заранее.']),
    mcq('en07-w2', T7, 'We have bought the tickets. We ___ to Istanbul in May.', ['will fly', 'are flying', 'fly'], 1, 'Билеты куплены → договорённость → are flying.'),
  ],
  practice: [
    gap('en07-p1', T7, 'If it ___ (rain), we will stay at home.', ['rains'], 'После if — Present Simple.'),
    mcq('en07-p2', T7, 'I’ve decided. I ___ apply for the PhD programme.', ['will', 'am going to', 'apply'], 1, 'Решение принято заранее → be going to.'),
    mcq('en07-p3', T7, 'Look at those clouds! It ___.', ['will rain', 'is going to rain', 'rains'], 1, 'Прогноз по видимым признакам → going to.'),
    tr('en07-p4', T7, 'Я позвоню вам завтра.', ["I will call you tomorrow", "I'll call you tomorrow", "I will phone you tomorrow", "I'll phone you tomorrow", "I'll ring you tomorrow"], 'Обещание → will.'),
    order('en07-p5', T7, ['are', 'What', 'going', 'to', 'you', 'do'], ['What are you going to do?'], 'What + are + you + going to + V.'),
    gap('en07-p6', T7, 'As soon as I ___ (get) home, I will text you.', ['get'], 'As soon as → Present Simple.'),
    mcq('en07-p7', T7, 'I ___ my supervisor on Friday at 3 p.m. It’s in my diary.', ['meet', 'am meeting', 'will meet'], 1, 'Договорённость в календаре → Present Continuous.'),
  ],
  listening: {
    title: 'Планы на год',
    text: 'Next year is going to be very busy. In March I’m taking the IELTS exam. I’m going to study English every day before that. In June I’m applying to the PhD programme. I think it will be difficult, but I’ll do my best.',
    ru: 'Следующий год будет очень загруженным. В марте я сдаю IELTS. До этого я собираюсь заниматься английским каждый день. В июне подаю документы в докторантуру. Думаю, будет трудно, но я сделаю всё возможное.',
    questions: [
      listenMcq('en07-l1', T7, '', 'Когда экзамен IELTS?', ['in March', 'in June', 'next week'], 0, '“In March I’m taking the IELTS exam.”'),
      listenMcq('en07-l2', T7, '', 'Что произойдёт в июне?', ['экзамен', 'подача в докторантуру', 'отпуск'], 1, '“In June I’m applying to the PhD programme.”'),
      listenType('en07-l3', T7, 'I will do my best.', 'Запишите предложение.', ['I will do my best', "I'll do my best"], 'Обещание → will.'),
    ],
  },
  shadow: [
    { t: 'I’m going to take IELTS in March.', ru: 'Я собираюсь сдавать IELTS в марте.' },
    { t: 'I’ll do my best.', ru: 'Я сделаю всё возможное.' },
    { t: 'When I finish, I’ll call you.', ru: 'Когда закончу, позвоню.' },
  ],
  control: [
    gap('en07-c1', T7, 'When the results ___ (come), I will tell you.', ['come'], 'После when — Present Simple.'),
    mcq('en07-c2', T7, '— The bag is heavy. — I ___ you.', ['help', '’ll help', 'am helping'], 1, 'Предложение помощи в момент речи → will.'),
    mcq('en07-c3', T7, 'She has bought a new laptop. She ___ write her thesis on it.', ['will', 'is going to', 'writes'], 1, 'План, решение уже принято → going to.'),
    tr('en07-c4', T7, 'Если у меня будет время, я прочитаю статью.', ["If I have time, I will read the article", "If I have time, I'll read the article", "If I have time I will read the article", "If I have time I'll read the article"], 'If + Present Simple, will + V.'),
  ],
  extra: [
    mcq('en07-x1', T7, 'I think the price ___ next year.', ['rises', 'will rise', 'is rising'], 1, 'Мнение о будущем (I think) → will.'),
    gap('en07-x2', T7, 'Before you ___ (leave), please sign the form.', ['leave'], 'Before → Present Simple.'),
  ],
  summary: [
    'will — решение сейчас, обещание, мнение',
    'going to — план, очевидный прогноз',
    'Present Continuous — договорённость с временем',
    'when / if / before / as soon as + Present Simple',
  ],
  vocab: [
    v('en', 'apply', 'apply (for / to)', 'подавать заявку', 'I’m going to apply for a PhD.', 'Я собираюсь поступать в докторантуру.', 'Образование', 'B1', '/əˈplaɪ/'),
    v('en', 'supervisor', 'supervisor', 'научный руководитель', 'My supervisor reads every chapter.', 'Мой научный руководитель читает каждую главу.', 'Академическая деятельность', 'B1', '/ˈsuːpəvaɪzə/'),
    v('en', 'deadline', 'deadline', 'крайний срок', 'The deadline is 1 June.', 'Крайний срок — 1 июня.', 'Работа', 'B1', '/ˈdedlaɪn/'),
  ],
};

const T8 = 'en.comparatives';
export const enLesson08: Lesson = {
  id: 'en-08',
  lang: 'en',
  order: 8,
  level: 'A2',
  title: 'Сравнительная и превосходная степени',
  topic: T8,
  category: 'grammar',
  minutes: 15,
  goal: 'Сравнивать данные и объекты — ключевой навык для IELTS Writing Task 1.',
  outcomes: [
    'образовывать -er / more и -est / the most',
    'использовать than, as … as, much / slightly + сравнительная степень',
    'описывать данные графиков: the highest, twice as high as',
  ],
  theory: [
    { type: 'table', head: ['Прилагательное', 'Сравнительная', 'Превосходная'], rows: [
      ['short (1 слог): high', 'higher', 'the highest'],
      ['на -y: easy', 'easier', 'the easiest'],
      ['2+ слога: expensive', 'more expensive', 'the most expensive'],
      ['good / bad', 'better / worse', 'the best / the worst'],
      ['many, much / little', 'more / less', 'the most / the least'],
    ] },
    { type: 'formula', text: 'X is higher than Y · X is as high as Y · X is twice as high as Y', note: 'Усилители: much / far / significantly higher; slightly / a little higher.' },
    { type: 'p', text: 'Нельзя сочетать оба способа: **more better**, **more higher** — ошибка.' },
    { type: 'tip', text: 'IELTS Task 1: “The figure for Japan was significantly higher than that for Canada.” — that for вместо повторения слова figure.' },
  ],
  simple: 'Короткие слова: -er и the -est (high – higher – the highest). Длинные: more и the most. После сравнения — than. Нельзя говорить «more better».',
  examples: [
    { t: 'Type 2 diabetes is more common than type 1.', ru: 'Диабет 2 типа встречается чаще, чем 1 типа.' },
    { t: 'This is the best treatment option.', ru: 'Это лучший вариант лечения.' },
    { t: 'The rate in 2020 was twice as high as in 2000.', ru: 'Показатель в 2020 году был вдвое выше, чем в 2000.' },
    { t: 'Women spent slightly more time on exercise than men.', ru: 'Женщины тратили на физические упражнения чуть больше времени, чем мужчины.' },
  ],
  extraExamples: [
    { t: 'Cycling is not as popular as walking.', ru: 'Велосипед не так популярен, как ходьба.' },
    { t: 'Spain had the lowest figure.', ru: 'У Испании был самый низкий показатель.' },
  ],
  pitfalls: [
    { wrong: 'more better', right: 'better', why: 'Better уже сравнительная степень.' },
    { wrong: 'He is taller then me.', right: 'He is taller than me.', why: 'Than (чем) ≠ then (затем).' },
    { wrong: 'the most cheap', right: 'the cheapest', why: 'Односложное прилагательное → -est.' },
    { wrong: 'Japan had higher figure.', right: 'Japan had a higher figure. / Japan had the highest figure.', why: 'Исчисляемое существительное в ед. ч. требует артикля.' },
  ],
  warmup: [
    mcq('en08-w1', T8, 'Astana is ___ than Almaty in winter.', ['cold', 'colder', 'more cold'], 1, 'Односложное → colder.'),
    mcq('en08-w2', T8, 'This is the ___ hospital in the region.', ['larger', 'most large', 'largest'], 2, 'Превосходная: the largest.'),
  ],
  practice: [
    gap('en08-p1', T8, 'This method is ___ (effective) than the old one.', ['more effective'], 'Многосложное → more effective.'),
    gap('en08-p2', T8, 'Her English is ___ (good) than mine.', ['better'], 'good → better.'),
    mcq('en08-p3', T8, 'In 2010, the number of patients was ___ in 2000.', ['twice as high as', 'twice higher than', 'two times high as'], 0, 'Конструкция: twice as … as.'),
    mcq('en08-p4', T8, 'Выберите правильный вариант.', ['It is more easier.', 'It is much easier.', 'It is more easy.'], 1, 'Усилитель much + сравнительная степень.'),
    tr('en08-p5', T8, 'Это самая важная глава.', ['This is the most important chapter', 'It is the most important chapter'], 'Многосложное → the most important.'),
    order('en08-p6', T8, ['as', 'is', 'not', 'Tea', 'popular', 'as', 'coffee'], ['Tea is not as popular as coffee'], 'not as … as — «не такой … как».'),
    gap('en08-p7', T8, 'Germany had the ___ (low) unemployment rate.', ['lowest'], 'low → the lowest.'),
  ],
  listening: {
    title: 'Описание графика',
    text: 'The chart shows the number of people with diabetes in three countries. China had the highest number, about one hundred and forty million. India had the second highest figure. The number in the United States was much lower than in China.',
    ru: 'На графике показано число людей с диабетом в трёх странах. Самое высокое значение было у Китая — около 140 миллионов. Второй по величине показатель — у Индии. Число в США было намного ниже, чем в Китае.',
    questions: [
      listenMcq('en08-l1', T8, '', 'У какой страны самый высокий показатель?', ['India', 'China', 'the USA'], 1, '“China had the highest number.”'),
      listenMcq('en08-l2', T8, '', 'Каков показатель США по сравнению с Китаем?', ['much lower', 'slightly higher', 'the same'], 0, '“much lower than in China”.'),
    ],
  },
  shadow: [
    { t: 'China had the highest number.', ru: 'У Китая самое высокое значение.' },
    { t: 'It was much lower than in China.', ru: 'Он был намного ниже, чем в Китае.' },
  ],
  control: [
    gap('en08-c1', T8, 'The exam was ___ (difficult) than I expected.', ['more difficult'], 'more difficult.'),
    mcq('en08-c2', T8, 'This is the ___ result we have ever had.', ['worse', 'worst', 'baddest'], 1, 'bad → the worst.'),
    mcq('en08-c3', T8, 'He works ___ than his colleagues.', ['harder', 'more hard', 'hardest'], 0, 'hard → harder.'),
    tr('en08-c4', T8, 'Мужчины курят больше, чем женщины.', ['Men smoke more than women', 'Men smoke more than women do'], 'more than.'),
  ],
  extra: [
    gap('en08-x1', T8, 'Running burns ___ (many) calories than walking.', ['more'], 'many → more.'),
    mcq('en08-x2', T8, 'The figure for 2020 was slightly ___ than that for 2019.', ['high', 'higher', 'highest'], 1, 'Сравнение двух значений → higher.'),
  ],
  summary: [
    '-er / the -est для коротких; more / the most для длинных',
    'than после сравнительной степени; as … as для равенства',
    'Нельзя: more better, more higher',
    'Для графиков: much / slightly higher, twice as high as, the highest',
  ],
  vocab: [
    v('en', 'figure', 'figure', 'показатель, цифра', 'The figure for Japan was higher.', 'Показатель Японии был выше.', 'Академическая деятельность', 'B1', '/ˈfɪɡə/'),
    v('en', 'slightly', 'slightly', 'немного', 'The rate fell slightly in 2015.', 'В 2015 году показатель немного снизился.', 'Академическая деятельность', 'B1', '/ˈslaɪtli/'),
    v('en', 'common', 'common', 'распространённый', 'Back pain is very common.', 'Боль в спине очень распространена.', 'Здоровье', 'A2', '/ˈkɒmən/'),
  ],
};

const T9 = 'en.modals';
export const enLesson09: Lesson = {
  id: 'en-09',
  lang: 'en',
  order: 9,
  level: 'B1',
  title: 'Модальные глаголы: can, must, have to, should, may, might',
  topic: T9,
  category: 'grammar',
  minutes: 15,
  goal: 'Выражать возможность, обязанность, совет и вероятность — часто нужно в IELTS Speaking и Writing Task 2.',
  outcomes: [
    'использовать модальный глагол + глагол без to',
    'различать must / have to / mustn’t / don’t have to',
    'давать рекомендации (should) и выражать вероятность (may, might, could)',
  ],
  theory: [
    { type: 'formula', text: 'модальный глагол + глагол в начальной форме (без to)', note: 'You should rest. (не «should to rest», не «should rests»)' },
    { type: 'table', head: ['Глагол', 'Значение', 'Пример'], rows: [
      ['can / can’t', 'умение, возможность, разрешение', 'I can read medical articles.'],
      ['must', 'сильная необходимость (мнение говорящего), правило', 'You must wash your hands.'],
      ['have to', 'обязанность из-за внешних обстоятельств', 'I have to work on Saturday.'],
      ['mustn’t', 'запрещено', 'You mustn’t smoke here.'],
      ['don’t have to', 'не обязательно', 'You don’t have to come early.'],
      ['should', 'совет, рекомендация', 'Governments should invest in prevention.'],
      ['may / might / could', 'вероятность', 'This might be a side effect.'],
    ] },
    { type: 'tip', text: 'Ловушка: mustn’t ≠ don’t have to. «Нельзя» — mustn’t; «не нужно» — don’t have to.' },
  ],
  simple: 'После can, must, should, may, might глагол идёт «голый» — без to и без -s. Must not = нельзя; don’t have to = можно не делать. Should — совет.',
  examples: [
    { t: 'Patients with diabetes should check their feet every day.', ru: 'Пациентам с диабетом следует ежедневно осматривать стопы.' },
    { t: 'You don’t have to bring your passport.', ru: 'Паспорт приносить не обязательно.' },
    { t: 'You mustn’t use your phone during the exam.', ru: 'Во время экзамена пользоваться телефоном нельзя.' },
    { t: 'The symptoms may be caused by stress.', ru: 'Симптомы могут быть вызваны стрессом.' },
  ],
  extraExamples: [
    { t: 'Could you repeat the question, please?', ru: 'Не могли бы вы повторить вопрос?' },
    { t: 'I had to wait for two hours.', ru: 'Мне пришлось ждать два часа.' },
  ],
  pitfalls: [
    { wrong: 'You should to see a doctor.', right: 'You should see a doctor.', why: 'После should — без to.' },
    { wrong: 'She cans speak English.', right: 'She can speak English.', why: 'Модальные глаголы не изменяются по лицам.' },
    { wrong: 'You mustn’t come tomorrow. (= не обязательно)', right: 'You don’t have to come tomorrow.', why: 'Mustn’t = запрещено.' },
    { wrong: 'I must to go.', right: 'I must go. / I have to go.', why: 'После must — без to.' },
  ],
  warmup: [
    mcq('en09-w1', T9, 'You ___ smoke in the hospital. It’s forbidden.', ['mustn’t', 'don’t have to', 'shouldn’t to'], 0, 'Запрет → mustn’t.'),
    mcq('en09-w2', T9, 'She ___ speak three languages.', ['can', 'cans', 'can to'], 0, 'Can не меняется и не требует to.'),
  ],
  practice: [
    mcq('en09-p1', T9, 'It’s Sunday. You ___ get up early.', ['mustn’t', 'don’t have to', 'can’t'], 1, 'Не обязательно → don’t have to.'),
    gap('en09-p2', T9, 'You look tired. You ___ take a break. (совет)', ['should'], 'Совет → should.'),
    mcq('en09-p3', T9, 'Выберите правильный вариант.', ['He should to rest.', 'He should rest.', 'He should rests.'], 1, 'Should + V без to и без -s.'),
    tr('en09-p4', T9, 'Мне пришлось перенести операцию.', ['I had to postpone the operation', 'I had to reschedule the operation', 'I had to put off the operation'], 'Прошедшее от have to → had to.'),
    gap('en09-p5', T9, 'The results ___ be wrong, so let’s check them again. (вероятность, 5 букв)', ['might', 'could'], 'Вероятность → might / could.'),
    order('en09-p6', T9, ['you', 'Could', 'that', 'repeat', 'please'], ['Could you repeat that please', 'Could you repeat that, please'], 'Вежливая просьба: Could you + V…?'),
  ],
  listening: {
    title: 'Инструкция для пациента',
    text: 'Before the operation, you mustn’t eat or drink after midnight. You have to arrive at the hospital at seven a.m. You don’t have to bring any documents, because we already have them. After the operation, you should rest for two days.',
    ru: 'Перед операцией нельзя есть и пить после полуночи. Нужно прибыть в больницу в 7 утра. Документы приносить не обязательно — они у нас уже есть. После операции следует отдыхать два дня.',
    questions: [
      listenMcq('en09-l1', T9, '', 'Что запрещено?', ['приходить рано', 'есть и пить после полуночи', 'приносить документы'], 1, '“You mustn’t eat or drink after midnight.”'),
      listenMcq('en09-l2', T9, '', 'Нужно ли приносить документы?', ['да, обязательно', 'нет, не обязательно', 'нельзя'], 1, '“You don’t have to bring any documents.”'),
      listenType('en09-l3', T9, 'You should rest for two days.', 'Запишите предложение.', ['You should rest for two days'], 'Should + rest.'),
    ],
  },
  shadow: [
    { t: 'You should see a doctor.', ru: 'Вам следует обратиться к врачу.' },
    { t: 'Could you repeat the question, please?', ru: 'Не могли бы вы повторить вопрос?' },
  ],
  control: [
    mcq('en09-c1', T9, 'Students ___ use dictionaries in the exam. It’s against the rules.', ['don’t have to', 'mustn’t', 'might'], 1, 'Против правил → mustn’t.'),
    gap('en09-c2', T9, 'I ___ to work late yesterday. (пришлось)', ['had'], 'had to.'),
    mcq('en09-c3', T9, 'Governments ___ invest more in prevention. (рекомендация)', ['should', 'can to', 'musts'], 0, 'Рекомендация → should.'),
    tr('en09-c4', T9, 'Вам не нужно ждать.', ["You don't have to wait", 'You do not have to wait', "You don't need to wait", 'You do not need to wait', "You needn't wait"], 'Не обязательно → don’t have to / don’t need to.'),
  ],
  extra: [
    mcq('en09-x1', T9, 'It ___ rain later, so take an umbrella.', ['might', 'must to', 'has'], 0, 'Вероятность → might.'),
    gap('en09-x2', T9, 'She ___ swim when she was five. (умела)', ['could'], 'Прошедшее умение → could.'),
  ],
  summary: [
    'Модальный глагол + V без to и без -s',
    'mustn’t — нельзя; don’t have to — не обязательно',
    'should — совет; may / might / could — вероятность',
  ],
  vocab: [
    v('en', 'postpone', 'postpone', 'откладывать, переносить', 'We had to postpone the surgery.', 'Нам пришлось перенести операцию.', 'Работа', 'B1', '/pəˈspəʊn/'),
    v('en', 'prevention', 'prevention', 'профилактика', 'Prevention is better than cure.', 'Профилактика лучше лечения.', 'Здоровье', 'B1', '/prɪˈvenʃn/'),
    v('en', 'side-effect', 'side effect', 'побочный эффект', 'Nausea is a common side effect.', 'Тошнота — частый побочный эффект.', 'Медицина', 'B1', '/ˈsaɪd ɪˌfekt/'),
  ],
};

const T10 = 'en.passive';
export const enLesson10: Lesson = {
  id: 'en-10',
  lang: 'en',
  order: 10,
  level: 'B1',
  title: 'Пассивный залог (Passive Voice)',
  topic: T10,
  category: 'grammar',
  minutes: 20,
  goal: 'Использовать пассив для описания процессов и научных методов — обязательный навык для IELTS Task 1 (process) и научных текстов.',
  outcomes: [
    'строить be + V3 в Present, Past и с модальными глаголами',
    'превращать активную конструкцию в пассивную',
    'описывать процесс: First, … is collected. Then it is …',
  ],
  theory: [
    { type: 'formula', text: 'be (в нужном времени) + 3-я форма глагола (V3)', note: 'Samples are collected. The study was conducted in 2020. The data will be analysed.' },
    { type: 'table', head: ['Время', 'Пример'], rows: [
      ['Present Simple', 'Blood samples are taken every morning.'],
      ['Past Simple', 'The patients were divided into two groups.'],
      ['Present Perfect', 'The protocol has been approved.'],
      ['Модальный', 'The results must be checked.'],
    ] },
    { type: 'p', text: 'Пассив используют, когда **важно действие, а не исполнитель** (в научных текстах — почти всегда). Исполнителя добавляют через **by**, только если он важен.' },
    { type: 'tip', text: 'Process diagram в IELTS: “First, the raw materials are delivered to the factory. Next, they are cleaned and…”' },
  ],
  simple: 'Пассив — «с объектом что-то делают». Берём be в нужном времени + третью форму глагола: is made, was done, will be checked. Кто сделал — часто не важно.',
  examples: [
    { t: 'Insulin is produced by the pancreas.', ru: 'Инсулин вырабатывается поджелудочной железой.' },
    { t: 'The patients were randomly assigned to two groups.', ru: 'Пациенты были случайным образом распределены на две группы.' },
    { t: 'The study has been published in a leading journal.', ru: 'Исследование опубликовано в ведущем журнале.' },
    { t: 'The wound should be cleaned daily.', ru: 'Рану следует обрабатывать ежедневно.' },
  ],
  extraExamples: [
    { t: 'English is spoken in many countries.', ru: 'На английском говорят во многих странах.' },
    { t: 'The hospital was built in 1985.', ru: 'Больница была построена в 1985 году.' },
  ],
  pitfalls: [
    { wrong: 'The data was analyse.', right: 'The data was analysed.', why: 'После be нужна 3-я форма (analysed).' },
    { wrong: 'The study conducted in 2020.', right: 'The study was conducted in 2020.', why: 'Пропущен be: исследование «было проведено».' },
    { wrong: 'The results are depend on age.', right: 'The results depend on age.', why: 'Depend — непереходный активный глагол, пассив невозможен.' },
  ],
  warmup: [
    mcq('en10-w1', T10, 'Insulin ___ by the pancreas.', ['produces', 'is produced', 'is produce'], 1, 'Пассив: is + V3.'),
    mcq('en10-w2', T10, 'The hospital ___ in 1985.', ['was built', 'built', 'is built'], 0, 'Прошлое, пассив: was built.'),
  ],
  practice: [
    gap('en10-p1', T10, 'The samples ___ (store) at −80 °C. (сейчас, регулярно)', ['are stored'], 'Present Simple Passive: are stored.'),
    gap('en10-p2', T10, 'The patients ___ (divide) into two groups. (в прошлом)', ['were divided'], 'Past Simple Passive: were divided.'),
    gap('en10-p3', T10, 'The protocol has ___ (approve) by the ethics committee.', ['been approved'], 'Present Perfect Passive: has been approved.'),
    mcq('en10-p4', T10, 'The results must ___ carefully.', ['check', 'be checked', 'checked'], 1, 'Модальный + be + V3.'),
    tr('en10-p5', T10, 'Исследование было проведено в Астане.', ['The study was conducted in Astana', 'The study was carried out in Astana', 'The research was conducted in Astana', 'The research was carried out in Astana'], 'was + conducted / carried out.'),
    order('en10-p6', T10, ['is', 'English', 'spoken', 'here'], ['English is spoken here'], 'is + spoken.'),
    mcq('en10-p7', T10, 'Активное: “Researchers analysed the data.” Пассив:', ['The data analysed researchers.', 'The data were analysed by researchers.', 'The data was analyse.'], 1, 'Объект становится подлежащим + be + V3 (+ by).'),
  ],
  listening: {
    title: 'Как проводилось исследование',
    text: 'The study was conducted at two hospitals. One hundred patients were recruited. They were divided into two groups. Blood samples were taken every month. The data were analysed using statistical software. The results will be published next year.',
    ru: 'Исследование проводилось в двух больницах. Было набрано сто пациентов. Их разделили на две группы. Образцы крови брали каждый месяц. Данные анализировали с помощью статистической программы. Результаты будут опубликованы в следующем году.',
    questions: [
      listenMcq('en10-l1', T10, '', 'Сколько пациентов набрали?', ['50', '100', '200'], 1, '“One hundred patients were recruited.”'),
      listenMcq('en10-l2', T10, '', 'Как часто брали кровь?', ['every week', 'every month', 'once'], 1, '“every month”.'),
      listenType('en10-l3', T10, 'The results will be published next year.', 'Запишите предложение.', ['The results will be published next year'], 'will be + V3.'),
    ],
  },
  shadow: [
    { t: 'The study was conducted at two hospitals.', ru: 'Исследование проводилось в двух больницах.' },
    { t: 'The data were analysed.', ru: 'Данные были проанализированы.' },
  ],
  control: [
    gap('en10-c1', T10, 'Penicillin ___ (discover) in 1928.', ['was discovered'], 'Past Passive.'),
    mcq('en10-c2', T10, 'New guidelines ___ next month.', ['will publish', 'will be published', 'are publish'], 1, 'Future Passive: will be + V3.'),
    gap('en10-c3', T10, 'Many languages ___ (speak) in Kazakhstan.', ['are spoken'], 'are spoken.'),
    tr('en10-c4', T10, 'Пациенты были обследованы.', ['The patients were examined', 'Patients were examined'], 'were + examined.'),
  ],
  extra: [
    mcq('en10-x1', T10, 'The wound should ___ every day.', ['clean', 'be cleaned', 'cleaned'], 1, 'should be + V3.'),
    gap('en10-x2', T10, 'First, the raw materials ___ (deliver) to the factory.', ['are delivered'], 'Описание процесса — Present Passive.'),
  ],
  summary: [
    'be + V3 в нужном времени',
    'Научный стиль и процессы — пассив',
    'Модальный + be + V3: must be checked',
  ],
  vocab: [
    v('en', 'recruit', 'recruit', 'набирать (участников)', 'We recruited 100 patients.', 'Мы набрали 100 пациентов.', 'Наука', 'B2', '/rɪˈkruːt/'),
    v('en', 'sample', 'sample', 'образец, выборка', 'Blood samples were taken.', 'Были взяты образцы крови.', 'Наука', 'B1', '/ˈsɑːmpl/'),
    v('en', 'approve', 'approve', 'одобрять, утверждать', 'The protocol was approved by the ethics committee.', 'Протокол одобрен этическим комитетом.', 'Наука', 'B1', '/əˈpruːv/'),
  ],
};

const T11 = 'en.linking';
export const enLesson11: Lesson = {
  id: 'en-11',
  lang: 'en',
  order: 11,
  level: 'B1',
  title: 'Связующие слова для IELTS Writing',
  topic: T11,
  category: 'grammar',
  minutes: 20,
  goal: 'Правильно соединять идеи — критерий Coherence and Cohesion составляет 25 % оценки Writing.',
  outcomes: [
    'выражать противопоставление: however, although, while, despite',
    'выражать причину и следствие: because, because of, therefore, as a result',
    'добавлять и приводить примеры: moreover, in addition, for example, such as',
  ],
  theory: [
    { type: 'table', head: ['Функция', 'Связка', 'Пунктуация / грамматика'], rows: [
      ['Противопоставление', 'However, …', 'В начале предложения + запятая'],
      ['', 'although / though + предложение', 'Although it was expensive, …'],
      ['', 'despite / in spite of + существительное / -ing', 'Despite the cost, … / Despite being expensive, …'],
      ['Причина', 'because + предложение', 'because the cost is high'],
      ['', 'because of / due to + существительное', 'because of the high cost'],
      ['Следствие', 'Therefore, / As a result, / Consequently,', 'Новое предложение + запятая'],
      ['Добавление', 'Moreover, / In addition, / Furthermore,', 'Новое предложение + запятая'],
      ['Пример', 'for example, / such as + сущ.', 'such as diabetes and obesity'],
    ] },
    { type: 'p', text: 'Главная ошибка — **despite + предложение** («Despite it was expensive») и **although + but** в одном предложении («Although…, but…»).' },
    { type: 'tip', text: 'Не перегружайте текст связками: экзаменаторы снижают балл за механическое использование (“Firstly… Secondly… Moreover… Furthermore…” в каждом предложении).' },
  ],
  simple: 'However и Therefore — в начале нового предложения с запятой. Although / because — перед целым предложением (с глаголом). Despite / because of — перед существительным. В одном предложении не ставьте одновременно although и but.',
  examples: [
    { t: 'Although the treatment is expensive, it is very effective.', ru: 'Хотя лечение дорогое, оно очень эффективно.' },
    { t: 'Despite the high cost, many patients choose this treatment.', ru: 'Несмотря на высокую стоимость, многие пациенты выбирают это лечение.' },
    { t: 'Obesity is increasing. As a result, more people develop diabetes.', ru: 'Ожирение растёт. В результате больше людей заболевают диабетом.' },
    { t: 'Chronic diseases, such as diabetes, require long-term care.', ru: 'Хронические заболевания, например диабет, требуют длительного лечения.' },
  ],
  extraExamples: [
    { t: 'Some people prefer to study alone, while others learn better in groups.', ru: 'Одни предпочитают учиться в одиночку, а другие лучше учатся в группе.' },
    { t: 'Due to the pandemic, the conference was cancelled.', ru: 'Из-за пандемии конференцию отменили.' },
  ],
  pitfalls: [
    { wrong: 'Although it was late, but we continued.', right: 'Although it was late, we continued.', why: 'Although и but не используются вместе.' },
    { wrong: 'Despite it was raining, we went out.', right: 'Despite the rain, we went out. / Although it was raining, we went out.', why: 'Despite + существительное, although + предложение.' },
    { wrong: 'Because of the cost is high…', right: 'Because the cost is high… / Because of the high cost…', why: 'Because of + существительное.' },
    { wrong: 'However the results were positive.', right: 'However, the results were positive.', why: 'После вводного However — запятая.' },
  ],
  warmup: [
    mcq('en11-w1', T11, '___ the rain, the conference started on time.', ['Although', 'Despite', 'However'], 1, 'Перед существительным (the rain) → Despite.'),
    mcq('en11-w2', T11, 'The drug is effective. ___, it has side effects.', ['However', 'Although', 'Because'], 0, 'Новое предложение, противопоставление → However,'),
  ],
  practice: [
    mcq('en11-p1', T11, '___ he was tired, he finished the report.', ['Despite', 'Although', 'Because of'], 1, 'Перед предложением (he was tired) → Although.'),
    mcq('en11-p2', T11, 'The flight was cancelled ___ bad weather.', ['because', 'because of', 'although'], 1, 'Перед существительным → because of.'),
    mcq('en11-p3', T11, 'Smoking damages blood vessels. ___, smokers have a higher risk of amputation.', ['However', 'Therefore', 'Although'], 1, 'Следствие → Therefore.'),
    mcq('en11-p4', T11, 'Найдите правильное предложение.', ['Although it is cheap, but it is good.', 'Although it is cheap, it is good.', 'Despite it is cheap, it is good.'], 1, 'Although без but.'),
    tr('en11-p5', T11, 'Несмотря на высокую стоимость, лечение популярно.', ['Despite the high cost, the treatment is popular', 'In spite of the high cost, the treatment is popular', 'Despite the high cost the treatment is popular'], 'Despite + существительное.'),
    gap('en11-p6', T11, 'Chronic diseases, ___ as diabetes, are expensive to treat.', ['such'], 'such as + пример.'),
    mcq('en11-p7', T11, 'Some students learn quickly, ___ others need more time.', ['while', 'despite', 'therefore'], 0, 'Контраст двух групп в одном предложении → while.'),
  ],
  listening: {
    title: 'Фрагмент эссе',
    text: 'Many people believe that technology improves healthcare. For example, doctors can monitor patients remotely. However, some older patients find new devices difficult to use. Therefore, training is essential.',
    ru: 'Многие считают, что технологии улучшают здравоохранение. Например, врачи могут наблюдать пациентов удалённо. Однако некоторым пожилым пациентам трудно пользоваться новыми устройствами. Поэтому обучение необходимо.',
    questions: [
      listenMcq('en11-l1', T11, '', 'Какая связка вводит противопоставление?', ['For example', 'However', 'Therefore'], 1, 'However — противопоставление.'),
      listenMcq('en11-l2', T11, '', 'Какой вывод делает автор?', ['технологии не нужны', 'обучение необходимо', 'пожилым запрещено'], 1, '“Therefore, training is essential.”'),
    ],
  },
  shadow: [
    { t: 'However, there are some disadvantages.', ru: 'Однако есть и недостатки.' },
    { t: 'Although it is expensive, it is effective.', ru: 'Хотя это дорого, это эффективно.' },
  ],
  control: [
    mcq('en11-c1', T11, '___ being a doctor, he smokes.', ['Although', 'Despite', 'However'], 1, 'Despite + -ing.'),
    mcq('en11-c2', T11, 'Prices rose. ___, sales fell.', ['As a result', 'Although', 'Despite'], 0, 'Следствие → As a result,'),
    mcq('en11-c3', T11, 'He didn’t come ___ he was ill.', ['because', 'because of', 'despite'], 0, 'Перед предложением → because.'),
    tr('en11-c4', T11, 'Хотя тест был трудным, я его сдал.', ['Although the test was difficult, I passed it', 'Although the test was hard, I passed it', 'Although the exam was difficult, I passed it', 'Though the test was difficult, I passed it'], 'Although + предложение, без but.'),
  ],
  extra: [
    mcq('en11-x1', T11, 'The project was delayed ___ a lack of funding.', ['due to', 'although', 'therefore'], 0, 'due to + существительное.'),
    mcq('en11-x2', T11, 'Exercise reduces blood sugar. ___, it improves mood.', ['In addition', 'However', 'Despite'], 0, 'Добавление → In addition,'),
  ],
  summary: [
    'However, / Therefore, / Moreover, — новое предложение + запятая',
    'although / because + предложение; despite / because of / due to + существительное',
    'Нельзя: Although…, but…',
  ],
  vocab: [
    v('en', 'however', 'however', 'однако', 'However, the sample was small.', 'Однако выборка была небольшой.', 'Академическая деятельность', 'B1', '/haʊˈevə/'),
    v('en', 'despite', 'despite', 'несмотря на', 'Despite the cost, it is popular.', 'Несмотря на стоимость, это популярно.', 'Академическая деятельность', 'B1', '/dɪˈspaɪt/'),
    v('en', 'essential', 'essential', 'необходимый', 'Training is essential.', 'Обучение необходимо.', 'Академическая деятельность', 'B1', '/ɪˈsenʃl/'),
    v('en', 'consequently', 'consequently', 'следовательно', 'Consequently, costs increased.', 'Следовательно, расходы выросли.', 'Академическая деятельность', 'B2', '/ˈkɒnsɪkwəntli/'),
  ],
};

const T12 = 'en.conditionals';
export const enLesson12: Lesson = {
  id: 'en-12',
  lang: 'en',
  order: 12,
  level: 'B1',
  title: 'Условные предложения: 0, 1, 2 тип',
  topic: T12,
  category: 'grammar',
  minutes: 20,
  goal: 'Выражать реальные и гипотетические условия — нужно в IELTS Speaking Part 3 и Writing Task 2.',
  outcomes: [
    'строить нулевой (факт), первый (реальное будущее) и второй (гипотетический) тип',
    'не использовать will после if',
    'использовать were во втором типе: If I were…',
  ],
  theory: [
    { type: 'table', head: ['Тип', 'If-часть', 'Главная часть', 'Пример'], rows: [
      ['0 — всегда верно', 'Present Simple', 'Present Simple', 'If you heat ice, it melts.'],
      ['1 — реально в будущем', 'Present Simple', 'will + V', 'If I pass IELTS, I will apply for the PhD.'],
      ['2 — нереально / маловероятно', 'Past Simple', 'would + V', 'If I had more time, I would study every day.'],
    ] },
    { type: 'p', text: 'Во втором типе с be часто используют **were** для всех лиц: If I were you, I would… (стандарт для экзамена).' },
    { type: 'tip', text: 'Части можно менять местами; запятая ставится, только если if-часть стоит первой.' },
  ],
  simple: 'После if никогда не ставьте will. Реальное будущее: If + настоящее, will. Мечты и гипотезы: If + прошедшее, would. «На вашем месте» — If I were you, I would…',
  examples: [
    { t: 'If blood sugar is high, the patient feels thirsty.', ru: 'Если сахар крови высокий, пациент чувствует жажду.' },
    { t: 'If you practise every day, you will improve quickly.', ru: 'Если будете заниматься каждый день, быстро улучшите результат.' },
    { t: 'If I lived in London, I would speak English every day.', ru: 'Если бы я жил в Лондоне, я бы говорил по-английски каждый день.' },
    { t: 'If I were you, I would start with grammar.', ru: 'На вашем месте я бы начал с грамматики.' },
  ],
  extraExamples: [
    { t: 'What would you do if you won a grant?', ru: 'Что бы вы сделали, если бы получили грант?' },
    { t: 'The wound will heal faster if you control your glucose.', ru: 'Рана заживёт быстрее, если вы будете контролировать глюкозу.' },
  ],
  pitfalls: [
    { wrong: 'If I will have time, I will call you.', right: 'If I have time, I will call you.', why: 'После if — Present Simple.' },
    { wrong: 'If I would have money, I would buy it.', right: 'If I had money, I would buy it.', why: 'Во втором типе в if-части — Past Simple.' },
    { wrong: 'If I was you…', right: 'If I were you…', why: 'В устойчивом совете используется were.' },
  ],
  warmup: [
    mcq('en12-w1', T12, 'If you ___ water to 100 °C, it boils.', ['heat', 'will heat', 'heated'], 0, 'Нулевой тип: Present Simple в обеих частях.'),
    mcq('en12-w2', T12, 'If I pass the exam, I ___ very happy.', ['am', 'will be', 'would be'], 1, 'Первый тип → will.'),
  ],
  practice: [
    gap('en12-p1', T12, 'If it ___ (rain) tomorrow, we will stay at home.', ['rains'], 'После if — Present Simple.'),
    gap('en12-p2', T12, 'If I ___ (have) more time, I would read more.', ['had'], 'Второй тип: if + Past Simple.'),
    mcq('en12-p3', T12, 'If I were you, I ___ see a specialist.', ['will', 'would', 'am'], 1, 'If I were you → would.'),
    mcq('en12-p4', T12, 'Выберите правильный вариант.', ['If I will finish early, I will call.', 'If I finish early, I will call.', 'If I finished early, I will call.'], 1, 'Первый тип: if + Present, will.'),
    tr('en12-p5', T12, 'Если бы я знал ответ, я бы сказал вам.', ['If I knew the answer, I would tell you', "If I knew the answer, I'd tell you", 'If I knew the answer I would tell you'], 'Второй тип: knew / would tell.'),
    order('en12-p6', T12, ['you', 'would', 'What', 'do'], ['What would you do?'], 'Вопрос: What + would + you + do?'),
  ],
  listening: {
    title: 'Совет коллеги',
    text: 'If you want a good IELTS score, you need a plan. If you study for ninety minutes every day, you will see progress in a month. If I were you, I would practise speaking with a partner. If I had more time, I would study with you.',
    ru: 'Если хочешь хороший балл IELTS, нужен план. Если будешь заниматься по 90 минут каждый день, через месяц увидишь прогресс. На твоём месте я бы практиковал разговор с партнёром. Если бы у меня было больше времени, я бы занимался с тобой.',
    questions: [
      listenMcq('en12-l1', T12, '', 'Когда будет заметен прогресс?', ['через неделю', 'через месяц', 'через год'], 1, '“you will see progress in a month.”'),
      listenMcq('en12-l2', T12, '', 'Что советует коллега?', ['читать больше', 'практиковать говорение с партнёром', 'смотреть фильмы'], 1, '“I would practise speaking with a partner.”'),
    ],
  },
  shadow: [
    { t: 'If I were you, I would start today.', ru: 'На твоём месте я бы начал сегодня.' },
    { t: 'If I have time, I will call you.', ru: 'Если будет время, я позвоню.' },
  ],
  control: [
    gap('en12-c1', T12, 'If you ___ (not / sleep), you feel tired.', ["don't sleep", 'do not sleep'], 'Нулевой тип.'),
    mcq('en12-c2', T12, 'If she ___ harder, she would pass.', ['studies', 'studied', 'will study'], 1, 'Второй тип: Past Simple.'),
    mcq('en12-c3', T12, 'We ___ late if we don’t hurry.', ['will be', 'would be', 'are'], 0, 'Первый тип: will.'),
    tr('en12-c4', T12, 'Если я сдам IELTS, я поступлю в докторантуру.', ['If I pass IELTS, I will apply for a PhD', "If I pass IELTS, I'll apply for a PhD", 'If I pass IELTS, I will enter the PhD programme', 'If I pass IELTS, I will apply to the PhD programme', 'If I pass IELTS, I will enter a PhD programme'], 'Первый тип.'),
  ],
  extra: [
    mcq('en12-x1', T12, 'What would you do if you ___ a million dollars?', ['win', 'won', 'will win'], 1, 'Второй тип: won.'),
    gap('en12-x2', T12, 'If the wound ___ (become) red, call your doctor.', ['becomes'], 'Инструкция: if + Present.'),
  ],
  summary: [
    '0: if + Present, Present — общие истины',
    '1: if + Present, will — реальное будущее',
    '2: if + Past, would — гипотеза; If I were you',
    'Никогда: if + will',
  ],
  vocab: [
    v('en', 'improve', 'improve', 'улучшать(ся)', 'Your English will improve quickly.', 'Ваш английский быстро улучшится.', 'Образование', 'A2', '/ɪmˈpruːv/'),
    v('en', 'thirsty', 'thirsty', 'испытывающий жажду', 'Patients with high glucose feel thirsty.', 'Пациенты с высокой глюкозой испытывают жажду.', 'Здоровье', 'A2', '/ˈθɜːsti/'),
    v('en', 'grant', 'grant', 'грант', 'She won a research grant.', 'Она выиграла исследовательский грант.', 'Академическая деятельность', 'B2', '/ɡrɑːnt/'),
  ],
};
