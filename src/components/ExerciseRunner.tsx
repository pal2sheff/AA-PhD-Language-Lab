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
import { Badge, Button, Notice, Rich, cx, inputCls } from './ui';
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
      <div className="mb-3 flex items-center justify-between gap-2 text-sm text-ink-soft">
        <span>{title ?? 'Упражнение'} {i + 1} из {queue.length}</span>
        <Badge tone={lang === 'kk' ? 'kk' : 'brand'}>{topicName(ex.topic)}</Badge>
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

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      {ex.type === 'listen' && audioText && (
        <div className="mb-3">
          <SpeakButton text={audioText} lang={lang} label="Прослушать" />
        </div>
      )}
      {ex.type === 'translate' && <div className="mb-1 text-xs font-medium tracking-wide text-ink-faint uppercase">Переведите на {lang === 'en' ? 'английский' : 'казахский'}</div>}
      {ex.type === 'order' && <div className="mb-1 text-xs font-medium tracking-wide text-ink-faint uppercase">Составьте предложение</div>}
      <p className="text-[17px] leading-snug font-medium">{promptText}</p>
      {ex.type === 'gap' && ex.ru && <p className="mt-1 text-sm text-ink-soft">{ex.ru}</p>}

      {/* Ввод ответа */}
      <div className="mt-4">
        {options && (
          <div className="grid gap-2">
            {order.map((k) => {
              const isPicked = picked === k;
              const isRight = checked && k === correctIdx;
              const isWrongPick = checked && isPicked && k !== correctIdx;
              return (
                <button
                  key={k}
                  disabled={!!checked}
                  onClick={() => setPicked(k)}
                  className={cx(
                    'flex min-h-12 items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left transition-colors',
                    isRight ? 'border-good bg-good-soft' : isWrongPick ? 'border-bad bg-bad-soft' : isPicked ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas',
                  )}
                >
                  <span>{options[k]}</span>
                  {isRight && <Icon name="check" className="text-good" />}
                  {isWrongPick && <Icon name="x" className="text-bad" />}
                </button>
              );
            })}
          </div>
        )}

        {ex.type === 'order' && (
          <div>
            <div className="min-h-14 rounded-xl border border-dashed border-line bg-canvas p-2">
              <div className="flex flex-wrap gap-2">
                {built.map((k, pos) => (
                  <button key={pos} disabled={!!checked} onClick={() => setBuilt((b) => b.filter((_, p) => p !== pos))} className="rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 font-medium">
                    {ex.words[k]}
                  </button>
                ))}
                {!built.length && <span className="px-1 py-1.5 text-sm text-ink-faint">Нажимайте слова ниже по порядку</span>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {words.map((k) =>
                built.includes(k) ? null : (
                  <button key={k} disabled={!!checked} onClick={() => setBuilt((b) => [...b, k])} className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium hover:bg-canvas">
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
            className={cx(inputCls, checked && (checked.correct ? 'border-good bg-good-soft' : 'border-bad bg-bad-soft'))}
            placeholder={ex.type === 'gap' ? 'Ваш ответ' : ex.type === 'translate' ? 'Перевод' : 'Запишите услышанное'}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang={lang === 'kk' ? 'kk' : 'en'}
            aria-label="Ответ"
          />
        )}
        {'hint' in ex && ex.hint && !checked && <p className="mt-2 text-sm text-ink-soft">Подсказка: {ex.hint}</p>}
      </div>

      {/* Результат и объяснение */}
      {checked && (
        <div className="mt-4 space-y-3">
          <div className={cx('rounded-xl px-3.5 py-3 text-sm', checked.correct || selfAccepted ? 'bg-good-soft text-[#14532d]' : 'bg-bad-soft text-[#7f1d1d]')}>
            <div className="font-semibold">
              {selfAccepted ? 'Засчитано по вашему решению' : checked.correct ? (checked.typo ? 'Верно, но с опечаткой' : 'Верно!') : 'Неверно'}
            </div>
            {(!checked.correct || checked.typo) && (
              <div className="mt-1">
                Правильный ответ: <strong>{correctAnswerText(ex)}</strong>
              </div>
            )}
            <div className="mt-1 text-ink">
              <Rich text={ex.explain} />
            </div>
            {wrongWhy && <div className="mt-1 text-ink">Почему не ваш вариант: {wrongWhy}</div>}
          </div>

          {ex.type === 'listen' && audioText && <p className="text-sm text-ink-soft">Текст аудио: «{audioText}»</p>}

          {showWhy && !checked.correct && (
            <div className="space-y-2 rounded-xl border border-line bg-canvas p-3 text-sm">
              <div className="font-semibold">Разбор ошибки</div>
              <p>
                Ваш ответ: <span className="text-bad">{checked.answer || '—'}</span>. Ожидалось: <span className="text-good">{correctAnswerText(ex)}</span>.
              </p>
              <p>
                Тема: <strong>{topicName(ex.topic)}</strong>. {ex.explain}
              </p>
              {relatedPitfalls.length > 0 && (
                <div>
                  <div className="font-medium">Типичные ошибки по этой теме:</div>
                  <ul className="mt-1 space-y-1">
                    {relatedPitfalls.map((p, k) => (
                      <li key={k}>
                        <span className="text-bad line-through">{p.wrong}</span> → <span className="text-good">{p.right}</span> — {p.why}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-ink-soft">Ошибка сохранена в разделе «Мои ошибки». Позже система предложит новые задания на эту тему.</p>
              {aiConfigured() && state.settings.ai.enabled ? (
                <div>
                  {!ai.text && (
                    <Button size="sm" variant="secondary" icon="chat" onClick={askAi} disabled={ai.loading}>
                      {ai.loading ? 'AI думает…' : 'Подробнее от AI-преподавателя'}
                    </Button>
                  )}
                  {ai.text && <div className="mt-2 rounded-lg bg-surface p-3 whitespace-pre-line">{ai.text}</div>}
                  {ai.error && <p className="mt-2 text-bad">{ai.error}</p>}
                </div>
              ) : (
                <p className="text-xs text-ink-faint">Объяснение подготовлено заранее. AI-преподаватель не подключён.</p>
              )}
            </div>
          )}

          {moreMsg && <p className="text-sm text-ink-soft">{moreMsg}</p>}

          <div className="flex flex-wrap gap-2">
            {!checked.correct && !showWhy && (
              <Button variant="secondary" size="sm" icon="lightbulb" onClick={() => setShowWhy(true)}>
                Объясни мою ошибку
              </Button>
            )}
            {!checked.correct && ex.type === 'translate' && !selfAccepted && (
              <Button
                variant="ghost"
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
              <Button variant="secondary" size="sm" icon="book" onClick={onShowRule}>
                Повтори правило
              </Button>
            )}
            {onMore && (
              <Button
                variant="secondary"
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

      <div className="mt-5 flex justify-end">
        {!checked ? (
          <Button onClick={check} disabled={(options && picked === null) || (ex.type === 'order' && !built.length) || ((ex.type === 'gap' || ex.type === 'translate' || (ex.type === 'listen' && ex.mode === 'type')) && !value.trim())}>
            Проверить
          </Button>
        ) : (
          <Button onClick={onNext} icon={isLast ? 'check' : 'chevronRight'}>
            {isLast ? 'Завершить' : 'Далее'}
          </Button>
        )}
      </div>
      {!checked && (ex.type === 'listen' && !audioText) && <Notice tone="info">Вопрос относится к прослушанному тексту выше.</Notice>}
    </div>
  );
}
