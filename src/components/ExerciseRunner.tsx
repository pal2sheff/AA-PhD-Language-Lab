// Универсальный тренажёр упражнений: выбор ответа, пропуск, порядок слов, перевод, аудирование.
// После проверки всегда объясняет, почему ответ верный или неверный.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, Lang, MistakeCategory } from '../data/types';
import { matchAnswer, shuffle, canonical } from '../lib/text';
import { recordAnswer, correctAnswerText, dropMistakeByKey } from '../lib/learning';
import { exercisesForTopic, lessonForTopic } from '../data';
import { aiCall, aiConfigured, learnerContext } from '../lib/ai';
import { useAppState } from '../lib/store';
import { SpeakButton } from './Audio';
import { Icon } from './icons';
import { ActionBar, Badge, Button, Notice, Rich, cx, inputCls } from './ui';
import { topicName } from '../data/curriculum';

export interface ExerciseResult {
  ex: Exercise;
  correct: boolean;
  answer: string;
}

interface Props {
  exercises: Exercise[];
  lang: Lang;
  category?: MistakeCategory;
  onDone: (results: ExerciseResult[]) => void;
  onShowRule?: () => void;
  /** Без записи в статистику (например, при демонстрации). */
  noRecord?: boolean;
  /** Аудиотекст для вопросов на понимание общего текста (listen без say). */
  sharedAudio?: string;
  title?: string;
  allowMore?: boolean;
}

function isOrderedOptions(opts: string[]) {
  return opts.some((o) => /not given/i.test(o)) || opts.every((o) => /^[\d:.,%\s]+$/.test(o)) || opts.join() === 'True,False' || opts.join() === 'да,нет' || opts.join() === 'твёрдое,мягкое';
}

export function ExerciseRunner({ exercises, lang, category = 'grammar', onDone, onShowRule, noRecord, sharedAudio, title, allowMore = true }: Props) {
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const ex = queue[i];

  useEffect(() => {
    setQueue(exercises);
    setI(0);
    setResults([]);
  }, [exercises]);

  if (!ex) return null;

  const addMore = () => {
    const used = new Set(queue.map((q) => q.id));
    const pool = exercisesForTopic(ex.topic).filter((e) => !used.has(e.id) && (e.type !== 'listen' || e.say));
    if (!pool.length) return false;
    setQueue((q) => [...q.slice(0, i + 1), pool[0], ...q.slice(i + 1)]);
    return true;
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-sm font-semibold text-ink-soft tabular-nums">
          {title ?? 'Упражнение'} {i + 1} из {queue.length}
        </span>
        <Badge tone={lang === 'kk' ? 'kk' : 'brand'}>{topicName(ex.topic)}</Badge>
      </div>
      <div className="mb-4 flex gap-1" aria-hidden="true">
        {queue.map((q, k) => {
          const r = results.find((x) => x.ex.id === q.id);
          return <span key={k} className={cx('h-1.5 flex-1 rounded-full', r ? (r.correct ? 'bg-good' : 'bg-bad') : k === i ? (lang === 'kk' ? 'bg-kk' : 'bg-brand') : 'bg-line')} />;
        })}
      </div>
      <ExerciseCard
        key={ex.id + i}
        ex={ex}
        lang={lang}
        sharedAudio={sharedAudio}
        onShowRule={onShowRule}
        onMore={allowMore ? addMore : undefined}
        onAnswered={(correct, answer, self) => {
          if (self) {
            // Пользователь уверен, что его перевод верен: убираем ошибку, результат засчитываем.
            if (!noRecord) dropMistakeByKey(ex.id);
            setResults((r) => r.map((x) => (x.ex.id === ex.id ? { ...x, correct: true, answer } : x)));
            return;
          }
          if (!noRecord) recordAnswer(ex, lang, correct, answer, category);
          setResults((r) => [...r, { ex, correct, answer }]);
        }}
        onNext={() => {
          if (i + 1 < queue.length) setI(i + 1);
          else onDone(results);
        }}
        isLast={i + 1 >= queue.length}
      />
    </div>
  );
}

