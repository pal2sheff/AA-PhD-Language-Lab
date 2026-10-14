// Тренажёры произношения и аудиодиктантов (оригинальные материалы).
import type { Lang } from './types';

export interface PronSet {
  id: string;
  title: string;
  focus: string;
  items: { t: string; ru?: string; note?: string }[];
}

export const PRON: Record<Lang, PronSet[]> = {
  en: [
    { id: 'th', title: 'Звуки /θ/ и /ð/ (th)', focus: 'Кончик языка между зубами. Не заменяйте th на «с», «з», «ф» или «т».', items: [
      { t: 'think — sink', note: '/θɪŋk/ — /sɪŋk/' }, { t: 'three — tree', note: '/θriː/ — /triː/' }, { t: 'this — these — those', note: 'звонкий /ð/' },
      { t: 'I think the therapy is worth it.', ru: 'Я думаю, что эта терапия того стоит.' }, { t: 'Both brothers are thirty-three.', ru: 'Обоим братьям по тридцать три.' },
    ] },
    { id: 'vw', title: 'Звуки /w/ и /v/', focus: '/w/ — губы округлены, как для «у», без касания зубов. /v/ — верхние зубы касаются нижней губы.', items: [
      { t: 'west — vest' }, { t: 'wet — vet' }, { t: 'wine — vine' },
      { t: 'We visited the ward on Wednesday.', ru: 'Мы посетили палату в среду.' }, { t: 'What was the very worst week?', ru: 'Какая неделя была самой тяжёлой?' },
    ] },
    { id: 'vowels', title: 'Короткие и долгие гласные', focus: 'Долгота гласной меняет слово: ship /ɪ/ — sheep /iː/; full /ʊ/ — fool /uː/; bad /æ/ — bed /e/.', items: [
      { t: 'ship — sheep' }, { t: 'live — leave' }, { t: 'full — fool' }, { t: 'bad — bed' }, { t: 'man — men' },
      { t: 'Please leave the sheet on the seat.', ru: 'Пожалуйста, оставьте простыню на сиденье.' },
    ] },
    { id: 'stress', title: 'Ударение в словах', focus: 'Ударение может смещаться в однокоренных словах. Ударный слог — громче и длиннее, безударные часто превращаются в нейтральный /ə/.', items: [
      { t: 'PHOtograph — phoTOgraphy — photoGRAPHic' }, { t: 'aNAlysis — ANalyse — anaLYtical' }, { t: 'diaBEtes — diaBEtic' }, { t: 'SURgeon — SURgery — SURgical' },
      { t: 'mitoCHONdria — mitoCHONdrial', note: '/ˌmaɪtəʊˈkɒndriə/' }, { t: 'ENdocrine — endocriNOlogy' },
    ] },
    { id: 'endings', title: 'Окончания -s и -ed', focus: '-ed: /t/ после глухих (worked), /d/ после звонких (lived), /ɪd/ после t, d (treated, needed). Не проглатывайте окончания — они несут грамматику.', items: [
      { t: 'worked — lived — treated' }, { t: 'helps — needs — washes' },
      { t: 'She treated three patients and checked their results.', ru: 'Она пролечила трёх пациентов и проверила их результаты.' }, { t: 'He works, she studies, and it rains.' },
    ] },
    { id: 'intonation', title: 'Интонация вопросов', focus: 'Общие вопросы (yes/no) — повышение тона в конце. Специальные (what, where…) — понижение.', items: [
      { t: 'Are you a doctor? ↗' }, { t: 'Where do you work? ↘' }, { t: 'Have you ever been to London? ↗' }, { t: 'What is your research about? ↘' },
    ] },
    { id: 'ielts', title: 'Фразы для IELTS Speaking', focus: 'Связная речь: соединяйте слова, не делайте пауз после каждого слова.', items: [
      { t: 'That’s an interesting question.' }, { t: 'I’d say that it depends on the situation.' }, { t: 'On the one hand…, but on the other hand…' }, { t: 'Let me give you an example.' }, { t: 'To be honest, I’ve never thought about it.' },
    ] },
  ],
  kk: [
    { id: 'q', title: 'Қ и Ғ', focus: 'Қ — глухой звук глубоко в горле (глубже русского «к»). Ғ — звонкий фрикативный звук там же. Встречаются в твёрдых словах.', items: [
      { t: 'қала, қан, қыс', ru: 'город, кровь, зима' }, { t: 'ғылым, тағам, ағаш', ru: 'наука, еда, дерево' }, { t: 'Қазақстан — қазақ тілі', ru: 'Казахстан — казахский язык' },
      { t: 'Қан талдауы дайын ба?', ru: 'Анализ крови готов?' }, { t: 'Ғылыми жұмысым қызықты.', ru: 'Моя научная работа интересная.' },
    ] },
    { id: 'ng', title: 'Ң — носовой звук', focus: 'Как английское ng в long: язык прижат к мягкому нёбу, воздух идёт через нос. Не произносите как «н» + «г».', items: [
      { t: 'жаңа, таң, оң', ru: 'новый, рассвет, правый' }, { t: 'таңертең', ru: 'утром' }, { t: 'Сіздің атыңыз кім?', ru: 'Как вас зовут?' }, { t: 'Аяғыңызды көрсетіңізші.', ru: 'Покажите ногу.' },
    ] },
    { id: 'front', title: 'Ә, Ө, Ү, І — мягкие гласные', focus: 'Ә — широкое «э»; Ө — «о» с язычком вперёд; Ү — «у» с язычком вперёд (как нем. ü); І — короткое мягкое «и».', items: [
      { t: 'әке, сәлем', ru: 'отец, привет' }, { t: 'өмір, көз', ru: 'жизнь, глаз' }, { t: 'үй, күн', ru: 'дом, день' }, { t: 'бір, іні, біз', ru: 'один, младший брат, мы' },
      { t: 'Менің үйім үлкен.', ru: 'Мой дом большой.' },
    ] },
    { id: 'back', title: 'Ұ и Ы — твёрдые гласные', focus: 'Ұ — короткое твёрдое «у». Ы — как русское «ы», но короче.', items: [
      { t: 'ұл, ұйқы, ұшақ', ru: 'сын, сон, самолёт' }, { t: 'қыз, тыңдау, жылы', ru: 'девушка, слушать, тёплый' }, { t: 'Ұлым университетте оқиды.', ru: 'Мой сын учится в университете.' },
    ] },
    { id: 'harmony', title: 'Гармония гласных в окончаниях', focus: 'Слушайте, как окончание «звучит в тон» слову: твёрдые а/ы или мягкие е/і.', items: [
      { t: 'балалар — дәрігерлер', ru: 'дети — врачи' }, { t: 'қалада — үйде', ru: 'в городе — дома' }, { t: 'кітаптар — мектептер', ru: 'книги — школы' }, { t: 'Астанадан — үйден', ru: 'из Астаны — из дома' },
    ] },
    { id: 'clinic', title: 'Фразы врача', focus: 'Медицинские фразы — вымышленный учебный диалог.', items: [
      { t: 'Сізді не мазалайды?', ru: 'Что вас беспокоит?' }, { t: 'Қашаннан бері ауырады?', ru: 'С какого времени болит?' }, { t: 'Қан қысымыңызды өлшейік.', ru: 'Давайте измерим давление.' }, { t: 'Ертең қайта келіңіз.', ru: 'Приходите завтра снова.' },
    ] },
  ],
};

