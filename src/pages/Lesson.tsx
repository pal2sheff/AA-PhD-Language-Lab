import { useEffect, useMemo, useRef, useState } from 'react';
import { getLesson, lessonsFor } from '../data';
import type { Lesson, TheoryBlock } from '../data/types';
import { useAppState } from '../lib/store';
import { addVocab, finishLesson, PASS_THRESHOLD, setLessonStep, startLesson } from '../lib/learning';
import { useStudyTimer } from '../lib/hooks';
import { navigate } from '../lib/router';
import { ExerciseRunner, type ExerciseResult } from '../components/ExerciseRunner';
import { SpeakButton, VoiceLabel } from '../components/Audio';
import { MicNotice, ShadowItem } from '../components/Shadow';
import { Badge, Button, Card, Modal, Notice, PageHeader, Progress, Rich, cx } from '../components/ui';
import { Icon } from '../components/icons';
import { aiCall, aiConfigured, learnerContext } from '../lib/ai';

const STEPS = ['Цель', 'Теория', 'Примеры', 'Ошибки', 'Разминка', 'Упражнения', 'Слушаем и говорим', 'Контроль', 'Итог'];

export function Theory({ blocks }: { blocks: TheoryBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.type === 'p')
          return (
            <p key={i} className="leading-relaxed">
              <Rich text={b.text} />
            </p>
          );
        if (b.type === 'tip')
          return (
            <Notice key={i} tone="info">
              <Rich text={b.text} />
            </Notice>
          );
        if (b.type === 'formula')
          return (
            <div key={i} className="rounded-xl border border-brand/20 bg-brand-soft px-4 py-3">
              <div className="font-mono text-[15px] font-medium text-brand-ink">{b.text}</div>
              {b.note && <div className="mt-1 text-sm text-ink-soft">{b.note}</div>}
            </div>
          );
        return (
          <div key={i} className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  {b.head.map((h) => (
                    <th key={h} className="border-b border-line px-2 py-2 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, k) => (
                  <tr key={k} className="odd:bg-canvas">
                    {r.map((c, j) => (
                      <td key={j} className="border-b border-line px-2 py-2 align-top">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export function LessonPage({ id }: { id: string }) {
  const lesson = getLesson(id);
  if (!lesson) {
    return (
      <div>
        <PageHeader title="Урок не найден" back="/today" />
        <Notice tone="warn">Такого урока нет. Вернитесь к плану занятий.</Notice>
      </div>
    );
  }
  return <LessonPlayer key={id} lesson={lesson} />;
}

function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const s = useAppState();
  const progress = s.lessons[lesson.id];
  const [step, setStep] = useState(() => (progress && !progress.completedAt ? Math.min(progress.step, STEPS.length - 2) : 0));
  const [rule, setRule] = useState(false);
  const [simple, setSimple] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [results, setResults] = useState<Record<string, ExerciseResult[]>>({});
  const [listened, setListened] = useState(false);
  const [showText, setShowText] = useState(false);
  const [vocabMsg, setVocabMsg] = useState('');
  const [aiSimple, setAiSimple] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });
  const topRef = useRef<HTMLDivElement>(null);
  useStudyTimer(lesson.lang);

  useEffect(() => {
    startLesson(lesson.id);
  }, [lesson.id]);

  const go = (n: number) => {
    setStep(n);
    setLessonStep(lesson.id, n);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const control = results.control ?? [];
  const controlScore = control.length ? control.filter((r) => r.correct).length / control.length : 0;
  const allWrong = Object.values(results)
    .flat()
    .filter((r) => !r.correct);
  const list = lessonsFor(lesson.lang);
  const nextLessonObj = list[list.findIndex((l) => l.id === lesson.id) + 1];
  const isKk = lesson.lang === 'kk';

  const sharedListening = useMemo(() => lesson.listening.text, [lesson]);

  return (
    <div ref={topRef} className="space-y-4">
      <PageHeader
        title={lesson.title}
        back={isKk ? '/kk' : '/en'}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={isKk ? 'kk' : 'brand'}>{isKk ? 'Казахский' : 'Английский'}</Badge>
            <Badge>{lesson.level}</Badge>
            <span>≈ {lesson.minutes} мин</span>
            {progress?.passed && <Badge tone="good">пройден · {Math.round(progress.bestControl * 100)}%</Badge>}
          </span>
        }
      />

      <div>
        <div className="mb-1.5 flex justify-between text-xs text-ink-soft">
          <span>
            Шаг {step + 1} из {STEPS.length}: {STEPS[step]}
          </span>
          <button className="text-brand" onClick={() => go(1)}>
            Вернуться к теме
          </button>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} tone={isKk ? 'kk' : 'brand'} />
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((n, i) => (
            <button key={n} onClick={() => go(i)} className={cx('rounded-full px-2.5 py-1 text-xs whitespace-nowrap', i === step ? 'bg-ink text-white' : 'bg-surface text-ink-soft border border-line')}>
              {i + 1}. {n}
            </button>
          ))}
        </div>
      </div>

      {step === 0 && (
        <Card>
          <h2 className="text-lg font-semibold">Цель занятия</h2>
          <p className="mt-1">{lesson.goal}</p>
          <div className="mt-3 text-sm font-medium text-ink-soft">После урока вы сможете:</div>
          <ul className="mt-1 space-y-1">
            {lesson.outcomes.map((o) => (
              <li key={o} className="flex gap-2">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-good" />
                {o}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            Урок считается освоенным при результате контроля не ниже {Math.round(PASS_THRESHOLD * 100)}%. Если результат ниже — можно продолжать программу, а тема попадёт в повторение.
          </p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => go(1)} icon="chevronRight">
              К теории
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Объяснение</h2>
          <Theory blocks={lesson.theory} />
          {lesson.morph && (
            <div className="mt-4">
              <h3 className="font-semibold">Морфологический разбор</h3>
              <div className="mt-2 space-y-2">
                {lesson.morph.map((m) => (
                  <div key={m.word} className="rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold" lang="kk">
                        {m.word}
                      </span>
                      <span className="text-sm text-ink-soft">— {m.ru}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.parts.map((p, i) => (
                        <div key={i} className="rounded-lg bg-kk-soft px-2 py-1 text-sm">
                          <span className="font-mono font-semibold text-kk">{p.part}</span>
                          <span className="ml-1 text-ink-soft">{p.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon="lightbulb" onClick={() => setSimple((v) => !v)}>
              Объясни проще
            </Button>
          </div>
          {simple && (
            <div className="mt-3 rounded-xl bg-canvas p-3">
              <p>{lesson.simple}</p>
              {aiConfigured() && (
                <div className="mt-2">
                  {!aiSimple.text && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="chat"
                      disabled={aiSimple.loading}
                      onClick={async () => {
                        setAiSimple({ loading: true });
                        try {
                          const text = await aiCall({ task: 'explain', lang: lesson.lang, messages: [{ role: 'user', content: `Объясни ещё проще, на бытовых примерах из жизни врача, тему «${lesson.title}». Исходное объяснение: ${lesson.simple}` }], context: learnerContext(lesson.lang) });
                          setAiSimple({ loading: false, text });
                        } catch (e) {
                          setAiSimple({ loading: false, error: (e as Error).message });
                        }
                      }}
                    >
                      {aiSimple.loading ? 'AI думает…' : 'Ещё проще от AI-преподавателя'}
                    </Button>
                  )}
                  {aiSimple.text && <p className="mt-2 whitespace-pre-line">{aiSimple.text}</p>}
                  {aiSimple.error && <p className="mt-2 text-sm text-bad">{aiSimple.error}</p>}
                </div>
              )}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={() => go(2)} icon="chevronRight">
              К примерам
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Примеры с переводом</h2>
          <ul className="space-y-2">
            {[...lesson.examples, ...lesson.extraExamples.slice(0, exampleIdx)].map((e, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-line p-3">
                <SpeakButton text={e.t} lang={lesson.lang} compact allowReveal={false} />
                <div>
                  <div className="font-medium" lang={lesson.lang}>
                    {e.t}
                  </div>
                  <div className="text-sm text-ink-soft">{e.ru}</div>
                  {e.note && <div className="text-xs text-ink-faint">{e.note}</div>}
                </div>
              </li>
            ))}
          </ul>
          <VoiceLabel lang={lesson.lang} />
          <div className="mt-3 flex flex-wrap justify-between gap-2">
            <Button variant="secondary" size="sm" icon="plus" disabled={exampleIdx >= lesson.extraExamples.length} onClick={() => setExampleIdx((n) => n + 1)}>
              {exampleIdx >= lesson.extraExamples.length ? 'Все примеры показаны' : 'Покажи пример'}
            </Button>
            <Button onClick={() => go(3)} icon="chevronRight">
              Типичные ошибки
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Разбор типичных ошибок</h2>
          <ul className="space-y-2">
            {lesson.pitfalls.map((p, i) => (
              <li key={i} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-bad line-through">{p.wrong}</span>
                  <Icon name="chevronRight" size={16} className="text-ink-faint" />
                  <span className="font-medium text-good">{p.right}</span>
                </div>
                <div className="mt-1 text-sm text-ink-soft">{p.why}</div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => go(4)} icon="chevronRight">
              К разминке
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <ExerciseRunner title="Разминка" exercises={lesson.warmup} lang={lesson.lang} category={lesson.category} onShowRule={() => setRule(true)} onDone={(r) => {
          setResults((x) => ({ ...x, warmup: r }));
          go(5);
        }} />
      )}

      {step === 5 && (
        <ExerciseRunner title="Упражнение" exercises={lesson.practice} lang={lesson.lang} category={lesson.category} onShowRule={() => setRule(true)} onDone={(r) => {
          setResults((x) => ({ ...x, practice: r }));
          go(6);
        }} />
      )}

      {step === 6 && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold">Аудирование: {lesson.listening.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">Прослушайте текст (можно несколько раз), затем ответьте на вопросы. Текст можно открыть после первой попытки.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SpeakButton text={lesson.listening.text} lang={lesson.lang} onPlayed={() => setListened(true)} />
              <SpeakButton text={lesson.listening.text} lang={lesson.lang} label="Медленно" rate={0.7} onPlayed={() => setListened(true)} allowReveal={false} />
            </div>
            <VoiceLabel lang={lesson.lang} />
            {(showText || results.listening) && (
              <div className="mt-3 rounded-xl bg-canvas p-3">
                <p lang={lesson.lang} className="font-medium">
                  {lesson.listening.text}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{lesson.listening.ru}</p>
              </div>
            )}
            {!showText && !results.listening && (
              <button className="mt-2 text-sm text-brand underline" onClick={() => setShowText(true)}>
                Показать транскрипцию
              </button>
            )}
          </Card>
          {!results.listening ? (
            listened || showText ? (
              <ExerciseRunner title="Вопрос" exercises={lesson.listening.questions} lang={lesson.lang} category="listening" sharedAudio={sharedListening} allowMore={false} onDone={(r) => setResults((x) => ({ ...x, listening: r }))} />
            ) : (
              <Notice tone="info">Нажмите «Прослушать», чтобы открыть вопросы.</Notice>
            )
          ) : (
            <Notice tone="good">Аудирование выполнено: {results.listening.filter((r) => r.correct).length} из {results.listening.length} верно.</Notice>
          )}
          <Card>
            <h2 className="text-lg font-semibold">Повторите за диктором</h2>
            <MicNotice />
            <div className="mt-3 space-y-2">
              {lesson.shadow.map((x) => (
                <ShadowItem key={x.t} text={x.t} ru={x.ru} lang={lesson.lang} />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => go(7)} icon="chevronRight">
                К контролю
              </Button>
            </div>
          </Card>
        </div>
      )}

      {step === 7 &&
        (results.control ? (
          <Card>
            <h2 className="text-lg font-semibold">Контроль выполнен</h2>
            <p>
              Результат: {control.filter((r) => r.correct).length} из {control.length} ({Math.round(controlScore * 100)}%).
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => setResults((x) => ({ ...x, control: undefined as unknown as ExerciseResult[] }))}>
                Пройти контроль заново
              </Button>
              <Button onClick={() => go(8)}>К итогам</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <Notice tone="info">Контроль усвоения: новые задания по теме. Подсказки скрыты, объяснения появятся после ответа.</Notice>
            <ExerciseRunner
              title="Контроль"
              exercises={lesson.control}
              lang={lesson.lang}
              category={lesson.category}
              allowMore={false}
              onDone={(r) => {
                const score = r.length ? r.filter((x) => x.correct).length / r.length : 0;
                setResults((x) => ({ ...x, control: r }));
                finishLesson(lesson.id, lesson.lang, score);
                go(8);
              }}
            />
          </div>
        ))}

      {step === 8 && (
        <div className="space-y-4">
          <Card tone={controlScore >= PASS_THRESHOLD ? 'good' : results.control ? 'warn' : undefined}>
            <h2 className="text-lg font-semibold">Итог урока</h2>
            {results.control ? (
              <p className="mt-1">
                Контроль: {Math.round(controlScore * 100)}%.{' '}
                {controlScore >= PASS_THRESHOLD ? 'Тема освоена — переходите к следующей.' : 'Тема пока не освоена: она добавлена в повторение и появится в плане. Можно продолжать программу.'}
              </p>
            ) : (
              <p className="mt-1">Контроль ещё не пройден.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-semibold">Что изучено</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {lesson.summary.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Card>
          {allWrong.length > 0 && (
            <Card>
              <h3 className="font-semibold">Ваши ошибки в этом уроке ({allWrong.length})</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {allWrong.map((r, i) => (
                  <li key={i} className="rounded-lg bg-canvas p-2.5">
                    <div>
                      Ваш ответ: <span className="text-bad">{r.answer}</span>
                    </div>
                    <div className="text-ink-soft">{r.ex.explain}</div>
                  </li>
                ))}
              </ul>
              <Button className="mt-3" variant="secondary" size="sm" href={`/mistakes/review/${lesson.lang}`}>
                Повторить мои ошибки
              </Button>
            </Card>
          )}
          <Card>
            <h3 className="font-semibold">Слова урока</h3>
            <ul className="mt-2 divide-y divide-line">
              {lesson.vocab.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <span className="font-medium" lang={lesson.lang}>
                      {w.word}
                    </span>{' '}
                    <span className="text-ink-soft">— {w.tr}</span>
                    {w.pron && <span className="ml-1 text-xs text-ink-faint">{w.pron}</span>}
                  </div>
                  {s.vocab[w.id] ? <Badge tone="good">в словаре</Badge> : <SpeakButton text={w.word} lang={lesson.lang} compact allowReveal={false} />}
                </li>
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              icon="plus"
              variant="secondary"
              onClick={() => {
                const n = addVocab(lesson.vocab, `Урок: ${lesson.title}`);
                setVocabMsg(n ? `Добавлено слов: ${n}. Повторение по FSRS — в разделе «Словарь».` : 'Все слова урока уже в словаре.');
              }}
            >
              Добавить в словарь
            </Button>
            {vocabMsg && <p className="mt-2 text-sm text-ink-soft">{vocabMsg}</p>}
          </Card>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => go(1)}>
              Вернуться к теме
            </Button>
            {nextLessonObj && <Button variant="secondary" href={`/lesson/${nextLessonObj.id}`}>Следующий урок</Button>}
            <Button onClick={() => navigate('/today')}>К плану на сегодня</Button>
          </div>
        </div>
      )}

      <Modal open={rule} onClose={() => setRule(false)} title={`Правило: ${lesson.title}`}>
        <p className="mb-3 rounded-xl bg-canvas p-3">{lesson.simple}</p>
        <Theory blocks={lesson.theory} />
      </Modal>
    </div>
  );
}
