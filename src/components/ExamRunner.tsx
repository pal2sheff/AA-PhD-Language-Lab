// Движок экзаменационных секций Reading / Listening (IELTS и КАЗТЕСТ).
// Экзаменационный режим: таймер, без подсказок и объяснений, аудио один раз.
// Учебный режим: повтор аудио, замедление, транскрипция, проверка по группам с объяснениями.
import { useEffect, useMemo, useState } from 'react';
import type { ExamQuestion, ExamTest, ListeningPart, QGroup } from '../data/exam-types';
import { questionCount } from '../data/exam-types';
import { canonical, wordCount, uid } from '../lib/text';
import { listeningBand, readingBand, extrapolateTo40 } from '../lib/scoring';
import { update } from '../lib/store';
import { markBlockDone, recordFreeMistake } from '../lib/learning';
import { speakDialogue, stopSpeaking, voiceInfo } from '../lib/speech';
import { useCountdown, useVoices } from '../lib/hooks';
import type { ExamAttempt } from '../lib/state';
import { Badge, Button, Card, Notice, cx, fmtTimer, inputCls } from './ui';
import { Icon } from './icons';

export function optionKey(g: QGroup, opt: string): string {
  if (g.type === 'tfng' || g.type === 'ynng') return opt;
  if (g.type === 'heading') return opt.split('.')[0].trim();
  return opt.trim().split(/[\s.]/)[0];
}

function wordLimitN(limit?: string): number | null {
  if (!limit) return null;
  if (/ONE WORD ONLY/i.test(limit)) return 1;
  if (/ONE WORD AND\/OR A NUMBER/i.test(limit)) return 2;
  if (/TWO WORDS/i.test(limit)) return 2;
  if (/THREE WORDS/i.test(limit)) return 3;
  return null;
}

export function isCorrect(g: QGroup, q: ExamQuestion, answer: string | undefined): boolean {
  if (!answer) return false;
  if (g.type === 'complete' || g.type === 'short') {
    const lim = wordLimitN(g.wordLimit);
    if (lim && wordCount(answer) > lim && !/^\d[\d\s]*$/.test(answer.trim())) return false;
    const a = canonical(answer).replace(/^(the|a|an) /, '');
    return q.answers.some((x) => canonical(x).replace(/^(the|a|an) /, '') === a || canonical(x).replace(/\s/g, '') === a.replace(/\s/g, ''));
  }
  return q.answers.some((x) => x.toLowerCase() === answer.toLowerCase());
}

