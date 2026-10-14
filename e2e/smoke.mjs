// Сквозной тест в Chromium (размер экрана iPhone 13).
// Запуск: npm run build && npm run server (в другом окне) && npm run e2e
// Переменные: BASE_URL (по умолчанию http://localhost:8787), CHROMIUM_PATH.
import { chromium, devices } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://localhost:8787';
const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'ru-RU', permissions: ['microphone'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log('✓', name);
  } catch (e) {
    console.log('✗', name, '\n   ', e.message.split('\n')[0]);
    await page.screenshot({ path: `e2e-fail-${passed}.png`, fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}
const go = async (route) => {
  await page.goto(`${BASE}/#${route}`);
  await page.waitForTimeout(350);
};
const btn = (name, exact = false) => page.getByRole('button', { name, exact });
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await step('1. Приложение открывается, первый запуск ведёт в мастер', async () => {
  await page.goto(BASE);
  await page.waitForURL(/onboarding/);
  await page.getByRole('heading', { name: 'AA PhD Language Lab' }).waitFor();
});

await step('2. Выбор программы «Интенсив 90 дней» и нагрузки 90 минут', async () => {
  await btn('Интенсив · 90 дней').click();
  await btn('90 мин (рекомендуется)').click();
  await btn('Начать с диагностики английского').click();
  await page.waitForURL(/diagnostic\/en/);
});

async function runSkill(lang, skill, correctPattern) {
  await go(`/diagnostic/${lang}`);
  const row = page.locator('li', { hasText: skill });
  await row.getByRole('button', { name: /Начать|Продолжить/ }).click();
  for (let i = 0; i < 6; i++) {
    const options = page.locator('main .grid button');
    await options.first().waitFor();
    const play = btn('Прослушать');
    if (await play.count()) await play.first().click().catch(() => {});
    const show = page.getByText('Показать текст');
    if (await show.count()) await show.first().click();
    const n = await options.count();
    await options.nth(i % n === 0 ? 0 : correctPattern ? 0 : 1).click();
    await btn('Ответить').click();
    await page.waitForTimeout(80);
  }
  await page.getByText('завершена').waitFor();
}

await step('3. Диагностика английского: 4 адаптивные части + пропуск письма/речи', async () => {
  for (const sk of ['Грамматика', 'Лексика', 'Чтение', 'Аудирование']) await runSkill('en', sk, true);
  await go('/diagnostic/en');
  for (const sk of ['Письмо', 'Говорение']) await page.locator('li', { hasText: sk }).getByRole('button', { name: 'Пропустить' }).click();
  await btn(/Завершить диагностику/).click();
  await page.waitForURL(/diagnostic\/en\/result/);
  await page.getByText('Предполагаемый (ориентировочный) уровень').waitFor();
  await page.getByText('не проверено').first().waitFor();
  await page.getByText('Реалистичность цели').waitFor();
});

await step('4. Диагностика казахского частями (2 части) и завершение', async () => {
  await runSkill('kk', 'Грамматика', false);
  await runSkill('kk', 'Лексика', true);
  await go('/diagnostic/kk');
  await btn(/Завершить с тем, что есть/).click();
  await page.waitForURL(/diagnostic\/kk\/result/);
  await page.getByText(/Не проверены автоматически/).waitFor();
});

await step('5. Индивидуальный план на сегодня сформирован', async () => {
  await go('/today');
  await page.getByRole('heading', { name: 'Мои занятия' }).waitFor();
  const items = await page.locator('main ul li').count();
  assert(items >= 4, 'в плане меньше 4 блоков: ' + items);
  await page.getByText(/Урок: Глагол to be/).waitFor();
});

await step('6–9. Урок: теория, «Объясни проще», упражнения, разбор ошибки', async () => {
  await go('/lesson/en-01');
  await btn('К теории').click();
  await page.getByText('Объяснение').waitFor();
  await btn('Объясни проще').click();
  await page.getByText('Запомните одно правило').waitFor();
  await btn('К примерам').click();
  await btn('Покажи пример').click();
  await btn('Типичные ошибки').click();
  await page.getByText('I am agree with you.').waitFor();
  await btn('К разминке').click();
  // Разминка: первый ответ — специально неверный
  await btn('is', true).click();
  await btn('Проверить').click();
  await page.getByText('Неверно').waitFor();
  await page.getByText('Почему не ваш вариант').waitFor();
  await btn('Объясни мою ошибку').click();
  await page.getByText('Разбор ошибки').waitFor();
  await btn('Повтори правило').click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await btn('Далее').click();
  await btn('are', true).click();
  await btn('Проверить').click();
  await page.getByText('Верно!').waitFor();
  await btn('Завершить').click();
  await page.getByText(/Упражнение 1 из/).waitFor();
});

await step('10. Ошибка сохранена в «Мои ошибки»', async () => {
  await go('/mistakes');
  await page.getByText('I ___ a surgeon.').waitFor();
});

await step('11. Словарь: добавление темы и повторение', async () => {
  await go('/vocab/topic/en/Здоровье');
  await btn(/Добавить в словарь/).click();
  await go('/vocab');
  await page.getByText('Мои слова (').waitFor();
  await go('/vocab/review/en');
  await btn('Запомнил(а), дальше').click();
  await page.waitForTimeout(200);
});

await step('12–13. Закрыть и открыть снова: прогресс сохранён', async () => {
  await page.waitForTimeout(600); // автосохранение
  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/#/lesson/en-01`);
  await page2.getByText(/Шаг 6 из 9|Шаг 5 из 9/).waitFor({ timeout: 5000 });
  await page2.goto(`${BASE}/#/mistakes`);
  await page2.getByText('I ___ a surgeon.').waitFor();
  await page2.goto(`${BASE}/#/`);
  await page2.getByText(/Сегодня: день 1 из 90/).waitFor();
  await page2.close();
});

await step('Смена программы на 6 месяцев пересчитывает календарь, история сохраняется', async () => {
  await go('/settings');
  await btn('Стандарт · 6 мес.').click();
  await go('/calendar');
  await page.getByText(/180 дней/).waitFor();
  await go('/mistakes');
  await page.getByText('I ___ a surgeon.').waitFor();
  await go('/settings');
  await btn('Интенсив · 3 мес.').click();
});

await step('Таймер экзамена идёт; экзамен завершается и даёт band', async () => {
  await go('/exam/ielts-reading-1/exam');
  await btn('Начать').click();
  const t1 = await page.locator('span.font-mono').first().innerText();
  await page.waitForTimeout(2200);
  const t2 = await page.locator('span.font-mono').first().innerText();
  assert(t1 !== t2, `таймер не идёт: ${t1} → ${t2}`);
  await btn('TRUE').first().click();
  page.once('dialog', (d) => d.accept());
  await btn('Завершить', true).click();
  await page.getByText('ориентировочный band').waitFor();
});

await step('Казахские символы отображаются корректно', async () => {
  await go('/lesson/kk-01');
  await btn('К теории').click();
  const text = await page.locator('main').innerText();
  for (const ch of 'әғқңөұүһі') assert(text.includes(ch), 'нет символа ' + ch);
});

await step('Микрофон: запрос разрешения и запись (тестовое устройство)', async () => {
  await go('/pronunciation/en');
  await btn('Записать себя').first().click();
  await page.getByText('Идёт запись').waitFor();
  await page.waitForTimeout(700);
  await btn('Остановить').first().click();
  await page.locator('audio').first().waitFor();
});

await step('Все разделы открываются без ошибок и без горизонтальной прокрутки', async () => {
  const routes = ['/', '/today', '/en', '/kk', '/ielts', '/ielts/reading', '/ielts/listening', '/ielts/writing', '/ielts/speaking', '/kaztest', '/kaztest/listening', '/kaztest/reading', '/kaztest/writing', '/kaztest/speaking', '/tutor', '/conversation', '/pronunciation/kk', '/dictation/en', '/dictation/kk', '/vocab', '/mistakes', '/mistakes/review/en', '/exams', '/calendar', '/stats', '/settings', '/medical', '/emergency', '/checkpoint/en', '/practice/en.articles'];
  for (const r of routes) {
    await go(r);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `горизонтальная прокрутка на ${r}: ${overflow}px`);
    const h = await page.locator('main h1').count();
    assert(h > 0, `нет заголовка на ${r}`);
  }
});

await step('Writing: подсчёт слов и автоматическая проверка', async () => {
  await go('/ielts/writing');
  await page.getByText(/Some people think that governments/).click();
  await page.locator('textarea').fill('I am agree that people is responsible for there health. However the government should help. In conclusion, both are important.');
  await page.getByText(/Слов: /).first().waitFor();
  await btn('Сдать на проверку').click();
  await page.getByText('Автоматическая проверка').waitFor();
  await page.getByText(/меньше минимума 250/).waitFor();
  await page.getByText('i am agree', { exact: false }).first().waitFor();
});

await step('Нет неработающих кнопок на главной: «Начать занятие» открывает урок/диагностику', async () => {
  await go('/');
  await btn('Начать занятие').click();
  await page.waitForTimeout(400);
  assert(!page.url().endsWith('#/'), 'кнопка не перешла никуда');
});

const real = errors.filter((e) => !/speechSynthesis|net::ERR|Failed to load resource/.test(e));
if (real.length) {
  console.log('Ошибки в консоли:\n' + real.join('\n'));
  await browser.close();
  process.exit(1);
}
console.log(`\nВсе проверки пройдены: ${passed}`);
await browser.close();
