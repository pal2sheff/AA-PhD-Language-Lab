// Сценарии разговорного тренажёра. Медицинские диалоги — вымышленные.
import type { Lang } from './types';

export interface Turn {
  tutor: string;
  ru: string;
  /** Ключевые слова/конструкции, которые ожидаются в ответе (проверка без AI). */
  expect: string[];
  model: string;
}

export interface Scenario {
  id: string;
  lang: Lang;
  title: string;
  role: string;
  turns: Turn[];
  phrases: { t: string; ru: string }[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'en-intro', lang: 'en', title: 'Знакомство', role: 'A colleague at an international conference',
    turns: [
      { tutor: 'Hi, I’m Anna from Sweden. I don’t think we’ve met. Where are you from?', ru: 'Привет, я Анна из Швеции. Кажется, мы не знакомы. Откуда вы?', expect: ['i am|i\'m', 'from'], model: 'Nice to meet you, Anna. I’m from Kazakhstan — I live and work in Astana.' },
      { tutor: 'Oh, interesting! What do you do there?', ru: 'О, интересно! Чем вы там занимаетесь?', expect: ['surgeon|doctor', 'work'], model: 'I’m a surgeon. I work at a city hospital, mostly with patients who have diabetic foot problems.' },
      { tutor: 'And why are you at this conference?', ru: 'А почему вы на этой конференции?', expect: ['because|to', 'research|learn|interested'], model: 'I’m interested in research on wound healing, and I’m planning to start a PhD next year.' },
    ],
    phrases: [{ t: 'Nice to meet you.', ru: 'Приятно познакомиться.' }, { t: 'I’m planning to start a PhD.', ru: 'Я планирую поступить в докторантуру.' }, { t: 'I’m interested in…', ru: 'Меня интересует…' }],
  },
  {
    id: 'en-work', lang: 'en', title: 'Работа', role: 'An IELTS-style examiner asking about your job',
    turns: [
      { tutor: 'Can you describe a typical working day?', ru: 'Опишите обычный рабочий день.', expect: ['usually|normally|every', 'start|begin'], model: 'I usually start at eight with a meeting. Then I see patients, and in the afternoon I operate.' },
      { tutor: 'What do you find most challenging about your job?', ru: 'Что самое трудное в вашей работе?', expect: ['because', 'difficult|challenging|hard'], model: 'The most challenging thing is the night shifts, because they are physically and mentally exhausting.' },
      { tutor: 'Would you recommend this profession to young people?', ru: 'Посоветовали бы вы эту профессию молодым?', expect: ['would', 'but|however|although'], model: 'I would, but only if they are really motivated, because the training is very long.' },
    ],
    phrases: [{ t: 'The most challenging thing is…', ru: 'Самое трудное — это…' }, { t: 'I would recommend it, but…', ru: 'Я бы посоветовал, но…' }],
  },
  {
    id: 'en-family', lang: 'en', title: 'Семья', role: 'A friendly neighbour',
    turns: [
      { tutor: 'Do you have a big family?', ru: 'У вас большая семья?', expect: ['have|has', 'children|wife|husband|son|daughter|brother|sister'], model: 'Yes, quite big. I have a wife and two children, and my parents live nearby.' },
      { tutor: 'What do you usually do together at weekends?', ru: 'Что вы обычно делаете вместе в выходные?', expect: ['usually|often|sometimes', 'we'], model: 'We usually go to the park or visit relatives. Sometimes we cook together.' },
      { tutor: 'How has family life changed compared with your parents’ generation?', ru: 'Как изменилась семейная жизнь по сравнению с поколением ваших родителей?', expect: ['more|less|than', 'now|today'], model: 'Today families are smaller, and people spend less time together because they work more.' },
    ],
    phrases: [{ t: 'My parents live nearby.', ru: 'Мои родители живут неподалёку.' }, { t: 'compared with…', ru: 'по сравнению с…' }],
  },
  {
    id: 'en-education', lang: 'en', title: 'Образование', role: 'A university admissions officer',
    turns: [
      { tutor: 'Could you tell me about your education?', ru: 'Расскажите о своём образовании.', expect: ['graduated|studied', 'in \\d{4}|years'], model: 'I graduated from medical school in 2004 and completed a residency in surgery. Later I did a master’s degree.' },
      { tutor: 'Why do you want to do a PhD at this stage of your career?', ru: 'Почему вы хотите писать диссертацию на этом этапе карьеры?', expect: ['because|want', 'research'], model: 'Because I have twenty years of clinical experience, and I want to turn my observations into proper research.' },
      { tutor: 'What will your research focus on?', ru: 'Чему будет посвящено исследование?', expect: ['focus|study|investigate', 'diabet|mitochond|immun'], model: 'It will focus on mitochondrial dysfunction in patients with diabetic foot ulcers.' },
    ],
    phrases: [{ t: 'I completed a residency in surgery.', ru: 'Я окончил ординатуру по хирургии.' }, { t: 'My research will focus on…', ru: 'Моё исследование будет посвящено…' }],
  },
  {
    id: 'en-travel', lang: 'en', title: 'Путешествия', role: 'A hotel receptionist',
    turns: [
      { tutor: 'Good evening. Do you have a reservation?', ru: 'Добрый вечер. У вас есть бронь?', expect: ['yes|i have', 'name|booked|reservation'], model: 'Yes, I booked a single room for three nights. The name is Akhmetov.' },
      { tutor: 'Would you like breakfast included?', ru: 'Включить завтрак?', expect: ['yes|no', 'please|thank'], model: 'Yes, please. What time is breakfast served?' },
      { tutor: 'Is there anything else I can help you with?', ru: 'Чем ещё могу помочь?', expect: ['could|can|how', 'get to|where|taxi'], model: 'Could you tell me how to get to the conference centre?' },
    ],
    phrases: [{ t: 'I booked a single room.', ru: 'Я забронировал одноместный номер.' }, { t: 'How do I get to…?', ru: 'Как добраться до…?' }],
  },
  {
    id: 'en-health', lang: 'en', title: 'Обсуждение здоровья', role: 'A friend asking for health advice',
    turns: [
      { tutor: 'I always feel tired. What do you think I should do?', ru: 'Я всё время устаю. Что посоветуешь?', expect: ['should', 'sleep|exercise|doctor'], model: 'You should try to sleep at least seven hours and maybe see a doctor to check your blood tests.' },
      { tutor: 'Is it really that important to exercise every day?', ru: 'Неужели так важно заниматься каждый день?', expect: ['because|important', 'reduce|improve|help'], model: 'Yes, because regular exercise improves insulin sensitivity and reduces the risk of heart disease.' },
      { tutor: 'What about diets? Do they work?', ru: 'А диеты помогают?', expect: ['depend|but|however', 'healthy|balanced'], model: 'It depends. Strict diets rarely work long-term, but a balanced diet usually does.' },
    ],
    phrases: [{ t: 'You should…', ru: 'Тебе стоит…' }, { t: 'It depends.', ru: 'Зависит от ситуации.' }],
  },
  {
    id: 'en-research', lang: 'en', title: 'Обсуждение исследования', role: 'A professor at a seminar',
    turns: [
      { tutor: 'What is the main hypothesis of your study?', ru: 'Какова главная гипотеза вашего исследования?', expect: ['hypothes|we expect|we assume', 'that'], model: 'Our main hypothesis is that impaired mitochondrial function delays wound healing in diabetic patients.' },
      { tutor: 'How are you going to test it?', ru: 'Как вы собираетесь её проверить?', expect: ['will|going to', 'patients|samples|compare|measure'], model: 'We will compare tissue samples from patients with healing and non-healing ulcers and measure mitochondrial activity.' },
      { tutor: 'What are the main limitations?', ru: 'Каковы основные ограничения?', expect: ['limitation|small|however', 'sample|size|cannot'], model: 'The main limitation is the small sample size, so we cannot draw firm conclusions about causation.' },
    ],
    phrases: [{ t: 'Our main hypothesis is that…', ru: 'Наша главная гипотеза состоит в том, что…' }, { t: 'The main limitation is…', ru: 'Главное ограничение — …' }],
  },
  {
    id: 'kk-intro', lang: 'kk', title: 'Танысу (знакомство)', role: 'Жаңа әріптес',
    turns: [
      { tutor: 'Сәлеметсіз бе! Менің атым Айгүл. Сіздің атыңыз кім?', ru: 'Здравствуйте! Меня зовут Айгуль. Как вас зовут?', expect: ['атым|мен', ''], model: 'Сәлеметсіз бе! Менің атым Ерлан. Танысқаныма қуаныштымын.' },
      { tutor: 'Сіз қай бөлімде жұмыс істейсіз?', ru: 'В каком отделении вы работаете?', expect: ['бөлім', 'істеймін|жұмыс'], model: 'Мен хирургия бөлімінде жұмыс істеймін.' },
      { tutor: 'Мұнда қанша жылдан бері жұмыс істейсіз?', ru: 'Сколько лет вы здесь работаете?', expect: ['жыл', 'бері|істеймін'], model: 'Мен мұнда он жылдан бері жұмыс істеймін.' },
    ],
    phrases: [{ t: 'Танысқаныма қуаныштымын.', ru: 'Рад познакомиться.' }, { t: '… жылдан бері', ru: 'уже … лет' }],
  },
  {
    id: 'kk-shop', lang: 'kk', title: 'Дүкенде (покупки)', role: 'Сатушы',
    turns: [
      { tutor: 'Сәлеметсіз бе! Сізге не керек?', ru: 'Здравствуйте! Что вам нужно?', expect: ['керек|бер', 'нан|сүт|алма|су'], model: 'Маған бір нан мен бір литр сүт керек.' },
      { tutor: 'Тағы не аласыз?', ru: 'Что ещё возьмёте?', expect: ['келі|алма|тағы|жоқ', ''], model: 'Бір келі алма беріңізші.' },
      { tutor: 'Барлығы бір мың екі жүз теңге.', ru: 'Всего тысяча двести тенге.', expect: ['картамен|ақша|төле', ''], model: 'Картамен төлеуге бола ма?' },
    ],
    phrases: [{ t: '… беріңізші', ru: 'дайте, пожалуйста, …' }, { t: 'Картамен төлеуге бола ма?', ru: 'Можно оплатить картой?' }],
  },
  {
    id: 'kk-office', lang: 'kk', title: 'Мемлекеттік мекемеде (ЦОН)', role: 'ХҚКО қызметкері',
    turns: [
      { tutor: 'Сәлеметсіз бе! Сізге қандай қызмет керек?', ru: 'Здравствуйте! Какая услуга вам нужна?', expect: ['анықтама|құжат|керек', ''], model: 'Маған мекенжай анықтамасы керек.' },
      { tutor: 'Жеке куәлігіңізді көрсетіңізші.', ru: 'Покажите удостоверение личности.', expect: ['мінеки|міне|ал', ''], model: 'Міне, алыңыз.' },
      { tutor: 'Анықтама ертең дайын болады.', ru: 'Справка будет готова завтра.', expect: ['сағат|қашан|рақмет', ''], model: 'Рақмет! Ертең сағат нешеде келуге болады?' },
    ],
    phrases: [{ t: 'Маған … анықтама керек.', ru: 'Мне нужна справка …' }, { t: 'Міне, алыңыз.', ru: 'Вот, возьмите.' }],
  },
  {
    id: 'kk-patient', lang: 'kk', title: 'Науқаспен сөйлесу (вымышленный пациент)', role: 'Науқас (врач — вы)',
    turns: [
      { tutor: 'Сәлеметсіз бе, дәрігер! Аяғым қатты ауырады.', ru: 'Здравствуйте, доктор! У меня сильно болит нога.', expect: ['қашан|қашаннан|бері', ''], model: 'Сәлеметсіз бе! Отырыңыз. Қашаннан бері ауырады?' },
      { tutor: 'Бір аптадан бері. Табанымда жара бар.', ru: 'Уже неделю. На стопе рана.', expect: ['диабет|қант', 'бар ма'], model: 'Сізде қант диабеті бар ма?' },
      { tutor: 'Иә, он жылдан бері. Не істеуім керек?', ru: 'Да, десять лет. Что мне делать?', expect: ['керек|тапсырыңыз|келіңіз', ''], model: 'Қан талдауын тапсырыңыз. Жараны күнде таңу керек. Ертең қайта келіңіз.' },
    ],
    phrases: [{ t: 'Қашаннан бері ауырады?', ru: 'С какого времени болит?' }, { t: 'Сізде … бар ма?', ru: 'У вас есть …?' }],
  },
  {
    id: 'kk-procedure', lang: 'kk', title: 'Процедураны түсіндіру', role: 'Науқас (врач — вы)',
    turns: [
      { tutor: 'Дәрігер, ертең маған ота жасайсыз ба?', ru: 'Доктор, вы завтра будете меня оперировать?', expect: ['иә|ертең', 'ота'], model: 'Иә, ертең таңертең ота жасаймыз.' },
      { tutor: 'Отаға қалай дайындалуым керек?', ru: 'Как мне подготовиться к операции?', expect: ['тамақ|ішпеңіз|жемеңіз', ''], model: 'Түн ортасынан кейін тамақ жемеңіз және су ішпеңіз.' },
      { tutor: 'Ота ұзақ бола ма?', ru: 'Операция будет долгой?', expect: ['сағат|минут', ''], model: 'Жоқ, шамамен бір сағат болады. Уайымдамаңыз.' },
    ],
    phrases: [{ t: 'Уайымдамаңыз.', ru: 'Не волнуйтесь.' }, { t: 'Түн ортасынан кейін тамақ жемеңіз.', ru: 'После полуночи не ешьте.' }],
  },
  {
    id: 'kk-kaztest', lang: 'kk', title: 'КАЗТЕСТ: пікір білдіру', role: 'Емтихан алушы',
    turns: [
      { tutor: 'Сіздің ойыңызша, қазақ тілін білу неге маңызды?', ru: 'Почему, по-вашему, важно знать казахский язык?', expect: ['ойымша|меніңше', 'себебі|өйткені'], model: 'Менің ойымша, қазақ тілін білу маңызды, себебі бұл — мемлекеттік тіл.' },
      { tutor: 'Сіз тілді қалай үйреніп жүрсіз?', ru: 'Как вы изучаете язык?', expect: ['күнде|үйреніп|оқимын|тыңдаймын', ''], model: 'Мен күнде жарты сағат сабақ оқимын және қазақша подкаст тыңдаймын.' },
      { tutor: 'Тіл үйренудің ең қиын жағы не?', ru: 'Что самое трудное в изучении языка?', expect: ['қиын', 'бірақ|алайда|себебі'], model: 'Ең қиыны — септіктер, бірақ күнделікті жаттығу көмектеседі.' },
    ],
    phrases: [{ t: 'Менің ойымша, …', ru: 'По-моему, …' }, { t: 'Ең қиыны — …', ru: 'Самое трудное — …' }],
  },
];
