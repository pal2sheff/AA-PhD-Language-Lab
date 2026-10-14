import { useState } from 'react';
import type { Lang } from '../data/types';
import { DICTATION, PRON, type DictationItem } from '../data/practice';
import { ShadowItem, MicNotice } from '../components/Shadow';
import { SpeakButton, VoiceLabel } from '../components/Audio';
import { Badge, Button, Card, Notice, PageHeader, Tabs, cx, inputCls } from '../components/ui';
import { diffWords, normalize } from '../lib/text';
import { markBlockDone, recordFreeMistake } from '../lib/learning';
import { useStudyTimer } from '../lib/hooks';
import { navigate } from '../lib/router';
import { voiceInfo } from '../lib/speech';

export function PronunciationPage({ lang }: { lang: Lang }) {
  useStudyTimer(lang);
  const sets = PRON[lang];
  const [id, setId] = useState(sets[0].id);
  const set = sets.find((x) => x.id === id)!;
  return (
    <div className="space-y-4">
      <PageHeader title="Тренажёр произношения" subtitle="Прослушайте → повторите → запишите себя → сравните" />
      <Tabs value={lang} onChange={(l) => navigate(`/pronunciation/${l}`)} items={[{ value: 'en', label: 'Английский' }, { value: 'kk', label: 'Казахский' }]} />
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" href={`/dictation/${lang}`} icon="headphones">
          Аудиодиктанты
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sets.map((s) => (
          <button key={s.id} onClick={() => setId(s.id)} className={cx('min-h-11 rounded-full border px-4 text-sm font-medium', s.id === id ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line')}>
            {s.title}
          </button>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-semibold">{set.title}</h2>
        <p className="mt-1 text-sm">{set.focus}</p>
        <VoiceLabel lang={lang} />
        {lang === 'kk' && !voiceInfo('kk').ok && (
          <Notice tone="warn">На устройстве нет казахского голоса — качественный образец произношения недоступен. Ориентируйтесь на описание звука, а для образцов подключите реальные аудиозаписи (см. README, раздел «Аудио»).</Notice>
        )}
        <MicNotice />
        <div className="mt-3 space-y-2">
          {set.items.map((it) => (
            <ShadowItem key={it.t} text={it.t.replace(/[↗↘]/g, '').trim()} ru={it.ru} note={it.note} lang={lang} />
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => markBlockDone('pronunciation', lang)} variant="good" icon="check">
            Отметить тренировку выполненной
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function DictationPage({ lang }: { lang: Lang }) {
  useStudyTimer(lang);
  const items = DICTATION[lang];
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  return (
    <div className="space-y-4">
      <PageHeader title="Аудиодиктанты" subtitle="Сложность растёт от слов к текстам" />
      <Tabs value={lang} onChange={(l) => navigate(`/dictation/${l}`)} items={[{ value: 'en', label: 'Английский' }, { value: 'kk', label: 'Казахский' }]} />
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <button key={it.id} onClick={() => setIdx(i)} className={cx('min-h-11 rounded-full border px-4 text-sm font-medium', i === idx ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line')}>
            {i + 1}. {it.title} <span className="text-ink-faint">{it.level}</span>
          </button>
        ))}
      </div>
      <Dictation key={item.id} item={item} lang={lang} onNext={idx + 1 < items.length ? () => setIdx(idx + 1) : undefined} />
    </div>
  );
}

function Dictation({ item, lang, onNext }: { item: DictationItem; lang: Lang; onNext?: () => void }) {
  const [value, setValue] = useState('');
  const [gapValues, setGapValues] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [played, setPlayed] = useState(0);
  const [hidden, setHidden] = useState(false);
  const words = item.text.split(/\s+/);
  const memory = item.kind === 'memory';
  const playLimit = memory ? 1 : 99;

  const answer = item.kind === 'gaps' ? words.map((w, i) => (item.gaps!.includes(i) ? gapValues[item.gaps!.indexOf(i)] ?? '' : w)).join(' ') : value;
  const diff = checked ? diffWords(item.text, answer) : null;
  const errors = diff ? diff.filter((d) => !d.ok) : [];

  const check = () => {
    setChecked(true);
    const d = diffWords(item.text, answer);
    const wrong = d.filter((x) => !x.ok);
    if (wrong.length) {
      recordFreeMistake({
        key: `dict-${item.id}`,
        lang,
        category: 'spelling',
        topic: `${lang}.dictation`,
        prompt: `Диктант: ${item.title}`,
        userAnswer: answer,
        correct: item.text,
        explain: `Ошибки в словах: ${wrong.map((x) => x.word + (x.got ? ` (у вас: ${x.got})` : ' (пропущено)')).join(', ')}. ${item.explain ?? ''}`,
      });
    }
    markBlockDone('dictation', lang);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{item.title}</h2>
        <Badge>{item.level}</Badge>
        <Badge>{item.kind === 'words' ? 'слова' : item.kind === 'sentence' ? 'предложение' : item.kind === 'text' ? 'текст' : item.kind === 'gaps' ? 'пропуски' : 'по памяти'}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {memory ? 'Прослушайте один раз, затем запишите фразу по памяти.' : item.kind === 'gaps' ? 'Прослушайте текст и впишите пропущенные слова.' : 'Прослушайте и запишите. Можно слушать несколько раз и в замедленном темпе.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SpeakButton text={item.text} lang={lang} onPlayed={() => setPlayed((p) => p + 1)} allowReveal={!memory} />
        {!memory && <SpeakButton text={item.text} lang={lang} label="Медленно" rate={0.6} onPlayed={() => setPlayed((p) => p + 1)} allowReveal={false} />}
      </div>
      {memory && played >= playLimit && !hidden && !checked && (
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => setHidden(true)}>
          Я запомнил(а) — писать
        </Button>
      )}
      {item.kind === 'gaps' ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 leading-loose" lang={lang}>
          {words.map((w, i) =>
            item.gaps!.includes(i) ? (
              <input
                key={i}
                value={gapValues[item.gaps!.indexOf(i)] ?? ''}
                disabled={checked}
                onChange={(e) => {
                  const arr = [...gapValues];
                  arr[item.gaps!.indexOf(i)] = e.target.value;
                  setGapValues(arr);
                }}
                className="w-28 rounded-lg border border-line px-2 py-1"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label={`Пропуск ${item.gaps!.indexOf(i) + 1}`}
              />
            ) : (
              <span key={i}>{w}</span>
            ),
          )}
        </div>
      ) : (
        (!memory || hidden || checked) && (
          <textarea value={value} onChange={(e) => setValue(e.target.value)} disabled={checked} rows={item.kind === 'text' ? 5 : 2} className={cx(inputCls, 'mt-3')} placeholder="Запишите услышанное" lang={lang} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        )
      )}
      {!checked && (
        <div className="mt-3 flex justify-end">
          <Button onClick={check} disabled={!normalize(answer)}>
            Проверить
          </Button>
        </div>
      )}
      {diff && (
        <div className="mt-4 space-y-2 text-sm">
          <div className={cx('rounded-xl px-3 py-2', errors.length ? 'bg-bad-soft' : 'bg-good-soft')}>
            <strong>{errors.length ? `Ошибок: ${errors.length} из ${diff.length} слов` : 'Без ошибок!'}</strong>
          </div>
          <div>
            <div className="text-ink-soft">Исходный текст:</div>
            <div className="font-medium" lang={lang}>
              {item.text}
            </div>
            {item.ru && <div className="text-ink-soft">{item.ru}</div>}
          </div>
          <div>
            <div className="text-ink-soft">Ваш ответ:</div>
            <div>{answer || '—'}</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {diff.map((d, i) => (
              <span key={i} className={cx('rounded px-1.5 py-0.5', d.ok ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad')}>
                {d.word}
                {!d.ok && (d.got ? ` ← ${d.got}` : ' (пропущено)')}
              </span>
            ))}
          </div>
          {errors.length > 0 && <p className="text-ink-soft">Объяснение: {item.explain} Сравнение ведётся без учёта регистра и знаков препинания.</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setChecked(false);
                setValue('');
                setGapValues([]);
                setHidden(false);
                setPlayed(0);
              }}
            >
              Повторить
            </Button>
            {onNext && (
              <Button size="sm" onClick={onNext}>
                Следующий
              </Button>
            )}
          </div>
        </div>
      )}
      <VoiceLabel lang={lang} />
    </Card>
  );
}