export interface DictationItem {
  id: string;
  level: string;
  kind: 'words' | 'sentence' | 'text' | 'gaps' | 'memory';
  title: string;
  text: string;
  ru?: string;
  /** Для режима «восстановление пропусков»: индексы слов, которые скрыты. */
  gaps?: number[];
  explain?: string;
}

export const DICTATION: Record<Lang, DictationItem[]> = {
  en: [
    { id: 'en-dw1', level: 'A1', kind: 'words', title: 'Слова: больница', text: 'doctor, nurse, patient, hospital, ward, surgeon', explain: 'Обратите внимание на двойные и непроизносимые буквы: surgeon (g + e).' },
    { id: 'en-dw2', level: 'A2', kind: 'words', title: 'Слова: исследование', text: 'research, results, analysis, evidence, sample, journal', explain: 'Research и evidence — неисчисляемые, без -s.' },
    { id: 'en-ds1', level: 'A2', kind: 'sentence', title: 'Предложение', text: 'My wife works at a school in Astana.', ru: 'Моя жена работает в школе в Астане.', explain: 'works — окончание -s после she / my wife; a school — артикль.' },
    { id: 'en-ds2', level: 'A2', kind: 'sentence', title: 'Предложение', text: 'We didn’t have time to finish the report.', ru: 'У нас не было времени закончить отчёт.', explain: 'didn’t + have (начальная форма).' },
    { id: 'en-ds3', level: 'B1', kind: 'sentence', title: 'Предложение', text: 'The patients were divided into two groups.', ru: 'Пациентов разделили на две группы.', explain: 'Пассив: were divided.' },
    { id: 'en-dg1', level: 'B1', kind: 'gaps', title: 'Восстановите пропуски', text: 'I have worked as a surgeon for twenty years and I have treated many patients with diabetic foot.', gaps: [1, 2, 6, 11, 12], explain: 'Present Perfect: have worked, have treated; for + период.' },
    { id: 'en-dt1', level: 'B1', kind: 'text', title: 'Короткий текст', text: 'Diabetes is a growing problem in many countries. It can damage nerves and blood vessels in the feet. Regular checks help doctors find problems early.', ru: 'Диабет — растущая проблема во многих странах. Он может повреждать нервы и сосуды стоп. Регулярные осмотры помогают врачам рано находить проблемы.', explain: 'Проверьте окончания: countries, nerves, vessels, checks, doctors, problems.' },
    { id: 'en-dm1', level: 'B1', kind: 'memory', title: 'Запишите по памяти', text: 'Although the treatment is expensive, it is very effective.', ru: 'Хотя лечение дорогое, оно очень эффективно.', explain: 'Although + предложение, без but.' },
    { id: 'en-dt2', level: 'B2', kind: 'text', title: 'Академический текст', text: 'The study suggests that moderate exercise improves insulin sensitivity. However, the sample was small, and further research is needed to confirm these findings.', explain: 'suggests that…; however с запятой; research — без -s.' },
  ],
  kk: [
    { id: 'kk-dw1', level: 'A1', kind: 'words', title: 'Слова: особые буквы', text: 'қала, жаңа, үй, өмір, ұл, бір', explain: 'Проверьте казахские буквы: қ, ң, ү, ө, ұ, і.' },
    { id: 'kk-dw2', level: 'A2', kind: 'words', title: 'Слова: больница', text: 'дәрігер, науқас, аурухана, дәрі, жара, қан', explain: 'ә в дәрігер и дәрі; қ в науқас и қан.' },
    { id: 'kk-ds1', level: 'A1', kind: 'sentence', title: 'Предложение', text: 'Мен ауруханада жұмыс істеймін.', ru: 'Я работаю в больнице.', explain: 'ауруханада — жатыс; істеймін — я работаю.' },
    { id: 'kk-ds2', level: 'A2', kind: 'sentence', title: 'Предложение', text: 'Кеше мен Алматыдан келдім.', ru: 'Вчера я приехал из Алматы.', explain: 'Алматыдан — шығыс; келдім — прошедшее время.' },
    { id: 'kk-dg1', level: 'A2', kind: 'gaps', title: 'Восстановите пропуски', text: 'Менің басым ауырады, сондықтан мен дәрігерге бардым.', gaps: [1, 5, 6], explain: 'басым — притяжательное; дәрігерге — барыс; бардым — прошедшее.' },
    { id: 'kk-dt1', level: 'B1', kind: 'text', title: 'Короткий текст', text: 'Қант диабеті — созылмалы ауру. Науқастар аяғын күнде тексеруі керек. Дәрігерлер дұрыс тамақтануға кеңес береді.', ru: 'Сахарный диабет — хроническое заболевание. Пациентам нужно ежедневно осматривать ноги. Врачи советуют правильно питаться.', explain: 'Обратите внимание на окончания: науқастар, дәрігерлер, тамақтануға.' },
    { id: 'kk-dm1', level: 'A2', kind: 'memory', title: 'Запишите по памяти', text: 'Сіздің атыңыз кім?', ru: 'Как вас зовут?', explain: 'атыңыз — ваше имя (-ыңыз).' },
  ],
};
