import { useEffect, useMemo, useState } from 'react';
import type { Lang } from '../data/types';
import { VOCAB_SEEDS, vocabCategories } from '../data';
import { useAppState, getState } from '../lib/store';
import { addCustomWord, addVocab, markBlockDone, removeVocab, reviewWord, recordFreeMistake } from '../lib/learning';
import type { VocabEntry } from '../lib/state';
import { gradeFromResult, wordStatus, type Grade } from '../lib/srs';
import { matchAnswer, shuffle } from '../lib/text';
import { vocabStats } from '../lib/selectors';
import { navigate } from '../lib/router';
import { useStudyTimer } from '../lib/hooks';
import { voiceInfo } from '../lib/speech';
import { SpeakButton } from '../components/Audio';
import { ActionBar, Badge, Button, Card, Empty, Field, LangTag, Modal, Notice, OptionButton, PageHeader, Progress, SectionTitle, Tabs, cx, inputCls } from '../components/ui';
import { Icon } from '../components/icons';
import { formatDate, toISODate } from '../lib/dates';

const STATUS_NAMES = { new: 'новое', learning: 'изучается', due: 'к повтору', mastered: 'освоено' } as const;
const NEW_PER_SESSION = 10;

export function VocabPage() {
  const s = useAppState();
  const [lang, setLang] = useState<Lang>('en');
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'due' | 'mastered'>('all');
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const vs = vocabStats(s, lang);
  const now = Date.now();
  const words = Object.values(s.vocab)
    .filter((w) => w.lang === lang)
    .filter((w) => filter === 'all' || wordStatus(w.card, now) === filter)
    .filter((w) => !q || w.word.toLowerCase().includes(q.toLowerCase()) || w.tr.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.addedAt - a.addedAt);
  const cats = vocabCategories(lang);

  return (
    <div className="space-y-6">
      <PageHeader title="Словарь" subtitle="Интервальное повторение по алгоритму FSRS: дата следующего повтора рассчитывается автоматически" />
      <Tabs value={lang} onChange={setLang} items={[{ value: 'en', label: 'Английский' }, { value: 'kk', label: 'Казахский' }]} />
      <Card tone={lang === 'kk' ? 'kk' : 'en'}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          {[
            ['Новые', vs.new, null],
            ['Изучаемые', vs.learning, null],
            ['К повтору', vs.due, null],
            ['Освоены', vs.mastered, 'стабильность ≥ 21 дня'],
          ].map(([l, v, h]) => (
            <div key={l as string}>
              <div className="text-sm text-ink-soft">{l}</div>
              <div className="mt-0.5 text-2xl font-semibold tabular-nums">{v}</div>
              {h && <div className="text-sm text-ink-soft">{h}</div>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" icon="play" variant={lang === 'kk' ? 'kk' : 'primary'} onClick={() => navigate(`/vocab/review/${lang}`)} disabled={!vs.total}>
            Учить и повторять ({vs.due + Math.min(vs.new, NEW_PER_SESSION)})
          </Button>
          <Button size="lg" variant="secondary" icon="plus" onClick={() => setAdding(true)}>
            Своё слово
          </Button>
        </div>
      </Card>

      <Card>
        <SectionTitle sub={`Добавьте тему целиком — слова появятся как «новые» и будут вводиться порциями по ${NEW_PER_SESSION}.`}>Тематические модули</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {cats.map((c) => {
            const seeds = VOCAB_SEEDS[lang].filter((v) => v.cat === c);
            const inDeck = seeds.filter((v) => s.vocab[v.id]).length;
            return (
              <button key={c} onClick={() => navigate(`/vocab/topic/${lang}/${encodeURIComponent(c)}`)} className="flex min-h-13 items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left hover:bg-subtle">
                <span className="min-w-0 font-medium">{c}</span>
                <span className={cx('shrink-0 text-sm tabular-nums', inDeck === seeds.length ? 'font-medium text-good' : 'text-ink-soft')}>
                  {inDeck}/{seeds.length}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-xl font-semibold">Мои слова ({words.length})</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" aria-label="Поиск по словарю" className={cx(inputCls, 'w-full sm:max-w-56')} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'new', 'learning', 'due', 'mastered'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={cx('min-h-11 rounded-full border px-4 text-sm font-medium', filter === f ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line text-ink-soft hover:text-ink')}>
              {f === 'all' ? 'все' : STATUS_NAMES[f]}
            </button>
          ))}
        </div>
        {words.length === 0 ? (
          <div className="mt-3">
            <Empty title="Пока пусто">Добавьте тематический модуль или слова из урока.</Empty>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {words.slice(0, 300).map((w) => (
              <WordRow key={w.id} w={w} />
            ))}
          </ul>
        )}
      </Card>
      <AddWordModal open={adding} onClose={() => setAdding(false)} lang={lang} />
    </div>
  );
}

function WordRow({ w }: { w: VocabEntry }) {
  const st = wordStatus(w.card);
  const [open, setOpen] = useState(false);
  return (
    <li className="py-1">
      <div className="flex items-center gap-2">
        <button className="min-h-12 min-w-0 flex-1 py-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="font-medium" lang={w.lang}>
            {w.word}
          </span>{' '}
          <span className="text-ink-soft">— {w.tr}</span>
        </button>
        <Badge tone={st === 'mastered' ? 'good' : st === 'due' ? 'warn' : st === 'learning' ? 'brand' : 'neutral'}>{STATUS_NAMES[st]}</Badge>
      </div>
      {open && (
        <div className="mb-2 rounded-xl bg-subtle p-4 text-[15px]">
          {w.pron && <div className="text-ink-soft">Произношение: {w.pron}</div>}
          <div className="mt-1" lang={w.lang}>
            {w.ex}
          </div>
          <div className="text-ink-soft">{w.exRu}</div>
          <div className="mt-2 text-sm text-ink-soft">
            {w.cat} · {w.level} · повторений: {w.card.reps}, ошибок: {w.card.lapses}
            {w.card.state !== 'new' && ` · следующий повтор: ${formatDate(toISODate(new Date(w.card.due)))}`}
          </div>
          <div className="mt-3 flex gap-2">
            <SpeakButton text={w.word} lang={w.lang} compact allowReveal={false} />
            <Button size="sm" variant="danger" icon="trash" onClick={() => removeVocab(w.id)}>
              Удалить
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function AddWordModal({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  const [f, setF] = useState({ word: '', tr: '', ex: '', exRu: '', cat: 'Мои слова' });
  return (
    <Modal open={open} onClose={onClose} title={`Новое слово (${lang === 'en' ? 'английский' : 'казахский'})`}>
      <div className="space-y-3">
        <Field label="Слово или выражение">
          <input className={inputCls} value={f.word} onChange={(e) => setF({ ...f, word: e.target.value })} lang={lang} />
        </Field>
        <Field label="Перевод">
          <input className={inputCls} value={f.tr} onChange={(e) => setF({ ...f, tr: e.target.value })} />
        </Field>
        <Field label="Пример употребления (необязательно)">
          <input className={inputCls} value={f.ex} onChange={(e) => setF({ ...f, ex: e.target.value })} lang={lang} />
        </Field>
        <Field label="Перевод примера (необязательно)">
          <input className={inputCls} value={f.exRu} onChange={(e) => setF({ ...f, exRu: e.target.value })} />
        </Field>
        <div className="flex justify-end">
          <Button
            disabled={!f.word.trim() || !f.tr.trim()}
            onClick={() => {
              addCustomWord(lang, f.word.trim(), f.tr.trim(), f.ex.trim(), f.exRu.trim(), f.cat);
              setF({ word: '', tr: '', ex: '', exRu: '', cat: 'Мои слова' });
              onClose();
            }}
          >
            Добавить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function VocabTopicPage({ lang, cat }: { lang: Lang; cat: string }) {
  const s = useAppState();
  const seeds = VOCAB_SEEDS[lang].filter((v) => v.cat === cat);
  const missing = seeds.filter((v) => !s.vocab[v.id]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={<LangTag lang={lang} long />} title={`Тема: ${cat}`} back="/vocab" />
      <Card>
        <ul className="divide-y divide-line">
          {seeds.map((w) => (
            <li key={w.id} className="flex items-start gap-3 py-3.5">
              <SpeakButton text={w.word} lang={lang} compact allowReveal={false} />
              <div className="min-w-0 flex-1">
                <div>
                  <span className="font-medium" lang={lang}>
                    {w.word}
                  </span>{' '}
                  <span className="text-ink-soft">— {w.tr}</span> {w.pron && <span className="text-sm text-ink-faint">{w.pron}</span>}
                </div>
                <div className="mt-1 text-[15px]" lang={lang}>
                  {w.ex}
                </div>
                <div className="text-sm text-ink-soft">{w.exRu}</div>
              </div>
              {s.vocab[w.id] && <Badge tone="good">в словаре</Badge>}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={lang === 'kk' ? 'kk' : 'primary'}
            disabled={!missing.length}
            onClick={() => {
              addVocab(missing, `Тема: ${cat}`);
            }}
          >
            {missing.length ? `Добавить в словарь (${missing.length})` : 'Все слова темы в словаре'}
          </Button>
          <Button variant="secondary" href={`/vocab/review/${lang}`}>
            Учить
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Сессия повторения ────────────────────────────────────────────────────

type Mode = 'intro' | 'choose' | 'recall' | 'write' | 'listen' | 'sentence';

function modeFor(w: VocabEntry, canListen: boolean): Mode {
  const r = w.card.reps;
  if (w.card.state === 'new') return 'intro';
  const cycle: Mode[] = ['choose', 'recall', 'write', canListen ? 'listen' : 'write', w.ex ? 'sentence' : 'recall'];
  return cycle[Math.min(cycle.length - 1, Math.max(0, r - 1)) % cycle.length] ?? 'recall';
}

export function VocabReview({ lang }: { lang: Lang }) {
  useStudyTimer(lang);
  const [queue, setQueue] = useState<string[]>(() => {
    const st = getState();
    const now = Date.now();
    const all = Object.values(st.vocab).filter((v) => v.lang === lang);
    const due = all.filter((v) => v.card.state !== 'new' && v.card.due <= now).sort((a, b) => a.card.due - b.card.due);
    const fresh = all.filter((v) => v.card.state === 'new').sort((a, b) => a.addedAt - b.addedAt).slice(0, NEW_PER_SESSION);
    return [...due.map((v) => v.id), ...fresh.map((v) => v.id)];
  });
  const [done, setDone] = useState<{ id: string; ok: boolean }[]>([]);
  const s = useAppState();
  const current = queue[0] ? s.vocab[queue[0]] : undefined;
  const canListen = voiceInfo(lang).ok;

  const grade = (g: Grade, mode: string) => {
    if (!current) return;
    reviewWord(current.id, g, mode);
    const after = getState().vocab[current.id];
    setDone((d) => [...d, { id: current.id, ok: g > 1 }]);
    setQueue((q) => {
      const rest = q.slice(1);
      // карточки в коротком шаге обучения возвращаются в эту же сессию
      if (after && after.card.due - Date.now() < 15 * 60000 && after.card.state !== 'review') return [...rest, current.id];
      return rest;
    });
    if (g === 1)
      recordFreeMistake({ key: `vocab-${current.id}`, lang, category: 'vocab', topic: `${lang}.vocab-words`, prompt: `Слово: ${current.tr}`, userAnswer: '—', correct: current.word, explain: current.ex ? `${current.ex} — ${current.exRu}` : '' });
  };

  const finished = !current;
  useEffect(() => {
    if (finished && done.length) markBlockDone('vocab', lang);
  }, [finished, done.length, lang]);

  const isKk = lang === 'kk';
  const header = (
    <div className="flex items-center justify-between gap-3">
      <button onClick={() => navigate('/vocab')} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-ink-soft hover:bg-surface hover:text-ink">
        <Icon name="x" size={18} />
        Закончить
      </button>
      <LangTag lang={lang} long />
    </div>
  );

  if (!current) {
    const ok = done.filter((d) => d.ok).length;
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {header}
        <h1 className="text-[28px] font-semibold tracking-tight">Повторение слов</h1>
        <Card>
          {done.length ? (
            <>
              <h2 className="text-xl font-semibold">Сессия завершена</h2>
              <p className="mt-2">
                Ответов: {done.length}, верных: {ok}. Следующие повторы запланированы автоматически.
              </p>
            </>
          ) : (
            <Empty title="Сейчас нечего повторять">Добавьте слова из тематических модулей или уроков — новые слова вводятся порциями по {NEW_PER_SESSION}.</Empty>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button href="/vocab" variant="secondary">
              К словарю
            </Button>
            <Button href="/today" variant={isKk ? 'kk' : 'primary'}>
              К плану
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const mode = modeFor(current, canListen);
  const total = done.length + queue.length;
  return (
    <div className="mx-auto max-w-2xl">
      {header}
      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {done.length + 1} из {total}
        </span>
        <Progress value={(done.length / Math.max(1, total)) * 100} tone={isKk ? 'kk' : 'brand'} label="Прогресс сессии" />
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">
        Повторение слов · осталось карточек: {queue.length}
      </p>
      <div className="mt-5">
        <VocabCard key={current.id + current.card.reps + done.length} w={current} mode={mode} lang={lang} onGrade={grade} />
      </div>
    </div>
  );
}

const MODE_NAMES: Record<Mode, string> = { intro: 'Новое слово', choose: 'Выбор перевода', recall: 'Вспомните перевод', write: 'Напишите по памяти', listen: 'Распознавание на слух', sentence: 'Слово в предложении' };

/** Крупное слово с транскрипцией и кнопкой прослушивания. */
function BigWord({ w, lang, audio = true }: { w: VocabEntry; lang: Lang; audio?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[34px] leading-tight font-semibold tracking-tight break-words sm:text-[40px]" lang={lang}>
        {w.word}
      </div>
      {w.pron && <div className="mt-1 text-ink-soft">{w.pron}</div>}
      {audio && (
        <div className="mt-4 flex justify-center">
          <SpeakButton text={w.word} lang={lang} label="Прослушать" allowReveal={false} />
        </div>
      )}
    </div>
  );
}

function VocabCard({ w, mode, lang, onGrade }: { w: VocabEntry; mode: Mode; lang: Lang; onGrade: (g: Grade, mode: string) => void }) {
  const s = getState();
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<null | { ok: boolean; typo: boolean }>(null);

  const options = useMemo(() => {
    const others = Object.values(s.vocab).filter((x) => x.lang === lang && x.id !== w.id && x.tr !== w.tr);
    const seedOthers = VOCAB_SEEDS[lang].filter((x) => x.id !== w.id && x.tr !== w.tr);
    const pool = shuffle([...others.map((o) => o.tr), ...seedOthers.map((o) => o.tr)]);
    const uniq = [...new Set(pool)].slice(0, 3);
    return shuffle([w.tr, ...uniq]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.id]);

  const sentence = useMemo(() => {
    if (!w.ex) return null;
    const re = new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return re.test(w.ex) ? w.ex.replace(re, '_____') : null;
  }, [w]);

  const check = (accepted: string[]) => {
    const m = matchAnswer(value, accepted);
    setChecked({ ok: m.result !== 'wrong', typo: m.result === 'typo' });
  };

  const isKk = lang === 'kk';
  const accent = isKk ? 'kk' : 'primary';
  const footer = checked && (
    <>
      <div className={cx('mt-6 rounded-2xl border p-4', checked.ok ? 'border-good/25 bg-good-soft' : 'border-bad/25 bg-bad-soft')} aria-live="polite">
        <div className={cx('flex items-center gap-2 font-semibold', checked.ok ? 'text-good' : 'text-bad')}>
          <Icon name={checked.ok ? 'check' : 'x'} size={18} strokeWidth={2.5} />
          {checked.ok ? (checked.typo ? 'Верно, с опечаткой' : 'Верно!') : 'Неверно'}
        </div>
        <div className="mt-1.5 text-[17px]">
          <span className="font-semibold" lang={lang}>
            {w.word}
          </span>{' '}
          — {w.tr}
        </div>
        {w.ex && (
          <div className="mt-1.5 text-ink-soft">
            <span lang={lang}>{w.ex}</span> — {w.exRu}
          </div>
        )}
      </div>
      <ActionBar>
        <Button size="lg" variant={accent} iconRight="chevronRight" onClick={() => onGrade(gradeFromResult(checked.ok, checked.typo, false), mode)}>
          Далее
        </Button>
      </ActionBar>
    </>
  );

  const textInput = (placeholder: string) => (
    <input
      className={cx(inputCls, 'mt-5 min-h-14 text-center text-[19px]', checked && (checked.ok ? 'border-good' : 'border-bad'))}
      value={value}
      disabled={!!checked}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && value.trim() && check([w.word])}
      placeholder={placeholder}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      lang={lang}
      aria-label="Ответ"
    />
  );
  const checkBar = !checked && (
    <ActionBar>
      <Button size="lg" variant={accent} disabled={!value.trim()} onClick={() => check([w.word])}>
        Проверить
      </Button>
    </ActionBar>
  );

  const gradeBtn = 'flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-2 py-2 text-center font-semibold transition-colors';

  return (
    <div>
      <div className={cx('rounded-card border border-line border-t-[3px] bg-surface p-6 shadow-card sm:p-8', isKk ? 'border-t-kk' : 'border-t-brand')}>
        <div className="mb-6 flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-soft">{w.cat}</span>
          <Badge tone={isKk ? 'kk' : 'brand'}>{MODE_NAMES[mode]}</Badge>
        </div>

        {mode === 'intro' && (
          <div>
            <BigWord w={w} lang={lang} />
            <div className="mt-5 text-center text-xl">{w.tr}</div>
            {w.ex && (
              <div className="mt-5 rounded-2xl bg-subtle p-4">
                <div className="text-[17px]" lang={lang}>
                  {w.ex}
                </div>
                <div className="mt-1 text-ink-soft">{w.exRu}</div>
              </div>
            )}
            <p className="mt-4 text-sm text-ink-soft">Прочитайте, послушайте и произнесите слово вслух. Через несколько минут оно появится в упражнении.</p>
          </div>
        )}

        {mode === 'choose' && (
          <div>
            <BigWord w={w} lang={lang} />
            <div className="mt-6 grid gap-2.5">
              {options.map((o, i) => (
                <OptionButton
                  key={i}
                  letter={String.fromCharCode(65 + i)}
                  selected={picked === i}
                  state={checked ? (o === w.tr ? 'right' : picked === i ? 'wrong' : 'dim') : undefined}
                  disabled={!!checked}
                  onClick={() => {
                    setPicked(i);
                    setChecked({ ok: o === w.tr, typo: false });
                  }}
                >
                  {o}
                </OptionButton>
              ))}
            </div>
          </div>
        )}

        {mode === 'recall' && (
          <div>
            <BigWord w={w} lang={lang} />
            {revealed && (
              <div className="mt-6 border-t border-line pt-5 text-center">
                <div className="text-xl font-medium">{w.tr}</div>
                {w.ex && (
                  <div className="mt-2 text-ink-soft">
                    <span lang={lang}>{w.ex}</span> — {w.exRu}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(mode === 'write' || mode === 'listen') && (
          <div>
            {mode === 'write' ? (
              <div className="text-center">
                <div className="text-sm text-ink-soft">Напишите {isKk ? 'по-казахски' : 'по-английски'}</div>
                <div className="mt-1 text-[28px] leading-tight font-semibold">{w.tr}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <SpeakButton text={w.word} lang={lang} />
                <div className="mt-2 text-sm text-ink-soft">Запишите услышанное слово</div>
              </div>
            )}
            {textInput(isKk ? 'по-казахски' : 'по-английски')}
          </div>
        )}

        {mode === 'sentence' && (
          <div>
            {sentence ? (
              <>
                <div className="text-center text-xl leading-snug" lang={lang}>
                  {sentence}
                </div>
                <div className="mt-2 text-center text-ink-soft">{w.exRu}</div>
                {textInput('Вставьте слово')}
              </>
            ) : (
              <>
                <BigWord w={w} lang={lang} audio={false} />
                <p className="mt-4 text-ink-soft">Составьте своё предложение с этим словом (вслух или письменно), затем оцените себя.</p>
                <textarea className="mt-3 mb-3 w-full rounded-xl border border-line-strong p-3.5 outline-none focus:border-brand" rows={2} value={value} onChange={(e) => setValue(e.target.value)} lang={lang} aria-label="Ваше предложение" />
                <Notice tone="info">Самостоятельно составленные предложения автоматически не проверяются. Для проверки используйте AI-преподавателя.</Notice>
              </>
            )}
          </div>
        )}
      </div>

      {footer}

      {mode === 'intro' && (
        <ActionBar>
          <Button size="lg" variant={accent} onClick={() => onGrade(3, 'intro')}>
            Запомнил(а), дальше
          </Button>
        </ActionBar>
      )}
      {mode === 'recall' && !revealed && (
        <ActionBar>
          <Button size="lg" variant={accent} icon="eye" onClick={() => setRevealed(true)}>
            Показать перевод
          </Button>
        </ActionBar>
      )}
      {mode === 'recall' && revealed && (
        <div className="action-bar -mx-4 mt-6 border-t border-line bg-canvas/95 px-4 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="mb-2 text-center text-sm text-ink-soft">Насколько легко вы вспомнили?</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button className={cx(gradeBtn, 'border-bad/40 bg-surface text-bad hover:bg-bad-soft')} onClick={() => onGrade(1, 'recall')}>
              Не вспомнил
            </button>
            <button className={cx(gradeBtn, 'border-warn/40 bg-surface text-warn hover:bg-warn-soft')} onClick={() => onGrade(2, 'recall')}>
              Трудно
            </button>
            <button className={cx(gradeBtn, 'border-line-strong bg-surface text-ink hover:bg-subtle')} onClick={() => onGrade(3, 'recall')}>
              Хорошо
            </button>
            <button className={cx(gradeBtn, 'border-good/40 bg-surface text-good hover:bg-good-soft')} onClick={() => onGrade(4, 'recall')}>
              Легко
            </button>
          </div>
        </div>
      )}
      {(mode === 'write' || mode === 'listen' || (mode === 'sentence' && sentence)) && checkBar}
      {mode === 'sentence' && !sentence && (
        <div className="action-bar -mx-4 mt-6 border-t border-line bg-canvas/95 px-4 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="grid grid-cols-3 gap-2">
            <button className={cx(gradeBtn, 'border-bad/40 bg-surface text-bad hover:bg-bad-soft')} onClick={() => onGrade(1, 'sentence')}>
              Не получилось
            </button>
            <button className={cx(gradeBtn, 'border-line-strong bg-surface text-ink hover:bg-subtle')} onClick={() => onGrade(2, 'sentence')}>
              С трудом
            </button>
            <button className={cx(gradeBtn, 'border-good/40 bg-surface text-good hover:bg-good-soft')} onClick={() => onGrade(3, 'sentence')}>
              Получилось
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
