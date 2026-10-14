import { useState } from 'react';
import { IELTS_READING_TESTS } from '../data/ielts/reading';
import { IELTS_LISTENING_TESTS } from '../data/ielts/listening';
import { IELTS_CUE_CARDS, IELTS_SPEAKING_P1, IELTS_WRITING, SPEAKING_PHRASES } from '../data/ielts/writing-speaking';
import { useAppState } from '../lib/store';
import { latestSections } from '../lib/selectors';
import { navigate } from '../lib/router';
import { useStudyTimer, useCountdown } from '../lib/hooks';
import { Badge, Button, Card, LinkRow, Notice, PageHeader, Tabs, cx, fmtTimer } from '../components/ui';
import { WritingTrainer } from '../components/WritingTrainer';
import { TaskChart } from '../components/TaskChart';
import { SpeakRecorder } from '../components/SpeakRecorder';
import { SpeakButton } from '../components/Audio';
import { questionCount } from '../data/exam-types';
import { ACCENT_NAMES, availableAccents, type Accent } from '../lib/speech';
import { useVoices } from '../lib/hooks';

export function IeltsHub() {
  const s = useAppState();
  const last = latestSections(s, 'ielts');
  const rows = [
    { href: '/ielts/listening', title: 'Listening', sub: '4 части · 40 вопросов · ≈ 30 минут', key: 'listening' },
    { href: '/ielts/reading', title: 'Reading (Academic)', sub: '3 текста · 40 вопросов · 60 минут', key: 'reading' },
    { href: '/ielts/writing', title: 'Writing', sub: 'Task 1 (≥ 150 слов, 20 мин) + Task 2 (≥ 250 слов, 40 мин); Task 2 весит вдвое больше', key: 'writing' },
    { href: '/ielts/speaking', title: 'Speaking', sub: '3 части · 11–14 минут', key: 'speaking' },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="IELTS Academic" subtitle="Цель: Overall 5.0 (минимум) – 5.5 (желательно). Итог — среднее четырёх модулей с округлением до 0,5." />
      <Card>
        {rows.map((r) => (
          <LinkRow
            key={r.href}
            href={r.href}
            icon="target"
            title={r.title}
            subtitle={r.sub}
            right={last[r.key] ? <Badge tone="brand">{last[r.key].band != null ? `band ${last[r.key].band}` : `${Math.round((last[r.key].correct / last[r.key].total) * 100)}%`}</Badge> : undefined}
          />
        ))}
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Пробный экзамен</h2>
        <p className="text-sm text-ink-soft">Все четыре модуля с таймером, без подсказок. Общий балл рассчитывается, только если проверены все четыре компонента.</p>
        <Button className="mt-2" href="/exams">
          Открыть пробные экзамены
        </Button>
      </Card>
      <Notice tone="info">Структура и критерии — по публикациям ielts.org. Все тексты, аудиосценарии и задания приложения оригинальные. Перед экзаменом сверьте актуальные правила на ielts.org.</Notice>
    </div>
  );
}

const READING_STRATEGIES = [
  { t: 'Skimming (просмотровое чтение)', d: 'За 2–3 минуты прочитайте заголовок, первое предложение каждого абзаца и последний абзац. Цель — понять тему и структуру, а не детали.' },
  { t: 'Scanning (поиск информации)', d: 'Ищите в тексте конкретику из вопроса: числа, имена, термины с заглавной буквы. Глаза «пробегают» текст, не читая каждое слово.' },
  { t: 'Ключевые слова и перефразирование', d: 'В вопросах почти всегда синонимы: «fell sharply» ↔ «declined dramatically». Подчёркивайте ключевые слова и ищите их смысл, а не точное совпадение.' },
  { t: 'TRUE / FALSE / NOT GIVEN', d: 'FALSE — текст прямо противоречит утверждению. NOT GIVEN — информации нет. Не используйте собственные знания!' },
  { t: 'Matching Headings', d: 'Заголовок отражает ГЛАВНУЮ мысль абзаца, а не отдельную деталь. Сначала прочитайте первое и последнее предложения абзаца.' },
  { t: 'Время', d: '≈ 20 минут на текст. Не задерживайтесь на одном вопросе больше 1–2 минут; ответы на вопросы-заполнения идут по порядку текста.' },
];

