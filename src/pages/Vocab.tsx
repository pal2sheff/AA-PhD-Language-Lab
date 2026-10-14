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
import { Badge, Button, Card, Empty, Field, Modal, Notice, PageHeader, Progress, Stat, Tabs, cx, inputCls } from '../components/ui';
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
    <div className="space-y-4">
      <PageHeader title="Персональный словарь" subtitle="Интервальное повторение по алгоритму FSRS: дата следующего повтора рассчитывается автоматически" />
      <Tabs value={lang} onChange={setLang} items={[{ value: 'en', label: 'Английский' }, { value: 'kk', label: 'Казахский' }]} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Новые" value={vs.new} />
        <Stat label="Изучаемые" value={vs.learning} />
        <Stat label="К повтору" value={vs.due} />
        <Stat label="Освоены" value={vs.mastered} hint="стабильность ≥ 21 дня" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon="play" variant={lang === 'kk' ? 'kk' : 'primary'} onClick={() => navigate(`/vocab/review/${lang}`)} disabled={!vs.total}>
          Учить и повторять ({vs.due + Math.min(vs.new, NEW_PER_SESSION)})
        </Button>
        <Button variant="secondary" icon="plus" onClick={() => setAdding(true)}>
          Своё слово
        </Button>
      </div>

      <Card>
        <h2 className="font-semibold">Тематические модули</h2>
        <p className="text-sm text-ink-soft">Добавьте тему целиком — слова появятся как «новые» и будут вводиться порциями по {NEW_PER_SESSION}.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {cats.map((c) => {
            const seeds = VOCAB_SEEDS[lang].filter((v) => v.cat === c);
            const inDeck = seeds.filter((v) => s.vocab[v.id]).length;
            return (
              <button key={c} onClick={() => navigate(`/vocab/topic/${lang}/${encodeURIComponent(c)}`)} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-left hover:bg-canvas">
                <span className="font-medium">{c}</span>
                <span className="text-sm text-ink-soft">
                  {inDeck}/{seeds.length}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-semibold">Мои слова ({words.length})</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" className={cx(inputCls, 'max-w-48 min-h-9')} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(['all', 'new', 'learning', 'due', 'mastered'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx('rounded-full border px-3 py-1 text-sm', filter === f ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line text-ink-soft')}>
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
    <li className="py-2.5">
      <div className="flex items-center gap-2">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((o) => !o)}>
          <span className="font-medium" lang={w.lang}>
            {w.word}
          </span>{' '}
          <span className="text-ink-soft">— {w.tr}</span>
        </button>
        <Badge tone={st === 'mastered' ? 'good' : st === 'due' ? 'warn' : st === 'learning' ? 'brand' : 'neutral'}>{STATUS_NAMES[st]}</Badge>
      </div>
      {open && (
        <div className="mt-2 rounded-xl bg-canvas p-3 text-sm">
          {w.pron && <div className="text-ink-soft">Произношение: {w.pron}</div>}
          <div className="mt-1" lang={w.lang}>
            {w.ex}
          </div>
          <div className="text-ink-soft">{w.exRu}</div>
          <div className="mt-1 text-xs text-ink-faint">
            {w.cat} · {w.level} · повторений: {w.card.reps}, ошибок: {w.card.lapses}
            {w.card.state !== 'new' && ` · следующий повтор: ${formatDate(toISODate(new Date(w.card.due)))}`}
          </div>
          <div className="mt-2 flex gap-2">
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
    <div className="space-y-4">
      <PageHeader title={`Тема: ${cat}`} back="/vocab" subtitle={lang === 'en' ? 'Английский' : 'Казахский'} />
      <Card>
        <ul className="divide-y divide-line">
          {seeds.map((w) => (
            <li key={w.id} className="flex items-start gap-3 py-2.5">
              <SpeakButton text={w.word} lang={lang} compact allowReveal={false} />
              <div className="min-w-0 flex-1">
                <div>
                  <span className="font-medium" lang={lang}>
                    {w.word}
                  </span>{' '}
                  <span className="text-ink-soft">— {w.tr}</span> {w.pron && <span className="text-xs text-ink-faint">{w.pron}</span>}
                </div>
                <div className="text-sm" lang={lang}>
                  {w.ex}
                </div>
                <div className="text-sm text-ink-soft">{w.exRu}</div>
              </div>
              {s.vocab[w.id] && <Badge tone="good">в словаре</Badge>}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
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

  if (!current) {
    const ok = done.filter((d) => d.ok).length;
    return (
      <div className="space-y-4">
        <PageHeader title="Повторение слов" back="/vocab" />
        <Card>
          {done.length ? (
            <>
              <h2 className="text-lg font-semibold">Сессия завершена</h2>
              <p className="mt-1">
                Ответов: {done.length}, верных: {ok}. Следующие повторы запланированы автоматически.
              </p>
            </>
          ) : (
            <Empty title="Сейчас нечего повторять">Добавьте слова из тематических модулей или уроков — новые слова вводятся порциями по {NEW_PER_SESSION}.</Empty>
          )}
          <div className="mt-3 flex gap-2">
            <Button href="/vocab" variant="secondary">
              К словарю
            </Button>
            <Button href="/today">К плану</Button>
          </div>
        </Card>
      </div>
    );
  }

  const mode = modeFor(current, canListen);
  return (
    <div className="space-y-4">
      <PageHeader title="Повторение слов" back="/vocab" subtitle={`Осталось карточек: ${queue.length} · выполнено: ${done.length}`} />
      <Progress value={(done.length / Math.max(1, done.length + queue.length)) * 100} tone={lang === 'kk' ? 'kk' : 'brand'} />
      <VocabCard key={current.id + current.card.reps + done.length} w={current} mode={mode} lang={lang} onGrade={grade} />
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

  const footer = checked && (
    <div className="mt-4 space-y-3">
      <div className={cx('rounded-xl px-3 py-2.5 text-sm', checked.ok ? 'bg-good-soft' : 'bg-bad-soft')}>
        <div className="font-semibold">{checked.ok ? (checked.typo ? 'Верно, с опечаткой' : 'Верно!') : 'Неверно'}</div>
        <div>
          <span className="font-medium" lang={lang}>
            {w.word}
          </span>{' '}
          — {w.tr}
        </div>
        {w.ex && (
          <div className="mt-1 text-ink-soft">
            <span lang={lang}>{w.ex}</span> — {w.exRu}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onGrade(gradeFromResult(checked.ok, checked.typo, false), mode)}>Далее</Button>
      </div>
    </div>
  );

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between text-xs text-ink-soft">
        <span>{w.cat}</span>
        <span>
          {mode === 'intro' ? 'Новое слово' : mode === 'choose' ? 'Выбор перевода' : mode === 'recall' ? 'Вспомните перевод' : mode === 'write' ? 'Напишите по памяти' : mode === 'listen' ? 'Распознавание на слух' : 'Слово в предложении'}
        </span>
      </div>

      {mode === 'intro' && (
        <div>
          <div className="text-2xl font-semibold" lang={lang}>
            {w.word}
          </div>
          {w.pron && <div className="text-ink-soft">{w.pron}</div>}
          <div className="mt-1 text-lg">{w.tr}</div>
          <div className="mt-3 rounded-xl bg-canvas p-3">
            <div lang={lang}>{w.ex}</div>
            <div className="text-sm text-ink-soft">{w.exRu}</div>
          </div>
          <div className="mt-3">
            <SpeakButton text={w.word} lang={lang} compact allowReveal={false} />
          </div>
          <p className="mt-3 text-sm text-ink-soft">Прочитайте, послушайте и произнесите слово вслух. Через несколько минут оно появится в упражнении.</p>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => onGrade(3, 'intro')}>Запомнил(а), дальше</Button>
          </div>
        </div>
      )}

      {mode === 'choose' && (
        <div>
          <div className="text-2xl font-semibold" lang={lang}>
            {w.word}
          </div>
          <div className="mt-3 grid gap-2">
            {options.map((o, i) => (
              <button
                key={i}
                disabled={!!checked}
                onClick={() => {
                  setPicked(i);
                  setChecked({ ok: o === w.tr, typo: false });
                }}
                className={cx('min-h-12 rounded-xl border px-4 text-left', checked && o === w.tr ? 'border-good bg-good-soft' : checked && picked === i ? 'border-bad bg-bad-soft' : 'border-line hover:bg-canvas')}
              >
                {o}
              </button>
            ))}
          </div>
          {footer}
        </div>
      )}

      {mode === 'recall' && (
        <div>
          <div className="text-2xl font-semibold" lang={lang}>
            {w.word}
          </div>
          {!revealed ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setRevealed(true)}>Показать перевод</Button>
            </div>
          ) : (
            <div className="mt-3">
              <div className="text-lg">{w.tr}</div>
              {w.ex && (
                <div className="mt-2 text-sm text-ink-soft">
                  <span lang={lang}>{w.ex}</span> — {w.exRu}
                </div>
              )}
              <div className="mt-4 text-sm text-ink-soft">Насколько легко вы вспомнили?</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <Button variant="danger" size="sm" onClick={() => onGrade(1, 'recall')}>
                  Не вспомнил
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onGrade(2, 'recall')}>
                  Трудно
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onGrade(3, 'recall')}>
                  Хорошо
                </Button>
                <Button variant="good" size="sm" onClick={() => onGrade(4, 'recall')}>
                  Легко
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {(mode === 'write' || mode === 'listen') && (
        <div>
          {mode === 'write' ? (
            <div className="text-xl font-semibold">{w.tr}</div>
          ) : (
            <div>
              <SpeakButton text={w.word} lang={lang} />
              <div className="mt-2 text-sm text-ink-soft">Запишите услышанное слово</div>
            </div>
          )}
          <input
            className={cx(inputCls, 'mt-3', checked && (checked.ok ? 'border-good' : 'border-bad'))}
            value={value}
            disabled={!!checked}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && value.trim() && check([w.word])}
            placeholder={lang === 'en' ? 'по-английски' : 'по-казахски'}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang={lang}
          />
          {!checked && (
            <div className="mt-3 flex justify-end">
              <Button disabled={!value.trim()} onClick={() => check([w.word])}>
                Проверить
              </Button>
            </div>
          )}
          {footer}
        </div>
      )}

      {mode === 'sentence' && (
        <div>
          {sentence ? (
            <>
              <div className="text-lg" lang={lang}>
                {sentence}
              </div>
              <div className="text-sm text-ink-soft">{w.exRu}</div>
              <input
                className={cx(inputCls, 'mt-3', checked && (checked.ok ? 'border-good' : 'border-bad'))}
                value={value}
                disabled={!!checked}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && value.trim() && check([w.word])}
                placeholder="Вставьте слово"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                lang={lang}
              />
              {!checked && (
                <div className="mt-3 flex justify-end">
                  <Button disabled={!value.trim()} onClick={() => check([w.word])}>
                    Проверить
                  </Button>
                </div>
              )}
              {footer}
            </>
          ) : (
            <>
              <div className="text-xl font-semibold" lang={lang}>
                {w.word}
              </div>
              <p className="mt-2 text-sm text-ink-soft">Составьте своё предложение с этим словом (вслух или письменно), затем оцените себя.</p>
              <textarea className="mt-2 w-full rounded-xl border border-line p-3" rows={2} value={value} onChange={(e) => setValue(e.target.value)} lang={lang} />
              <Notice tone="info">Самостоятельно составленные предложения автоматически не проверяются. Для проверки используйте AI-преподавателя.</Notice>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button variant="danger" size="sm" onClick={() => onGrade(1, 'sentence')}>
                  Не получилось
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onGrade(2, 'sentence')}>
                  С трудом
                </Button>
                <Button variant="good" size="sm" onClick={() => onGrade(3, 'sentence')}>
                  Получилось
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