export function ResearchCentreMap() {
  const box = (x: number, y: number, w: number, h: number, label: string, text?: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="var(--color-surface)" stroke="var(--color-ink-soft)" />
      <text x={x + w / 2} y={y + h / 2 + (text ? -4 : 5)} textAnchor="middle" fontSize={text ? 11 : 16} fontWeight={700} fill="var(--color-ink)">
        {label}
      </text>
      {text && (
        <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
          {text}
        </text>
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 300 330" className="mx-auto w-full max-w-xs" role="img" aria-label="План исследовательского центра">
      <rect x={110} y={60} width={80} height={240} fill="var(--color-canvas)" stroke="var(--color-line)" />
      <text x={150} y={185} textAnchor="middle" fontSize={10} fill="var(--color-ink-faint)" transform="rotate(-90 150 185)">
        corridor
      </text>
      {box(90, 10, 120, 45, 'C')}
      {box(10, 10, 75, 60, 'G')}
      {box(215, 10, 75, 60, 'F')}
      {box(10, 150, 95, 70, 'B')}
      {box(10, 228, 95, 70, 'A')}
      {box(195, 150, 95, 70, 'E')}
      {box(195, 228, 95, 70, 'D')}
      {box(125, 240, 50, 40, 'Rec.', 'reception')}
      <path d="M135 322 L150 305 L165 322" fill="none" stroke="var(--color-brand)" strokeWidth={2} />
      <text x={150} y={300} textAnchor="middle" fontSize={10} fill="var(--color-brand)">
        Main entrance
      </text>
    </svg>
  );
}

type Answers = Record<number, string>;

export function ExamRunner({ test, mode, onExit }: { test: ExamTest; mode: 'exam' | 'training'; onExit: () => void }) {
  useVoices();
  const [answers, setAnswers] = useState<Answers>({});
  const [part, setPart] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState<ExamAttempt | null>(null);
  const [checkedGroups, setCheckedGroups] = useState<Record<string, boolean>>({});
  const [played, setPlayed] = useState<Record<number, boolean>>({});
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [startedAt] = useState(Date.now());
  const total = questionCount(test);
  const isListening = test.section === 'listening';
  const units = isListening ? test.parts! : test.passages!;
  const left = useCountdown(test.minutes * 60, started && !finished && mode === 'exam', () => finish());
  const vi = voiceInfo(test.lang);

  useEffect(() => () => stopSpeaking(), []);

  const allGroups = useMemo(() => units.flatMap((u) => u.groups), [units]);

  function finish() {
    stopSpeaking();
    let correct = 0;
    for (const g of allGroups)
      for (const q of g.questions) {
        const ok = isCorrect(g, q, answers[q.n]);
        if (ok) correct++;
        else
          recordFreeMistake({
            key: `${test.id}-q${q.n}`,
            lang: test.lang,
            category: isListening ? 'listening' : 'reading',
            topic: `${test.lang}.${isListening ? 'listening' : 'reading'}-detail`,
            prompt: `${test.title}, вопрос ${q.n}: ${q.prompt}`,
            userAnswer: answers[q.n] ?? '—',
            correct: q.answers[0],
            explain: q.explain,
          });
      }
    let band: number | null = null;
    if (test.exam === 'ielts' && test.fullFormat && total === 40) band = isListening ? listeningBand(correct) : readingBand(correct);
    const attempt: ExamAttempt = {
      id: uid('ex'),
      exam: test.exam,
      section: test.section,
      testId: test.id,
      mode,
      startedAt,
      finishedAt: Date.now(),
      correct,
      total,
      fullFormat: test.fullFormat && (test.exam !== 'ielts' || total === 40),
      band,
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
    };
    update((d) => {
      d.exams.push(attempt);
    });
    markBlockDone(mode === 'exam' ? 'mock' : test.section, test.lang);
    markBlockDone(test.section, test.lang);
    setFinished(attempt);
    window.scrollTo(0, 0);
  }

  if (!started) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">{test.title}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={mode === 'exam' ? 'warn' : 'brand'}>{mode === 'exam' ? 'Экзаменационный режим' : 'Учебный режим'}</Badge>
          <Badge>{total} вопросов</Badge>
          <Badge>{test.minutes} мин</Badge>
          {!test.fullFormat && <Badge tone="warn">неполный формат</Badge>}
        </div>
        <p className="mt-3 text-sm">{test.formatNote}</p>
        {mode === 'exam' ? (
          <Notice tone="info">Таймер, без подсказок и объяснений. {isListening ? 'Каждая часть воспроизводится один раз. ' : ''}Результаты и разбор — после завершения.</Notice>
        ) : (
          <Notice tone="info">Можно {isListening ? 'слушать повторно, замедлять, открывать транскрипцию и ' : ''}проверять ответы по группам с объяснениями.</Notice>
        )}
        {isListening && !vi.ok && <Notice tone="warn">{vi.note}</Notice>}
        {isListening && vi.ok && <p className="mt-2 text-xs text-ink-soft">Озвучка: {vi.voiceName}. Разные реплики озвучиваются разными голосами устройства, если они есть. Это синтезированная речь, а не запись с британским, американским или австралийским акцентом.</p>}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onExit}>
            Назад
          </Button>
          <Button onClick={() => setStarted(true)} icon="play">
            Начать
          </Button>
        </div>
      </Card>
    );
  }

  if (finished) return <ExamResult test={test} attempt={finished} answers={answers} onExit={onExit} />;

  const unit = units[part];
  const playPart = () => {
    const lines = (unit as ListeningPart).lines;
    setPlaying(true);
    const ok = speakDialogue(lines.map((l) => ({ speaker: l.speaker, text: l.text })), test.lang, undefined, () => setPlaying(false));
    if (!ok) setPlaying(false);
    setPlayed((p) => ({ ...p, [part]: true }));
  };

  const answered = Object.values(answers).filter((v) => v && v.trim()).length;

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-2 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur">
        <div className="text-sm">
          <strong>{isListening ? (unit as { title: string }).title : `Text ${part + 1}`}</strong> · отвечено {answered}/{total}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'exam' && (
            <span className={cx('rounded-lg px-2 py-1 font-mono text-sm tabular-nums', left < 300 ? 'bg-bad-soft text-bad' : 'bg-surface')}>
              <Icon name="clock" size={14} className="mr-1 inline" />
              {fmtTimer(left)}
            </span>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm('Завершить и посмотреть результат?')) finish();
            }}
          >
            Завершить
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {units.map((u, i) => (
          <button key={i} onClick={() => setPart(i)} className={cx('rounded-full border px-3 py-1 text-sm whitespace-nowrap', i === part ? 'border-ink bg-ink text-white' : 'border-line bg-surface')}>
            {isListening ? (u as { title: string }).title : `Text ${i + 1}`}
          </button>
        ))}
      </div>

      {isListening ? (
        <Card>
          <div className="text-sm text-ink-soft">{(unit as { context: string }).context}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {mode === 'exam' ? (
              <Button icon={playing ? 'stop' : 'play'} onClick={playing ? () => (stopSpeaking(), setPlaying(false)) : playPart} disabled={(played[part] && !playing) || !vi.ok}>
                {playing ? 'Идёт воспроизведение…' : played[part] ? 'Прослушано' : 'Воспроизвести (один раз)'}
              </Button>
            ) : (
              <>
                <Button icon={playing ? 'stop' : 'play'} onClick={playing ? () => (stopSpeaking(), setPlaying(false)) : playPart} disabled={!vi.ok}>
                  {playing ? 'Стоп' : 'Слушать'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!vi.ok || playing}
                  onClick={() => {
                    setPlaying(true);
                    speakDialogue((unit as { lines: { speaker: number; text: string }[] }).lines, test.lang, 0.7, () => setPlaying(false));
                  }}
                >
                  Медленно
                </Button>
                <Button variant="ghost" onClick={() => setShowScript((v) => !v)}>
                  {showScript ? 'Скрыть транскрипцию' : 'Транскрипция'}
                </Button>
              </>
            )}
          </div>
          {!vi.ok && (
            <div className="mt-2">
              <Notice tone="warn">Голос недоступен. В учебном режиме можно открыть транскрипцию (это будет тренировка чтения).</Notice>
            </div>
          )}
          {(showScript || (!vi.ok && mode === 'training')) && (
            <div className="mt-3 space-y-1 rounded-xl bg-canvas p-3 text-sm" lang={test.lang}>
              {(unit as { lines: { name: string; text: string }[] }).lines.map((l, i) => (
                <p key={i}>
                  <strong>{l.name}:</strong> {l.text}
                </p>
              ))}
            </div>
          )}
          {(unit as { map?: string }).map === 'research-centre' && (
            <div className="mt-3">
              <ResearchCentreMap />
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <h3 className="text-lg font-semibold" lang={test.lang}>
            {(unit as { title: string }).title}
          </h3>
          <div className="mt-2 max-h-[55vh] space-y-3 overflow-y-auto pr-1 leading-relaxed" lang={test.lang}>
            {(unit as { paragraphs: { label?: string; text: string }[] }).paragraphs.map((p, i) => (
              <p key={i}>
                {p.label && <strong className="mr-1.5">{p.label}</strong>}
                {p.text}
              </p>
            ))}
          </div>
        </Card>
      )}

      {unit.groups.map((g) => (
        <GroupBlock
          key={g.title}
          g={g}
          answers={answers}
          setAnswer={(n, v) => setAnswers((a) => ({ ...a, [n]: v }))}
          checked={!!checkedGroups[g.title]}
          training={mode === 'training'}
          onCheck={() => setCheckedGroups((c) => ({ ...c, [g.title]: true }))}
          lang={test.lang}
        />
      ))}

      <div className="flex justify-between">
        <Button variant="secondary" disabled={part === 0} onClick={() => setPart(part - 1)}>
          Назад
        </Button>
        {part + 1 < units.length ? (
          <Button onClick={() => (setPart(part + 1), window.scrollTo(0, 0))}>Далее</Button>
        ) : (
          <Button variant="good" onClick={finish}>
            Завершить и проверить
          </Button>
        )}
      </div>
    </div>
  );
}