export function IeltsReading() {
  useStudyTimer('en');
  return (
    <div className="space-y-4">
      <PageHeader title="IELTS Reading" back="/ielts" subtitle="Academic: 3 текста, 40 вопросов, 60 минут" />
      <Card>
        <h2 className="text-lg font-semibold">Стратегии</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {READING_STRATEGIES.map((s) => (
            <div key={s.t} className="rounded-xl bg-canvas p-3 text-sm">
              <div className="font-medium">{s.t}</div>
              <div className="mt-0.5 text-ink-soft">{s.d}</div>
            </div>
          ))}
        </div>
      </Card>
      {IELTS_READING_TESTS.map((t) => (
        <TestCard key={t.id} id={t.id} title={t.title} note={t.formatNote} count={questionCount(t)} minutes={t.minutes} />
      ))}
      <Card>
        <h2 className="text-lg font-semibold">Форматы заданий в тесте</h2>
        <p className="mt-1 text-sm text-ink-soft">True/False/Not Given, Yes/No/Not Given, Matching Headings, Matching Information, Multiple Choice, Sentence Completion, Summary Completion, Short Answer Questions. Форматы Matching Features и Table Completion — в следующих версиях банка заданий.</p>
      </Card>
    </div>
  );
}

function TestCard({ id, title, note, count, minutes }: { id: string; title: string; note: string; count: number; minutes: number }) {
  const s = useAppState();
  const attempts = s.exams.filter((e) => e.testId === id);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge>{count} вопросов</Badge>
        <Badge>{minutes} мин</Badge>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{note}</p>
      {attempts.length > 0 && (
        <p className="mt-1 text-sm">
          Попыток: {attempts.length} · последняя: {attempts.at(-1)!.correct}/{attempts.at(-1)!.total}
          {attempts.at(-1)!.band != null && ` (band ${attempts.at(-1)!.band})`}
        </p>
      )}
      {attempts.length > 0 && <p className="text-xs text-warn">Повторное прохождение того же теста завышает результат — ответы уже знакомы. Для объективной оценки нужны новые тесты.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate(`/exam/${id}/training`)}>
          Тренировка (с подсказками)
        </Button>
        <Button onClick={() => navigate(`/exam/${id}/exam`)} icon="clock">
          Экзаменационный режим
        </Button>
      </div>
    </Card>
  );
}

export function IeltsListening() {
  useStudyTimer('en');
  useVoices();
  const accents = availableAccents();
  return (
    <div className="space-y-4">
      <PageHeader title="IELTS Listening" back="/ielts" subtitle="4 части, 40 вопросов, ≈ 30 минут" />
      <Card>
        <h2 className="text-lg font-semibold">Как устроен Listening</h2>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
          <li>Part 1 — бытовой диалог (анкеты, бронирование): имена по буквам, числа, даты.</li>
          <li>Part 2 — монолог (экскурсия, объявление): выбор ответа, планы и карты.</li>
          <li>Part 3 — обсуждение учебного проекта (2–4 человека).</li>
          <li>Part 4 — академическая лекция: заполнение конспекта.</li>
        </ul>
        <p className="mt-2 text-sm">Запись звучит один раз. Перед каждой частью прочитайте вопросы и предскажите тип ответа (число, имя, существительное).</p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Акценты</h2>
        <p className="text-sm text-ink-soft">
          Голоса синтезатора на вашем устройстве: {accents.length ? accents.map((a) => ACCENT_NAMES[a]).join(', ') : 'только стандартный английский'}. Тренажёр не выдаёт один и тот же синтетический голос за разные акценты —
          ниже можно прослушать фразу каждым реально доступным голосом.
        </p>
        <AccentDemo accents={accents} />
      </Card>
      {IELTS_LISTENING_TESTS.map((t) => (
        <TestCard key={t.id} id={t.id} title={t.title} note={t.formatNote} count={questionCount(t)} minutes={t.minutes} />
      ))}
      <Card>
        <h2 className="text-lg font-semibold">Форматы заданий</h2>
        <p className="mt-1 text-sm text-ink-soft">В тесте: Form Completion, Multiple Choice, Map Labelling, Matching, Note Completion. Table/Sentence Completion, Diagram Labelling и Short Answer — в следующих версиях банка заданий.</p>
        <Button className="mt-2" variant="secondary" href="/dictation/en">
          Аудиодиктанты для разминки
        </Button>
      </Card>
    </div>
  );
}

function AccentDemo({ accents }: { accents: Accent[] }) {
  const text = 'The library is on the second floor, next to the lecture hall.';
  if (!accents.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {accents.map((a) => (
        <div key={a} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1 text-sm">
          <SpeakButton text={text} lang="en" accent={a} compact allowReveal={false} />
          {ACCENT_NAMES[a]} ({a})
        </div>
      ))}
    </div>
  );
}

