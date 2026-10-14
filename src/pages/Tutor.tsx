import { useMemo, useRef, useState } from 'react';
import type { Lang } from '../data/types';
import { LESSONS } from '../data';
import { topicName } from '../data/curriculum';
import { useAppState, update } from '../lib/store';
import { aiCall, aiConfigured, learnerContext } from '../lib/ai';
import { weakTopics } from '../lib/planner';
import { normalize } from '../lib/text';
import { useStudyTimer } from '../lib/hooks';
import { Badge, Button, Card, LinkRow, Notice, PageHeader, Tabs, cx, inputCls } from '../components/ui';
import { Theory } from './Lesson';

export function TutorPage() {
  const [lang, setLang] = useState<Lang>('en');
  useStudyTimer(lang);
  const ok = aiConfigured();
  return (
    <div className="space-y-4">
      <PageHeader title="Мой преподаватель" subtitle="Объяснения на русском с постепенным переходом на изучаемый язык" />
      <Tabs value={lang} onChange={setLang} items={[{ value: 'en', label: 'English Tutor' }, { value: 'kk', label: 'Қазақ тілі мұғалімі' }]} />
      <MemoryCard lang={lang} />
      {ok ? <AiChat key={lang} lang={lang} /> : <OfflineTutor key={lang} lang={lang} />}
    </div>
  );
}

