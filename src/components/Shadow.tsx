// Повтор за диктором: прослушать → записать себя → прослушать запись → сравнить распознанный текст.
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../data/types';
import { recognitionSupported, recordingSupported, startRecognition, startRecording, type Recognizer, type Recording } from '../lib/speech';
import { diffWords } from '../lib/text';
import { SpeakButton } from './Audio';
import { Icon } from './icons';
import { Button, cx } from './ui';

export function ShadowItem({ text, ru, lang, note }: { text: string; ru?: string; lang: Lang; note?: string }) {
  const [rec, setRec] = useState<Recording | null>(null);
  const [recog, setRecog] = useState<Recognizer | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState('');
  const [slow, setSlow] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      rec?.cancel();
      recog?.stop();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const start = async () => {
    setError('');
    setHeard('');
    try {
      if (recordingSupported()) {
        const r = await startRecording();
        setRec(r);
      }
      if (recognitionSupported()) {
        const g = startRecognition(
          lang,
          (finalText, interim) => setHeard((finalText + ' ' + interim).trim()),
          (m) => setError(m),
          () => setRecog(null),
        );
        setRecog(g);
      }
      if (!recordingSupported() && !recognitionSupported()) setError('Браузер не поддерживает запись голоса. Повторяйте фразу вслух самостоятельно.');
    } catch (e) {
      setError(String(e).includes('NotAllowed') ? 'Доступ к микрофону не разрешён. Разрешите его в настройках браузера (Safari → Настройки сайта → Микрофон).' : 'Не удалось включить микрофон: ' + String(e));
    }
  };

  const stop = async () => {
    recog?.stop();
    if (rec) {
      const r = await rec.stop();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = r.url;
      setAudio(r.url);
      setRec(null);
    }
  };

  const recording = !!rec || !!recog;
  const diff = heard ? diffWords(text, heard) : null;
  const score = diff ? Math.round((diff.filter((d) => d.ok).length / Math.max(1, diff.length)) * 100) : null;

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[17px] font-medium" lang={lang}>
            {text}
          </div>
          {ru && <div className="text-sm text-ink-soft">{ru}</div>}
          {note && <div className="mt-1 text-xs text-ink-soft">{note}</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SpeakButton text={text} lang={lang} compact rate={slow ? 0.65 : undefined} />
        <label className="flex min-h-11 items-center gap-2 px-1 text-sm text-ink-soft">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> медленно
        </label>
        {!recording ? (
          <Button size="sm" variant="secondary" icon="mic" onClick={start}>
            Записать себя
          </Button>
        ) : (
          <Button size="sm" variant="danger" icon="stop" onClick={stop}>
            Остановить
          </Button>
        )}
        {audio && <audio src={audio} controls className="h-9 max-w-full" />}
      </div>
      {recording && (
        <div className="mt-2 flex items-center gap-2 text-sm text-bad">
          <span className="h-2 w-2 animate-pulse rounded-full bg-bad" /> Идёт запись… {heard && <span className="text-ink-soft">«{heard}»</span>}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-warn">{error}</p>}
      {diff && !recording && (
        <div className="mt-2 text-sm">
          <div className="text-ink-soft">Распознано: «{heard}»</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {diff.map((d, i) => (
              <span key={i} className={cx('rounded px-1.5 py-0.5', d.ok ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad')}>
                {d.word}
                {!d.ok && d.got ? ` (${d.got})` : ''}
              </span>
            ))}
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            Совпадение слов: {score}%. Это проверка разборчивости по распознаванию речи, а не оценка произношения: интонацию и отдельные звуки автоматически не оцениваем — сравните свою запись с образцом на слух.
          </div>
        </div>
      )}
      {!recognitionSupported() && audio && <p className="mt-2 text-xs text-ink-soft">Распознавание речи недоступно в этом браузере — сравните запись с образцом на слух.</p>}
    </div>
  );
}

export function MicNotice() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-ink-soft">
      <Icon name="info" size={14} className="mt-0.5 shrink-0" />
      Запись голоса хранится только в памяти браузера до закрытия страницы. Распознавание речи выполняет сервис браузера (Apple в Safari, Google в Chrome) — аудио при этом передаётся производителю браузера.
    </p>
  );
}
