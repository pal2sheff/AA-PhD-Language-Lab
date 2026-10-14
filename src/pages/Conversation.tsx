import { useState } from 'react';
import type { Lang } from '../data/types';
import { SCENARIOS, type Scenario } from '../data/conversation';
import { useAppState, update } from '../lib/store';
import { aiCall, aiConfigured, aiJson, learnerContext } from '../lib/ai';
import { recognitionSupported, startRecognition, type Recognizer } from '../lib/speech';
import { addCustomWord, markBlockDone, recordFreeMistake } from '../lib/learning';
import { normalize, uid } from '../lib/text';
import { useStudyTimer } from '../lib/hooks';
import { SpeakButton } from '../components/Audio';
import { MicNotice } from '../components/Shadow';
import { Badge, Button, Card, Notice, PageHeader, Tabs, cx, inputCls } from '../components/ui';

export function ConversationPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [sc, setSc] = useState<Scenario | null>(null);
  const [mode, setMode] = useState<'guided' | 'ai'>('guided');
  useStudyTimer(lang);
  const s = useAppState();
  if (sc) return mode === 'ai' && aiConfigured() ? <AiDialog sc={sc} onExit={() => setSc(null)} /> : <GuidedDialog sc={sc} onExit={() => setSc(null)} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Разговорный тренажёр" subtitle="Выберите язык и тему. Голосом (если браузер поддерживает распознавание) или текстом." />
      <Tabs value={lang} onChange={setLang} items={[{ value: 'en', label: 'Английский' }, { value: 'kk', label: 'Казахский' }]} />
      <Card>
        <div className="text-sm font-medium">Режим</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => setMode('guided')} className={cx('rounded-xl border px-3 py-2 text-left text-sm', mode === 'guided' ? 'border-brand bg-brand-soft' : 'border-line')}>
            <div className="font-medium">Сценарий с проверкой ключевых фраз</div>
            <div className="text-xs text-ink-soft">Работает без AI: заранее подготовленные реплики и образцы ответов</div>
          </button>
          <button onClick={() => setMode('ai')} disabled={!aiConfigured()} className={cx('rounded-xl border px-3 py-2 text-left text-sm disabled:opacity-50', mode === 'ai' ? 'border-brand bg-brand-soft' : 'border-line')}>
            <div className="font-medium">Свободный диалог с AI</div>
            <div className="text-xs text-ink-soft">{aiConfigured() ? 'AI играет роль собеседника и анализирует речь' : 'Недоступно: AI не подключён (Настройки)'}</div>
          </button>
        </div>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        {SCENARIOS.filter((x) => x.lang === lang).map((x) => (
          <button key={x.id} onClick={() => setSc(x)} className="rounded-2xl border border-line bg-surface p-4 text-left hover:bg-canvas">
            <div className="font-semibold">{x.title}</div>
            <div className="text-sm text-ink-soft">{x.role}</div>
            {s.conversations.some((c) => c.scenario === x.id) && <Badge tone="good">пройдено</Badge>}
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceInput({ lang, value, onChange }: { lang: Lang; value: string; onChange: (v: string) => void }) {
  const [rec, setRec] = useState<Recognizer | null>(null);
  const [err, setErr] = useState('');
  return (
    <div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={inputCls} placeholder={recognitionSupported() ? 'Нажмите микрофон и говорите, или печатайте' : 'Введите ответ текстом'} lang={lang} />
      <div className="mt-2 flex items-center gap-2">
        {recognitionSupported() &&
          (rec ? (
            <Button size="sm" variant="danger" icon="stop" onClick={() => rec.stop()}>
              Стоп
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              icon="mic"
              onClick={() => {
                setErr('');
                const base = value ? value + ' ' : '';
                setRec(startRecognition(lang, (f, i) => onChange(base + (f + ' ' + i).trim()), setErr, () => setRec(null)));
              }}
            >
              Говорить
            </Button>
          ))}
        {err && <span className="text-sm text-warn">{err}</span>}
      </div>
    </div>
  );
}

function matches(answer: string, pattern: string): boolean {
  if (!pattern) return true;
  try {
    return new RegExp(pattern, 'i').test(normalize(answer).replace(/’/g, "'"));
  } catch {
    return normalize(answer).includes(pattern.toLowerCase());
  }
}

function GuidedDialog({ sc, onExit }: { sc: Scenario; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [log, setLog] = useState<{ turn: number; answer: string; ok: boolean[] }[]>([]);
  const [shown, setShown] = useState(false);
  const [added, setAdded] = useState(false);
  const turn = sc.turns[i];
  const done = i >= sc.turns.length;

  const submit = () => {
    const ok = turn.expect.filter(Boolean).map((p) => matches(value, p));
    setLog((l) => [...l, { turn: i, answer: value, ok }]);
    setShown(true);
  };

  if (done) {
    const used = sc.phrases.filter((p) => log.some((l) => normalize(l.answer).includes(normalize(p.t).slice(0, 12))));
    const weak = log.filter((l) => l.ok.some((x) => !x));
    return (
      <div className="space-y-4">
        <PageHeader title={`Итог: ${sc.title}`} back="/conversation" />
        <Card>
          <h3 className="text-[17px] font-semibold">Ваши ответы</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {log.map((l) => (
              <li key={l.turn} className="rounded-lg bg-canvas p-2.5">
                <div className="text-ink-soft">{sc.turns[l.turn].tutor}</div>
                <div className="mt-1">Вы: {l.answer || '—'}</div>
                <div className="mt-1 text-good">Образец: {sc.turns[l.turn].model}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="text-[17px] font-semibold">Анализ (без AI)</h3>
          <ul className="mt-1 space-y-1 text-sm">
            <li>Использованные выражения сценария: {used.length ? used.map((u) => u.t).join('; ') : 'не найдены'}</li>
            <li>Ответов без ожидаемых конструкций: {weak.length} из {log.length}</li>
          </ul>
          <p className="mt-2 text-xs text-ink-soft">Автоматически проверяется только наличие ключевых конструкций. Грамматические ошибки в свободной речи без AI не анализируются — сравните ответы с образцами.</p>
        </Card>
        <Card>
          <h3 className="text-[17px] font-semibold">Новые выражения для повторения</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {sc.phrases.map((p) => (
              <li key={p.t}>
                <span className="font-medium" lang={sc.lang}>
                  {p.t}
                </span>{' '}
                — {p.ru}
              </li>
            ))}
          </ul>
          <Button
            className="mt-2"
            size="sm"
            variant="secondary"
            disabled={added}
            onClick={() => {
              sc.phrases.forEach((p) => addCustomWord(sc.lang, p.t, p.ru, '', '', 'Разговорные фразы'));
              setAdded(true);
            }}
          >
            {added ? 'Добавлено в словарь' : 'Добавить в словарь'}
          </Button>
          <p className="mt-2 text-sm">Задание на повторение: повторите сценарий завтра, отвечая без подсказок и своими словами.</p>
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onExit}>
            Другие темы
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={sc.title} back="/conversation" subtitle={`Реплика ${i + 1} из ${sc.turns.length} · собеседник: ${sc.role}`} />
      <MicNotice />
      <Card>
        <div className="flex items-start gap-3 rounded-xl bg-canvas p-3">
          <SpeakButton text={turn.tutor} lang={sc.lang} compact allowReveal={false} />
          <div>
            <div className="font-medium" lang={sc.lang}>
              {turn.tutor}
            </div>
            <div className="text-sm text-ink-soft">{turn.ru}</div>
          </div>
        </div>
        <div className="mt-3">
          <VoiceInput lang={sc.lang} value={value} onChange={setValue} />
        </div>
        {!shown ? (
          <div className="mt-3 flex justify-end">
            <Button onClick={submit} disabled={!value.trim()}>
              Ответить
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {log.at(-1)!.ok.every(Boolean) ? <Notice tone="good">Ключевые конструкции использованы.</Notice> : <Notice tone="warn">В ответе не хватает ожидаемых конструкций — сравните с образцом.</Notice>}
            <div className="rounded-lg bg-good-soft p-2.5">
              Образец ответа: <span lang={sc.lang}>{turn.model}</span>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setShown(false);
                  setValue('');
                  if (i + 1 >= sc.turns.length) {
                    update((d) => {
                      d.conversations.unshift({ id: uid('c'), lang: sc.lang, scenario: sc.id, at: Date.now(), turns: [], summary: { phrases: [], issues: [], newWords: [] } });
                    });
                    markBlockDone('speaking', sc.lang);
                    markBlockDone('conversation', sc.lang);
                  }
                  setI(i + 1);
                }}
              >
                {i + 1 >= sc.turns.length ? 'Итоги' : 'Дальше'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

interface Summary {
  phrases: string[];
  issues: { quote: string; correction: string; explanation: string }[];
  newWords: { word: string; translation: string }[];
  recommendations: string[];
}

function AiDialog({ sc, onExit }: { sc: Scenario; onExit: () => void }) {
  const [turns, setTurns] = useState<{ role: 'tutor' | 'user'; text: string }[]>([{ role: 'tutor', text: sc.turns[0].tutor }]);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);

  const send = async () => {
    if (!value.trim()) return;
    const next = [...turns, { role: 'user' as const, text: value.trim() }];
    setTurns(next);
    setValue('');
    setBusy(true);
    setErr('');
    try {
      const reply = await aiCall({
        task: 'conversation',
        lang: sc.lang,
        messages: next.map((t) => ({ role: t.role === 'tutor' ? ('assistant' as const) : ('user' as const), content: t.text })),
        context: { ...learnerContext(sc.lang), scenario: sc.title, role: sc.role },
      });
      setTurns([...next, { role: 'tutor', text: reply }]);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  const finish = async () => {
    setBusy(true);
    try {
      const res = await aiJson<Summary>({
        task: 'conversation-summary',
        lang: sc.lang,
        messages: [{ role: 'user', content: turns.map((t) => `${t.role === 'tutor' ? 'Собеседник' : 'Ученик'}: ${t.text}`).join('\n') }],
        context: learnerContext(sc.lang),
      });
      setSummary(res);
      update((d) => {
        d.conversations.unshift({ id: uid('c'), lang: sc.lang, scenario: sc.id, at: Date.now(), turns, summary: { phrases: res.phrases, issues: res.issues.map((x) => `${x.quote} → ${x.correction}`), newWords: res.newWords.map((w) => w.word) } });
      });
      res.issues.forEach((x, k) => recordFreeMistake({ key: `conv-${Date.now()}-${k}`, lang: sc.lang, category: 'speaking', topic: `${sc.lang}.speaking`, prompt: `Разговор: ${sc.title}`, userAnswer: x.quote, correct: x.correction, explain: x.explanation }));
      markBlockDone('speaking', sc.lang);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={`${sc.title} · AI`} back="/conversation" subtitle={sc.role} />
      <MicNotice />
      <Card>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {turns.map((t, i) => (
            <div key={i} className={cx('flex items-start gap-2', t.role === 'user' && 'justify-end')}>
              {t.role === 'tutor' && <SpeakButton text={t.text} lang={sc.lang} compact allowReveal={false} />}
              <div className={cx('max-w-[85%] rounded-xl px-3 py-2 text-sm', t.role === 'user' ? 'bg-brand-soft' : 'bg-canvas')} lang={sc.lang}>
                {t.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-ink-soft">…</div>}
        </div>
        {err && <p className="mt-2 text-sm text-bad">{err}</p>}
        {!summary && (
          <div className="mt-3">
            <VoiceInput lang={sc.lang} value={value} onChange={setValue} />
            <div className="mt-2 flex justify-between gap-2">
              <Button variant="secondary" onClick={finish} disabled={busy || turns.length < 3}>
                Завершить и получить разбор
              </Button>
              <Button onClick={send} disabled={busy || !value.trim()}>
                Ответить
              </Button>
            </div>
          </div>
        )}
      </Card>
      {summary && (
        <Card>
          <Notice tone="warn">Предварительный анализ AI по тексту диалога.</Notice>
          <h3 className="mt-2 text-[17px] font-semibold">Использованные выражения</h3>
          <p className="text-sm">{summary.phrases.join('; ') || '—'}</p>
          <h3 className="mt-2 text-[17px] font-semibold">Ошибки</h3>
          <ul className="space-y-1 text-sm">
            {summary.issues.map((x, i) => (
              <li key={i}>
                <span className="text-bad">{x.quote}</span> → <span className="text-good">{x.correction}</span> — {x.explanation}
              </li>
            ))}
          </ul>
          <h3 className="mt-2 text-[17px] font-semibold">Новые слова</h3>
          <ul className="text-sm">
            {summary.newWords.map((w) => (
              <li key={w.word}>
                {w.word} — {w.translation}
              </li>
            ))}
          </ul>
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => summary.newWords.forEach((w) => addCustomWord(sc.lang, w.word, w.translation, '', '', 'Разговорные фразы'))}>
            Добавить слова в словарь
          </Button>
          <h3 className="mt-2 text-[17px] font-semibold">Рекомендации</h3>
          <ul className="list-disc pl-5 text-sm">
            {summary.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button onClick={onExit}>Готово</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