/** «Память» преподавателя: повторяющиеся ошибки, по которым автоматически назначаются упражнения. */
function MemoryCard({ lang }: { lang: Lang }) {
  const s = useAppState();
  const weak = weakTopics(s, lang).slice(0, 4);
  return (
    <Card>
      <h2 className="font-semibold">Что преподаватель помнит о ваших ошибках</h2>
      {weak.length ? (
        <>
          <p className="text-sm text-ink-soft">По этим темам план автоматически назначает дополнительные упражнения.</p>
          <div className="mt-1">
            {weak.map((w) => (
              <LinkRow key={w.topic} href={`/practice/${encodeURIComponent(w.topic)}`} title={topicName(w.topic)} subtitle={`точность ${Math.round(w.accuracy * 100)}% · открытых ошибок ${w.open}`} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-soft">Повторяющихся ошибок пока нет. Они появятся после уроков и тестов.</p>
      )}
    </Card>
  );
}

function OfflineTutor({ lang }: { lang: Lang }) {
  const [q, setQ] = useState('');
  const lessons = LESSONS.filter((l) => l.lang === lang);
  const results = useMemo(() => {
    const n = normalize(q);
    if (n.length < 2) return [];
    const words = n.split(' ').filter((w) => w.length > 1);
    return lessons
      .map((l) => {
        const hay = normalize([l.title, l.goal, l.simple, ...l.theory.map((t) => ('text' in t ? t.text : t.type === 'table' ? t.rows.flat().join(' ') : '')), ...l.pitfalls.map((p) => p.wrong + ' ' + p.right)].join(' '));
        const score = words.reduce((a, w) => a + (hay.includes(w) ? 1 : 0), 0);
        return { l, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [q, lessons]);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <Notice tone="warn" title="AI не подключён">
        Свободный диалог с AI-преподавателем недоступен. Ниже работает система заранее подготовленных объяснений: поиск по правилам, примерам и типичным ошибкам всех уроков. Подключить AI можно в Настройках (платный сервис).
      </Notice>
      <Card>
        <h2 className="font-semibold">Задайте вопрос по грамматике</h2>
        <input className={cx(inputCls, 'mt-2')} value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === 'en' ? 'например: since for, артикли, have been' : 'например: падеж, -ға -ге, множественное'} />
        <div className="mt-3 space-y-2">
          {q && results.length === 0 && <p className="text-sm text-ink-soft">Ничего не найдено. Попробуйте другие слова или откройте список тем ниже.</p>}
          {results.map(({ l }) => (
            <div key={l.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{l.title}</div>
                <Button size="sm" variant="ghost" onClick={() => setOpen(open === l.id ? null : l.id)}>
                  {open === l.id ? 'Свернуть' : 'Полное правило'}
                </Button>
              </div>
              <p className="mt-1 text-sm">{l.simple}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {l.pitfalls.slice(0, 2).map((p) => (
                  <li key={p.wrong}>
                    <span className="text-bad line-through">{p.wrong}</span> → <span className="text-good">{p.right}</span>
                  </li>
                ))}
              </ul>
              {open === l.id && (
                <div className="mt-3">
                  <Theory blocks={l.theory} />
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" href={`/lesson/${l.id}`}>
                  Урок
                </Button>
                <Button size="sm" variant="secondary" href={`/practice/${encodeURIComponent(l.topic)}`}>
                  Дай упражнения
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Все темы с объяснениями</h2>
        <div className="mt-1">
          {lessons.map((l) => (
            <LinkRow key={l.id} href={`/lesson/${l.id}`} title={l.title} subtitle={l.simple.slice(0, 90) + '…'} />
          ))}
        </div>
      </Card>
    </>
  );
}

const QUICK: Record<Lang, string[]> = {
  en: ['Объясни разницу между Present Perfect и Past Simple на примерах из медицины', 'Проверь моё предложение: «I am working in hospital since 2005»', 'Дай 5 упражнений по моим частым ошибкам', 'Задай мне 3 вопроса IELTS Speaking Part 1 и оцени ответы'],
  kk: ['Объясни, как выбирать окончания -ға/-ге/-қа/-ке', 'Проверь предложение: «Мен ауруханада жұмыс істеймін»', 'Дай 5 упражнений по падежам', 'Проведи со мной короткий диалог врача и пациента'],
};

function AiChat({ lang }: { lang: Lang }) {
  const s = useAppState();
  const history = s.tutor[lang];
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setErr('');
    setInput('');
    const msg = { role: 'user' as const, content: text.trim(), at: Date.now() };
    update((d) => {
      d.tutor[lang].push(msg);
    });
    setBusy(true);
    try {
      const msgs = [...history, msg].slice(-20).map((m) => ({ role: m.role, content: m.content }));
      const reply = await aiCall({ task: 'tutor', lang, messages: msgs, context: learnerContext(lang) });
      update((d) => {
        d.tutor[lang].push({ role: 'assistant', content: reply, at: Date.now() });
        if (d.tutor[lang].length > 200) d.tutor[lang].splice(0, d.tutor[lang].length - 200);
      });
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Диалог с преподавателем</h2>
        <Badge tone="good">AI подключён</Badge>
      </div>
      <p className="text-xs text-ink-soft">Преподаватель получает сводку ваших частых ошибок и уровня, чтобы учитывать историю обучения. Ответы AI могут содержать неточности.</p>
      <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
        {history.length === 0 && <p className="text-sm text-ink-soft">Задайте вопрос или выберите подсказку ниже.</p>}
        {history.map((m, i) => (
          <div key={i} className={cx('rounded-xl px-3 py-2 text-sm whitespace-pre-line', m.role === 'user' ? 'ml-8 bg-brand-soft' : 'mr-8 bg-canvas')}>
            {m.content}
          </div>
        ))}
        {busy && <div className="mr-8 rounded-xl bg-canvas px-3 py-2 text-sm text-ink-soft">Преподаватель печатает…</div>}
        <div ref={endRef} />
      </div>
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK[lang].map((qk) => (
          <button key={qk} onClick={() => send(qk)} className="rounded-full border border-line px-3 py-1 text-left text-xs hover:bg-canvas" disabled={busy}>
            {qk}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} className={cx(inputCls, 'flex-1')} placeholder="Ваш вопрос…" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))} />
        <Button onClick={() => send(input)} disabled={busy || !input.trim()}>
          Отправить
        </Button>
      </div>
      {history.length > 0 && (
        <button className="mt-2 text-xs text-ink-soft underline" onClick={() => update((d) => void (d.tutor[lang] = []))}>
          Очистить диалог
        </button>
      )}
    </Card>
  );
}