export function IeltsWriting() {
  useStudyTimer('en');
  const [id, setId] = useState<string | null>(null);
  const t = IELTS_WRITING.find((x) => x.id === id);
  if (t) {
    return (
      <div className="space-y-4">
        <PageHeader title={t.task === 'ielts1' ? 'Writing Task 1' : 'Writing Task 2'} back="/ielts/writing" />
        <button className="text-sm text-brand underline" onClick={() => setId(null)}>
          ← другие задания
        </button>
        <WritingTrainer
          key={t.id}
          lang="en"
          task={t.task}
          promptId={t.id}
          prompt={t.prompt}
          minutes={t.task === 'ielts1' ? 20 : 40}
          minWords={t.task === 'ielts1' ? 150 : 250}
          extra={
            <>
              {t.chart && <TaskChart spec={t.chart} />}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-brand">Подсказки по структуре</summary>
                <ul className="mt-1 list-disc pl-5 text-ink-soft">
                  {t.tips.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </details>
            </>
          }
        />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <PageHeader title="IELTS Writing" back="/ielts" subtitle="Task 2 весит в оценке Writing вдвое больше, чем Task 1" />
      <Card>
        <h2 className="text-lg font-semibold">Критерии оценки</h2>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-canvas p-3">
            <strong>Task Achievement / Task Response</strong> — полнота ответа на задание, обзор (Task 1), позиция (Task 2).
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <strong>Coherence & Cohesion</strong> — логика, абзацы, связки.
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <strong>Lexical Resource</strong> — разнообразие и точность лексики.
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <strong>Grammatical Range & Accuracy</strong> — разнообразие конструкций и точность.
          </div>
        </div>
      </Card>
      {(['ielts1', 'ielts2'] as const).map((task) => (
        <Card key={task}>
          <h2 className="text-lg font-semibold">{task === 'ielts1' ? 'Task 1: графики, таблицы, процессы' : 'Task 2: эссе'}</h2>
          <div className="mt-2 space-y-1">
            {IELTS_WRITING.filter((w) => w.task === task).map((w) => (
              <button key={w.id} onClick={() => setId(w.id)} className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-canvas">
                {w.prompt.split('.')[0]}.
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function IeltsSpeaking() {
  useStudyTimer('en');
  const [tab, setTab] = useState<'p1' | 'p2' | 'mock'>('p1');
  return (
    <div className="space-y-4">
      <PageHeader title="IELTS Speaking" back="/ielts" subtitle="Part 1: 4–5 мин · Part 2: 1 мин подготовки + до 2 мин речи · Part 3: 4–5 мин" />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'p1', label: 'Part 1' }, { value: 'p2', label: 'Part 2 + 3' }, { value: 'mock', label: 'Полный пробный' }]} />
      <Card>
        <div className="text-sm font-medium">Полезные фразы</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SPEAKING_PHRASES.map((p) => (
            <Badge key={p}>{p}</Badge>
          ))}
        </div>
      </Card>
      {tab === 'p1' && <Part1 />}
      {tab === 'p2' && <Part2 />}
      {tab === 'mock' && <SpeakingMock />}
    </div>
  );
}

function Examiner({ q }: { q: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-brand-soft p-3">
      <SpeakButton text={q} lang="en" compact allowReveal={false} />
      <div>
        <div className="text-xs text-brand-ink">Examiner</div>
        <div className="font-medium">{q}</div>
      </div>
    </div>
  );
}

function Part1() {
  const [topic, setTopic] = useState(IELTS_SPEAKING_P1[0].id);
  const [qi, setQi] = useState(0);
  const t = IELTS_SPEAKING_P1.find((x) => x.id === topic)!;
  const q = t.questions[qi];
  return (
    <Card>
      <div className="flex flex-wrap gap-1.5">
        {IELTS_SPEAKING_P1.map((x) => (
          <button
            key={x.id}
            onClick={() => {
              setTopic(x.id);
              setQi(0);
            }}
            className={cx('min-h-11 rounded-full border px-4 text-sm font-medium', x.id === topic ? 'border-brand bg-brand-soft' : 'border-line')}
          >
            {x.topic}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Examiner q={q} />
        <p className="mt-2 text-sm text-ink-soft">Отвечайте 2–3 предложениями (≈ 20–30 секунд): ответ + причина + пример.</p>
        <SpeakRecorder key={topic + qi} lang="en" context={`IELTS Part 1: ${t.topic}`} prompt={q} targetSeconds={30} />
        <div className="mt-3 flex justify-between">
          <Button size="sm" variant="secondary" disabled={qi === 0} onClick={() => setQi(qi - 1)}>
            Назад
          </Button>
          <Button size="sm" disabled={qi + 1 >= t.questions.length} onClick={() => setQi(qi + 1)}>
            Следующий вопрос
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Part2() {
  const [id, setId] = useState(IELTS_CUE_CARDS[0].id);
  const c = IELTS_CUE_CARDS.find((x) => x.id === id)!;
  const [notes, setNotes] = useState('');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {IELTS_CUE_CARDS.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={cx('min-h-11 rounded-full border px-4 text-sm font-medium', x.id === id ? 'border-brand bg-brand-soft' : 'border-line')}>
            {x.title.replace('Describe ', '')}
          </button>
        ))}
      </div>
      <Card>
        <div className="rounded-xl border-2 border-ink/80 p-4">
          <div className="font-semibold">{c.title}</div>
          <div className="mt-1 text-sm">You should say:</div>
          <ul className="list-disc pl-5 text-sm">
            {c.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-line p-2 text-sm" placeholder="Заметки на время подготовки (1 минута)" />
        <SpeakRecorder key={id} lang="en" context="IELTS Part 2" prompt={c.title} prepSeconds={60} targetSeconds={120} />
      </Card>
      <Card>
        <h3 className="text-[17px] font-semibold">Part 3: обсуждение</h3>
        <div className="mt-2 space-y-3">
          {c.part3.map((q) => (
            <details key={q} className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <div className="mt-2">
                <Examiner q={q} />
                <SpeakRecorder lang="en" context="IELTS Part 3" prompt={q} targetSeconds={60} />
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SpeakingMock() {
  const [step, setStep] = useState(-1);
  const [card] = useState(() => IELTS_CUE_CARDS[Math.floor(Math.random() * IELTS_CUE_CARDS.length)]);
  const [p1] = useState(() => {
    const t = IELTS_SPEAKING_P1[Math.floor(Math.random() * IELTS_SPEAKING_P1.length)];
    const w = IELTS_SPEAKING_P1.find((x) => x.id === 'work')!;
    return [...w.questions.slice(0, 2), ...t.questions.slice(0, 2)];
  });
  const plan = [...p1.map((q) => ({ part: 'Part 1', q, sec: 30 })), { part: 'Part 2', q: card.title, sec: 120 }, ...card.part3.slice(0, 4).map((q) => ({ part: 'Part 3', q, sec: 60 }))];
  const totalLeft = useCountdown(14 * 60, step >= 0 && step < plan.length);
  if (step < 0)
    return (
      <Card>
        <h2 className="text-lg font-semibold">Полный пробный Speaking (11–14 минут)</h2>
        <p className="mt-1 text-sm">Part 1: 4 вопроса · Part 2: карточка (1 мин подготовки, до 2 мин речи) · Part 3: 4 вопроса. Вопросы озвучивает виртуальный экзаменатор (синтезатор речи), ответы записываются.</p>
        <Notice tone="warn">Без AI ответы сохраняются с транскрипцией и показателями беглости; балл Speaking не выставляется. Произношение по транскрипции не оценивается.</Notice>
        <Button className="mt-3" icon="play" onClick={() => setStep(0)}>
          Начать
        </Button>
      </Card>
    );
  if (step >= plan.length)
    return (
      <Card tone="good">
        <h2 className="text-lg font-semibold">Пробный Speaking завершён</h2>
        <p className="mt-1 text-sm">Ответы сохранены в статистике. Прослушайте свои записи и проанализируйте их с AI (если подключён). Оценку преподавателя можно ввести на странице «Пробные экзамены».</p>
        <Button className="mt-2" href="/exams">
          К пробным экзаменам
        </Button>
      </Card>
    );
  const cur = plan[step];
  return (
    <Card>
      <div className="flex items-center justify-between text-sm">
        <Badge tone="brand">{cur.part}</Badge>
        <span className="font-mono tabular-nums">Осталось {fmtTimer(totalLeft)}</span>
      </div>
      <div className="mt-3">
        {cur.part === 'Part 2' ? (
          <div className="rounded-xl border-2 border-ink/80 p-4">
            <div className="font-semibold">{card.title}</div>
            <ul className="list-disc pl-5 text-sm">
              {card.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : (
          <Examiner q={cur.q} />
        )}
        <SpeakRecorder key={step} lang="en" context={`IELTS mock ${cur.part}`} prompt={cur.q} targetSeconds={cur.sec} prepSeconds={cur.part === 'Part 2' ? 60 : undefined} examMode />
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={() => setStep(step + 1)}>{step + 1 < plan.length ? 'Следующий вопрос' : 'Завершить'}</Button>
      </div>
    </Card>
  );
}
