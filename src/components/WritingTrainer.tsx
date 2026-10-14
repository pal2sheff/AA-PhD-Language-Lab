import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '../data/types';
import { checkWriting, IELTS_SELF_CHECK, type WritingReport } from '../lib/writingCheck';
import { update, useAppState } from '../lib/store';
import { uid, wordCount } from '../lib/text';
import { markBlockDone, recordFreeMistake } from '../lib/learning';
import { aiConfigured, aiJson, learnerContext } from '../lib/ai';
import { useStopwatch } from '../lib/hooks';
import type { WritingEntry } from '../lib/state';
import { Badge, Button, Card, Notice, cx, fmtTimer } from './ui';
import { criteriaBand } from '../lib/scoring';

type Task = WritingEntry['task'];

interface AiWritingResult {
  band: number | null;
  criteria: Record<string, number>;
  summary: string;
  errors: { quote: string; issue: string; hint: string }[];
  recommendations: string[];
}

export function WritingTrainer({ lang, task, promptId, prompt, extra, minutes, minWords }: { lang: Lang; task: Task; promptId: string; prompt: string; extra?: ReactNode; minutes: number; minWords: number }) {
  const s = useAppState();
  const draftKey = `aa-draft-${promptId}`;
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(draftKey) ?? '';
    } catch {
      return '';
    }
  });
  const [running, setRunning] = useState(false);
  const elapsed = useStopwatch(running);
  const [report, setReport] = useState<WritingReport | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [self, setSelf] = useState<Record<string, boolean>>({});
  const [ai, setAi] = useState<{ loading: boolean; res?: AiWritingResult; error?: string }>({ loading: false });
  const [manual, setManual] = useState('');
  const words = wordCount(text);
  const past = useMemo(() => s.writings.filter((w) => w.promptId === promptId), [s.writings, promptId]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, text);
    } catch {
      /* хранилище недоступно */
    }
  }, [text, draftKey]);

  const submit = () => {
    setRunning(false);
    const r = checkWriting(text, lang, task, prompt);
    setReport(r);
    const id = uid('w');
    setEntryId(id);
    update((d) => {
      d.writings.unshift({ id, lang, task, promptId, prompt, text, words: r.words, seconds: elapsed, createdAt: Date.now(), findings: r.findings, selfCheck: {} });
    });
    r.findings.slice(0, 8).forEach((f, i) =>
      recordFreeMistake({ key: `${id}-${i}`, lang, category: 'writing', topic: `${lang}.writing`, prompt: `Письмо: ${f.message}`, userAnswer: f.excerpt ?? '', correct: f.fix ?? f.hint ?? '', explain: f.hint ?? '' }),
    );
    markBlockDone('writing', lang);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  };

  const evaluate = async () => {
    setAi({ loading: true });
    try {
      const raw = await aiJson<Omit<AiWritingResult, 'criteria'> & { criteria: { name: string; score: number }[] | Record<string, number> }>({
        task: 'writing',
        lang,
        messages: [{ role: 'user', content: `Тип задания: ${task}\nЗадание:\n${prompt}\n\nТекст ученика (${words} слов):\n${text}` }],
        context: { ...learnerContext(lang), exam: lang === 'en' ? 'IELTS Academic Writing' : 'КАЗТЕСТ Жазылым' },
      });
      const res: AiWritingResult = { ...raw, criteria: Array.isArray(raw.criteria) ? Object.fromEntries(raw.criteria.map((c) => [c.name, c.score])) : raw.criteria };
      setAi({ loading: false, res });
      update((d) => {
        const w = d.writings.find((x) => x.id === entryId);
        if (w) w.ai = { at: Date.now(), band: res.band, criteria: res.criteria, feedback: res.summary, errors: res.errors };
      });
      res.errors.slice(0, 10).forEach((e, i) => recordFreeMistake({ key: `${entryId}-ai-${i}`, lang, category: 'writing', topic: `${lang}.writing`, prompt: 'Письмо (AI)', userAnswer: e.quote, correct: e.hint, explain: e.issue }));
    } catch (e) {
      setAi({ loading: false, error: (e as Error).message });
    }
  };

  const overtime = elapsed > minutes * 60;

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge tone={lang === 'kk' ? 'kk' : 'brand'}>{task === 'ielts1' ? 'Task 1' : task === 'ielts2' ? 'Task 2' : task === 'kaz1' ? 'Жазылым 1' : 'Жазылым 2'}</Badge>
          <Badge>≥ {minWords} слов</Badge>
          <Badge>≈ {minutes} мин</Badge>
        </div>
        <p className="font-medium whitespace-pre-line" lang={lang}>
          {prompt}
        </p>
        {extra && <div className="mt-3">{extra}</div>}
      </Card>

      {!report ? (
        <Card>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className={cx(words < minWords ? 'text-warn' : 'text-good')}>
              Слов: <strong>{words}</strong> / {minWords}
            </span>
            <span className={cx('font-mono tabular-nums', overtime && 'text-bad')}>
              {fmtTimer(elapsed)} / {minutes}:00
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!running) setRunning(true);
            }}
            rows={14}
            className="w-full rounded-xl border border-line p-3 leading-relaxed outline-none focus:border-brand"
            placeholder="Начните писать — таймер запустится автоматически. Черновик сохраняется."
            lang={lang}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
          />
          <p className="mt-1 text-xs text-ink-soft">Автоисправление и проверка орфографии браузера отключены, как на экзамене. На iPhone удобнее писать в горизонтальной ориентации или с внешней клавиатурой.</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={submit} disabled={words < 10}>
              Сдать на проверку
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="text-[17px] font-semibold">Автоматическая проверка</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-canvas px-2 py-1.5">
                Слов: <strong>{report.words}</strong>
              </div>
              <div className="rounded-lg bg-canvas px-2 py-1.5">
                Абзацев: <strong>{report.paragraphs}</strong>
              </div>
              <div className="rounded-lg bg-canvas px-2 py-1.5">
                Ср. длина предл.: <strong>{report.avgSentence}</strong>
              </div>
              <div className="rounded-lg bg-canvas px-2 py-1.5">
                Разнообразие лексики: <strong>{Math.round(report.lexicalVariety * 100)}%</strong>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {report.structure.map((x, i) => (
                <li key={i} className={x.ok ? 'text-good' : 'text-warn'}>
                  {x.ok ? '✓' : '!'} {x.message}
                </li>
              ))}
            </ul>
            {report.repeated.length > 0 && <p className="mt-2 text-sm">Частые повторы: {report.repeated.map((r) => `${r.word} (${r.count})`).join(', ')} — подберите синонимы.</p>}
          </Card>
          <Card>
            <h3 className="text-[17px] font-semibold">Найденные ошибки ({report.findings.length})</h3>
            <p className="text-sm text-ink-soft">Сначала попробуйте исправить сами — подсказка указывает на правило; исправление можно открыть.</p>
            {report.findings.length === 0 ? (
              <p className="mt-2 text-sm">Правила автоматической проверки ошибок не нашли. Это не означает, что ошибок нет: автоматическая проверка охватывает только частые шаблоны.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {report.findings.map((f, i) => (
                  <li key={i} className="rounded-lg border border-line p-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="warn">{f.kind}</Badge>
                      {f.excerpt && <span className="font-mono text-bad">«{f.excerpt}»</span>}
                    </div>
                    <div className="mt-1">{f.message}</div>
                    {f.hint && <div className="text-ink-soft">Подсказка: {f.hint}</div>}
                    {f.fix &&
                      (revealed[i] ? (
                        <div className="mt-1 text-good">Исправление: {f.fix}</div>
                      ) : (
                        <button className="mt-1 text-xs text-brand underline" onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}>
                          Показать исправление
                        </button>
                      ))}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {(task === 'ielts1' || task === 'ielts2') && (
            <Card>
              <h3 className="text-[17px] font-semibold">Самопроверка по критериям IELTS</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {IELTS_SELF_CHECK[task].map((c) => (
                  <li key={c.id}>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={!!self[c.id]}
                        onChange={(e) => {
                          const next = { ...self, [c.id]: e.target.checked };
                          setSelf(next);
                          update((d) => {
                            const w = d.writings.find((x) => x.id === entryId);
                            if (w) w.selfCheck = next;
                          });
                        }}
                      />
                      <span>
                        <span className="text-ink-soft">{c.criterion}:</span> {c.text}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-soft">Без AI или преподавателя балл не выставляется: правила не могут надёжно оценить связность и аргументацию.</p>
            </Card>
          )}
          <Card>
            <h3 className="text-[17px] font-semibold">Оценка по официальным критериям</h3>
            {aiConfigured() ? (
              <>
                {!ai.res && (
                  <Button className="mt-2" icon="chat" onClick={evaluate} disabled={ai.loading}>
                    {ai.loading ? 'AI проверяет…' : 'Проверить с AI (платно)'}
                  </Button>
                )}
                {ai.error && <p className="mt-2 text-sm text-bad">{ai.error}</p>}
                {ai.res && (
                  <div className="mt-2 space-y-2 text-sm">
                    <Notice tone="warn">Предварительная оценка AI. Не является официальным результатом экзамена.</Notice>
                    {ai.res.band !== null && (
                      <div className="text-2xl font-semibold">
                        {lang === 'en' ? 'Band ' : ''}
                        {ai.res.band}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(ai.res.criteria).map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-canvas px-2 py-1.5">
                          {k}: <strong>{v}</strong>
                        </div>
                      ))}
                    </div>
                    {lang === 'en' && Object.keys(ai.res.criteria).length === 4 && <p className="text-xs text-ink-soft">Среднее по критериям: {criteriaBand(Object.values(ai.res.criteria))}</p>}
                    <p className="whitespace-pre-line">{ai.res.summary}</p>
                    <ul className="space-y-1">
                      {ai.res.errors.map((e, i) => (
                        <li key={i} className="rounded-lg border border-line p-2">
                          <span className="text-bad">«{e.quote}»</span> — {e.issue}. <span className="text-ink-soft">Подсказка: {e.hint}</span>
                        </li>
                      ))}
                    </ul>
                    {ai.res.recommendations.length > 0 && (
                      <ul className="list-disc pl-5">
                        {ai.res.recommendations.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">AI не подключён — ориентировочный балл не выставляется. Подключение: Настройки → AI-преподаватель (платный внешний сервис). Можно ввести оценку преподавателя вручную.</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span>Оценка преподавателя (вручную):</span>
              <input value={manual} onChange={(e) => setManual(e.target.value)} className="w-20 rounded-lg border border-line px-2 py-1" placeholder={lang === 'en' ? '5.5' : '%'} inputMode="decimal" />
              <Button
                size="sm"
                variant="secondary"
                disabled={!manual || Number.isNaN(Number(manual.replace(',', '.')))}
                onClick={() => {
                  update((d) => {
                    const w = d.writings.find((x) => x.id === entryId);
                    if (w) w.manualBand = { band: Number(manual.replace(',', '.')), source: 'преподаватель' };
                  });
                  setManual('');
                }}
              >
                Сохранить
              </Button>
            </div>
          </Card>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setReport(null);
                setAi({ loading: false });
                setRevealed({});
              }}
            >
              Исправить и сдать заново
            </Button>
          </div>
        </>
      )}

      {past.length > 0 && (
        <Card>
          <h3 className="text-[17px] font-semibold">Предыдущие попытки ({past.length})</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {past.slice(0, 5).map((w) => (
              <li key={w.id} className="flex justify-between gap-2">
                <span>{new Date(w.createdAt).toLocaleDateString('ru-RU')}</span>
                <span>
                  {w.words} слов · {Math.round(w.seconds / 60)} мин{w.ai?.band != null ? ` · AI: ${w.ai.band}` : ''}
                  {w.manualBand ? ` · преподаватель: ${w.manualBand.band}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