function ExerciseCard({
  ex,
  lang,
  onAnswered,
  onNext,
  onShowRule,
  onMore,
  isLast,
  sharedAudio,
}: {
  ex: Exercise;
  lang: Lang;
  onAnswered: (correct: boolean, answer: string, self?: boolean) => void;
  onNext: () => void;
  onShowRule?: () => void;
  onMore?: () => boolean;
  isLast: boolean;
  sharedAudio?: string;
}) {
  const state = useAppState();
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState<null | { correct: boolean; typo: boolean; answer: string }>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [moreMsg, setMoreMsg] = useState('');
  const [ai, setAi] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });
  const [selfAccepted, setSelfAccepted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = ex.type === 'mcq' ? ex.options : ex.type === 'listen' && ex.mode === 'mcq' ? ex.options! : null;
  const correctIdx = ex.type === 'mcq' ? ex.answer : ex.type === 'listen' ? ex.answer : undefined;
  const order = useMemo(() => {
    if (!options) return [];
    const idx = options.map((_, k) => k);
    return isOrderedOptions(options) ? idx : shuffle(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);
  const words = useMemo(() => (ex.type === 'order' ? shuffle(ex.words.map((_, k) => k)) : []), [ex]);

  useEffect(() => {
    if (ex.type === 'gap' || ex.type === 'translate' || (ex.type === 'listen' && ex.mode === 'type')) {
      // не фокусируемся автоматически на телефонах, чтобы клавиатура не закрывала задание
      if (window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus();
    }
  }, [ex]);

  const check = () => {
    if (checked) return;
    let correct = false;
    let typo = false;
    let answer = '';
    if (options) {
      if (picked === null) return;
      answer = options[picked];
      correct = picked === correctIdx;
    } else if (ex.type === 'order') {
      answer = built.map((k) => ex.words[k]).join(' ');
      correct = ex.answers.some((a) => canonical(a) === canonical(answer));
    } else {
      answer = value.trim();
      if (!answer) return;
      const accepted = ex.type === 'listen' ? ex.answers! : ex.type === 'mcq' ? [] : ex.answers;
      const m = matchAnswer(answer, accepted);
      correct = m.result !== 'wrong';
      typo = m.result === 'typo';
    }
    setChecked({ correct, typo, answer });
    onAnswered(correct, answer);
  };

  const askAi = async () => {
    setAi({ loading: true });
    try {
      const text = await aiCall({
        task: 'explain',
        lang,
        messages: [
          {
            role: 'user',
            content: `Задание: ${ex.type === 'translate' ? `перевести «${ex.source}»` : ex.type === 'order' ? `составить предложение из слов: ${ex.words.join(', ')}` : 'prompt' in ex ? ex.prompt : ''}\nМой ответ: ${checked?.answer}\nПравильный ответ: ${correctAnswerText(ex)}\nКраткое правило: ${ex.explain}\nОбъясни мою ошибку простыми словами по-русски, покажи, как думать в следующий раз, и дай 2 коротких примера.`,
          },
        ],
        context: learnerContext(lang),
      });
      setAi({ loading: false, text });
    } catch (e) {
      setAi({ loading: false, error: String((e as Error).message) });
    }
  };

  const lesson = lessonForTopic(ex.topic);
  const relatedPitfalls = lesson?.pitfalls.slice(0, 2) ?? [];
  const wrongWhy = options && picked !== null && ex.type === 'mcq' && picked !== ex.answer ? ex.optionWhy?.[picked] : undefined;
  const audioText = ex.type === 'listen' ? ex.say || sharedAudio || '' : '';
  const promptText = ex.type === 'translate' ? ex.source : ex.type === 'order' ? ex.ru ?? 'Составьте предложение из слов' : ex.prompt;

  const canCheck = !((options && picked === null) || (ex.type === 'order' && !built.length) || ((ex.type === 'gap' || ex.type === 'translate' || (ex.type === 'listen' && ex.mode === 'type')) && !value.trim()));
  const ok = !!checked && (checked.correct || selfAccepted);

  return (
    <div>
      <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-7">
        {ex.type === 'listen' && audioText && (
          <div className="mb-4">
            <SpeakButton text={audioText} lang={lang} label="Прослушать" />
          </div>
        )}
        {ex.type === 'translate' && <div className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-soft uppercase">Переведите на {lang === 'en' ? 'английский' : 'казахский'}</div>}
        {ex.type === 'order' && <div className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-soft uppercase">Составьте предложение</div>}
        <p className="text-xl leading-snug font-medium sm:text-[22px]">{promptText}</p>
        {ex.type === 'gap' && ex.ru && <p className="mt-2 text-ink-soft">{ex.ru}</p>}

        {/* Ввод ответа */}
        <div className="mt-6">
          {options && (
            <div className="grid gap-2.5" role="group" aria-label="Варианты ответа">
              {order.map((k, pos) => {
                const isPicked = picked === k;
                const isRight = checked && k === correctIdx;
                const isWrongPick = checked && isPicked && k !== correctIdx;
                return (
                  <button
                    key={k}
                    disabled={!!checked}
                    onClick={() => setPicked(k)}
                    aria-pressed={isPicked}
                    className={cx(
                      'flex min-h-14 items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-[17px] transition-colors disabled:cursor-default',
                      isRight ? 'border-good bg-good-soft' : isWrongPick ? 'border-bad bg-bad-soft' : isPicked ? 'border-brand bg-brand-soft' : checked ? 'border-line opacity-70' : 'border-line hover:border-line-strong hover:bg-subtle',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                        isRight ? 'border-good bg-good text-white' : isWrongPick ? 'border-bad bg-bad text-white' : isPicked ? 'border-brand bg-brand text-white' : 'border-line-strong text-ink-soft',
                      )}
                    >
                      {isRight ? <Icon name="check" size={16} strokeWidth={2.75} /> : isWrongPick ? <Icon name="x" size={16} strokeWidth={2.75} /> : String.fromCharCode(65 + pos)}
                    </span>
                    <span className="min-w-0 flex-1">{options[k]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {ex.type === 'order' && (
            <div>
              <div className="min-h-16 rounded-2xl border-2 border-dashed border-line-strong bg-subtle p-2.5">
                <div className="flex flex-wrap gap-2">
                  {built.map((k, pos) => (
                    <button key={pos} disabled={!!checked} onClick={() => setBuilt((b) => b.filter((_, p) => p !== pos))} className="min-h-11 rounded-xl border border-brand/30 bg-brand-soft px-3.5 text-[17px] font-medium text-brand-ink">
                      {ex.words[k]}
                    </button>
                  ))}
                  {!built.length && <span className="px-1.5 py-2.5 text-ink-soft">Нажимайте слова ниже по порядку</span>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {words.map((k) =>
                  built.includes(k) ? null : (
                    <button key={k} disabled={!!checked} onClick={() => setBuilt((b) => [...b, k])} className="min-h-11 rounded-xl border border-line-strong bg-surface px-3.5 text-[17px] font-medium shadow-sm hover:bg-subtle">
                      {ex.words[k]}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {(ex.type === 'gap' || ex.type === 'translate' || (ex.type === 'listen' && ex.mode === 'type')) && (
            <input
              ref={inputRef}
              value={value}
              disabled={!!checked}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              className={cx(inputCls, 'min-h-14 text-[17px]', checked && (checked.correct ? 'border-good bg-good-soft' : 'border-bad bg-bad-soft'))}
              placeholder={ex.type === 'gap' ? 'Ваш ответ' : ex.type === 'translate' ? 'Перевод' : 'Запишите услышанное'}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              lang={lang === 'kk' ? 'kk' : 'en'}
              aria-label="Ответ"
            />
          )}
          {'hint' in ex && ex.hint && !checked && <p className="mt-3 text-sm text-ink-soft">Подсказка: {ex.hint}</p>}
          {!checked && ex.type === 'listen' && !audioText && (
            <div className="mt-4">
              <Notice tone="info">Вопрос относится к прослушанному тексту выше.</Notice>
            </div>
          )}
        </div>
      </div>

      {/* Результат и объяснение */}
      {checked && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className={cx('rounded-card border p-5', ok ? 'border-good/25 bg-good-soft' : 'border-bad/25 bg-bad-soft')}>
            <div className="flex items-center gap-2.5">
              <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white', ok ? 'bg-good' : 'bg-bad')}>
                <Icon name={ok ? 'check' : 'x'} size={17} strokeWidth={2.75} />
              </span>
              <span className={cx('text-lg font-semibold', ok ? 'text-good' : 'text-bad')}>
                {selfAccepted ? 'Засчитано по вашему решению' : checked.correct ? (checked.typo ? 'Верно, но с опечаткой' : 'Верно!') : 'Неверно'}
              </span>
            </div>
            {(!checked.correct || checked.typo) && (
              <div className="mt-3">
                <span className="text-ink-soft">Правильный ответ: </span>
                <strong className="font-semibold">{correctAnswerText(ex)}</strong>
              </div>
            )}
          </div>

          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <Icon name="lightbulb" size={17} className="text-warm-ink" />
              Объяснение
            </div>
            <div className="leading-relaxed">
              <Rich text={ex.explain} />
            </div>
            {wrongWhy && (
              <div className="mt-3 border-t border-line pt-3">
                <div className="text-sm font-semibold text-ink-soft">Почему не ваш вариант</div>
                <div className="mt-0.5">{wrongWhy}</div>
              </div>
            )}
            {ex.type === 'listen' && audioText && <p className="mt-3 text-sm text-ink-soft">Текст аудио: «{audioText}»</p>}
          </div>

          {showWhy && !checked.correct && (
            <div className="space-y-2.5 rounded-card border border-line bg-surface p-5 shadow-card">
              <div className="font-semibold">Разбор ошибки</div>
              <p>
                Ваш ответ: <span className="font-medium text-bad">{checked.answer || '—'}</span>. Ожидалось: <span className="font-medium text-good">{correctAnswerText(ex)}</span>.
              </p>
              <p>
                Тема: <strong>{topicName(ex.topic)}</strong>. {ex.explain}
              </p>
              {relatedPitfalls.length > 0 && (
                <div>
                  <div className="font-medium">Типичные ошибки по этой теме:</div>
                  <ul className="mt-1 space-y-1.5">
                    {relatedPitfalls.map((p, k) => (
                      <li key={k}>
                        <span className="text-bad line-through">{p.wrong}</span> → <span className="text-good">{p.right}</span> — {p.why}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-ink-soft">Ошибка сохранена в разделе «Мои ошибки». Позже система предложит новые задания на эту тему.</p>
              {aiConfigured() && state.settings.ai.enabled ? (
                <div>
                  {!ai.text && (
                    <Button size="sm" variant="secondary" icon="chat" onClick={askAi} disabled={ai.loading}>
                      {ai.loading ? 'AI думает…' : 'Подробнее от AI-преподавателя'}
                    </Button>
                  )}
                  {ai.text && <div className="mt-2 rounded-xl bg-subtle p-3 whitespace-pre-line">{ai.text}</div>}
                  {ai.error && <p className="mt-2 text-bad">{ai.error}</p>}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">Объяснение подготовлено заранее. AI-преподаватель не подключён.</p>
              )}
            </div>
          )}

          {moreMsg && <p className="text-sm text-ink-soft">{moreMsg}</p>}

          {/* Второстепенные действия — визуально тише основной кнопки */}
          <div className="flex flex-wrap gap-2">
            {!checked.correct && !showWhy && (
              <Button variant="quiet" size="sm" icon="lightbulb" onClick={() => setShowWhy(true)}>
                Объясни мою ошибку
              </Button>
            )}
            {!checked.correct && ex.type === 'translate' && !selfAccepted && (
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  setSelfAccepted(true);
                  onAnswered(true, checked.answer, true);
                }}
                title="Если вы уверены, что ваш перевод тоже верен"
              >
                Мой перевод тоже верен
              </Button>
            )}
            {onShowRule && (
              <Button variant="quiet" size="sm" icon="book" onClick={onShowRule}>
                Повтори правило
              </Button>
            )}
            {onMore && (
              <Button
                variant="quiet"
                size="sm"
                icon="plus"
                onClick={() => {
                  const ok = onMore();
                  setMoreMsg(ok ? 'Добавлено ещё одно упражнение на эту тему — оно будет следующим.' : 'Все готовые упражнения по этой теме уже в списке.' + (aiConfigured() ? ' Новые можно получить у AI-преподавателя.' : ''));
                }}
              >
                Дай ещё упражнение
              </Button>
            )}
          </div>
        </div>
      )}

      <ActionBar>
        {!checked ? (
          <Button size="lg" onClick={check} disabled={!canCheck} variant={lang === 'kk' ? 'kk' : 'primary'}>
            Проверить
          </Button>
        ) : (
          <Button size="lg" onClick={onNext} variant={lang === 'kk' ? 'kk' : 'primary'} iconRight={isLast ? 'check' : 'chevronRight'}>
            {isLast ? 'Завершить' : 'Далее'}
          </Button>
        )}
      </ActionBar>
    </div>
  );
}