function GroupBlock({
  g,
  answers,
  setAnswer,
  checked,
  training,
  onCheck,
  lang,
}: {
  g: QGroup;
  answers: Answers;
  setAnswer: (n: number, v: string) => void;
  checked: boolean;
  training: boolean;
  onCheck: () => void;
  lang: 'en' | 'kk';
}) {
  const [showRu, setShowRu] = useState(false);
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{g.title}</h4>
          <p className="text-sm text-ink-soft">{g.instructions}</p>
          {g.wordLimit && <p className="mt-1 text-xs font-medium text-warn">{g.wordLimit}</p>}
        </div>
        {training && lang === 'kk' && (
          <button className="shrink-0 text-xs text-brand underline" onClick={() => setShowRu((v) => !v)}>
            {showRu ? 'скрыть перевод' : 'перевод'}
          </button>
        )}
      </div>
      {g.type === 'heading' && g.options && (
        <ul className="mt-2 rounded-xl bg-canvas p-3 text-sm">
          {g.options.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 space-y-4">
        {g.questions.map((q) => {
          const ans = answers[q.n];
          const ok = checked ? isCorrect(g, q, ans) : null;
          const opts = q.options ?? g.options ?? [];
          return (
            <div key={q.n} className={cx('rounded-xl border p-3', ok === true ? 'border-good/40 bg-good-soft' : ok === false ? 'border-bad/30 bg-bad-soft' : 'border-line')}>
              <div className="flex gap-2">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-ink px-1 text-xs font-semibold text-white">{q.n}</span>
                <div className="min-w-0 flex-1">
                  <div lang={lang}>{q.prompt}</div>
                  {showRu && q.ru && <div className="text-sm text-ink-soft">{q.ru}</div>}
                </div>
              </div>
              <div className="mt-2">
                {g.type === 'complete' || g.type === 'short' ? (
                  <input value={ans ?? ''} disabled={checked} onChange={(e) => setAnswer(q.n, e.target.value)} className={inputCls} autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label={`Ответ ${q.n}`} />
                ) : g.type === 'heading' || g.type === 'map' || (g.type === 'match' && opts.length > 4) ? (
                  <select value={ans ?? ''} disabled={checked} onChange={(e) => setAnswer(q.n, e.target.value)} className={inputCls} aria-label={`Ответ ${q.n}`}>
                    <option value="">— выберите —</option>
                    {opts.map((o) => (
                      <option key={o} value={optionKey(g, o)}>
                        {g.type === 'heading' ? optionKey(g, o) : o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid gap-1.5">
                    {opts.map((o) => {
                      const k = optionKey(g, o);
                      return (
                        <button key={o} disabled={checked} onClick={() => setAnswer(q.n, k)} className={cx('min-h-11 rounded-lg border px-3 py-2 text-left text-sm', ans === k ? 'border-brand bg-brand-soft font-medium' : 'border-line bg-surface hover:bg-canvas')} lang={lang}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {checked && (
                <div className="mt-2 text-sm">
                  {!ok && (
                    <div>
                      Правильный ответ: <strong>{q.answers[0]}</strong>
                    </div>
                  )}
                  <div className="text-ink-soft">{q.explain}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {training && !checked && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="secondary" onClick={onCheck}>
            Проверить эту группу
          </Button>
        </div>
      )}
    </Card>
  );
}

function ExamResult({ test, attempt, answers, onExit }: { test: ExamTest; attempt: ExamAttempt; answers: Answers; onExit: () => void }) {
  const units = test.section === 'listening' ? test.parts! : test.passages!;
  const pct = Math.round((attempt.correct / Math.max(1, attempt.total)) * 100);
  const extrap = test.exam === 'ielts' && !attempt.band ? extrapolateTo40(attempt.correct, attempt.total) : null;
  return (
    <div className="space-y-4">
      <Card tone={pct >= 60 ? 'good' : pct >= 40 ? 'warn' : 'bad'}>
        <h2 className="text-lg font-semibold">{test.title}: результат</h2>
        <div className="mt-2 flex flex-wrap items-end gap-6">
          <div>
            <div className="text-3xl font-semibold">
              {attempt.correct}/{attempt.total}
            </div>
            <div className="text-sm text-ink-soft">{pct}% верных</div>
          </div>
          {attempt.band !== null && (
            <div>
              <div className="text-3xl font-semibold">{attempt.band.toFixed(1)}</div>
              <div className="text-sm text-ink-soft">ориентировочный band ({test.section === 'listening' ? 'Listening' : 'Academic Reading'})</div>
            </div>
          )}
        </div>
        {attempt.band !== null && <p className="mt-2 text-xs text-ink-soft">Перевод по ориентировочной таблице IELTS. Реальная граница может немного отличаться для разных версий теста.</p>}
        {extrap !== null && <p className="mt-2 text-sm">Band не рассчитывается: тест неполного формата. Грубая экстраполяция: ≈ {extrap}/40 (низкая точность).</p>}
        {test.exam === 'kaztest' && <p className="mt-2 text-sm">Учебная оценка в процентах. Баллы по официальной шкале КАЗТЕСТ не рассчитываются без официальных порогов и шкал.</p>}
        {attempt.mode === 'training' && <p className="mt-2 text-xs text-ink-soft">Учебный режим (с подсказками) — результат в статистике отмечен как тренировочный.</p>}
      </Card>
      <Card>
        <h3 className="font-semibold">Разбор ответов</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {units.flatMap((u) =>
            u.groups.flatMap((g) =>
              g.questions.map((q) => {
                const ok = isCorrect(g, q, answers[q.n]);
                return (
                  <li key={q.n} className={cx('rounded-lg p-2.5', ok ? 'bg-good-soft' : 'bg-bad-soft')}>
                    <div className="font-medium">
                      {q.n}. {q.prompt}
                    </div>
                    <div>
                      Ваш ответ: {answers[q.n] || '—'} {ok ? '✓' : `· правильно: ${q.answers[0]}`}
                    </div>
                    <div className="text-ink-soft">{q.explain}</div>
                  </li>
                );
              }),
            ),
          )}
        </ul>
      </Card>
      {test.section === 'listening' && (
        <Card>
          <h3 className="font-semibold">Транскрипция</h3>
          <div className="mt-2 space-y-3 text-sm" lang={test.lang}>
            {test.parts!.map((p) => (
              <div key={p.title}>
                <div className="font-medium">{p.title}</div>
                {p.lines.map((l, i) => (
                  <p key={i}>
                    <strong>{l.name}:</strong> {l.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" href="/mistakes">
          Мои ошибки
        </Button>
        <Button onClick={onExit}>Готово</Button>
      </div>
    </div>
  );
}
