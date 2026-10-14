// Запись устного ответа: микрофон + распознавание (если поддерживается) + ручная правка транскрипции.
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../data/types';
import { recognitionSupported, recordingSupported, speechMetrics, startRecognition, startRecording, type Recognizer, type Recording } from '../lib/speech';
import { update } from '../lib/store';
import { uid } from '../lib/text';
import { fmtTimer, Button, Notice } from './ui';
import { MicNotice } from './Shadow';
import { useStopwatch } from '../lib/hooks';
import { aiCall, aiConfigured, learnerContext } from '../lib/ai';
import { markBlockDone, recordFreeMistake } from '../lib/learning';

export function SpeakRecorder({
  lang,
  context,
  prompt,
  targetSeconds,
  onSaved,
  prepSeconds,
  examMode,
}: {
  lang: Lang;
  context: string;
  prompt: string;
  targetSeconds?: number;
  onSaved?: (transcript: string, seconds: number) => void;
  prepSeconds?: number;
  examMode?: boolean;
}) {
  const [rec, setRec] = useState<Recording | null>(null);
  const [recog, setRecog] = useState<Recognizer | null>(null);
  const [running, setRunning] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const [ai, setAi] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });
  const [prepLeft, setPrepLeft] = useState<number | null>(null);
  const elapsed = useStopwatch(running);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (prepLeft === null) return;
    if (prepLeft <= 0) {
      setPrepLeft(null);
      void begin();
      return;
    }
    const t = setTimeout(() => setPrepLeft((p) => (p === null ? null : p - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepLeft]);

  const begin = async () => {
    setError('');
    setTranscript('');
    setInterim('');
    setSaved(false);
    try {
      if (recordingSupported()) setRec(await startRecording());
    } catch (e) {
      setError(String(e).includes('NotAllowed') ? 'Доступ к микрофону не разрешён. Разрешите его в настройках браузера.' : 'Микрофон недоступен: ' + String(e));
      return;
    }
    if (recognitionSupported()) {
      setRecog(
        startRecognition(
          lang,
          (f, i) => {
            setTranscript(f);
            setInterim(i);
          },
          (m) => setError(m),
          () => setRecog(null),
        ),
      );
    }
    setRunning(true);
  };

  const end = async () => {
    recog?.stop();
    setRunning(false);
    setSeconds(elapsed);
    if (rec) {
      const r = await rec.stop();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = r.url;
      setAudioUrl(r.url);
      setSeconds(Math.round(r.seconds));
      setRec(null);
    }
    setTranscript((t) => (t + ' ' + interim).trim());
    setInterim('');
  };

  useEffect(() => {
    if (running && targetSeconds && examMode && elapsed >= targetSeconds) void end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const metrics = speechMetrics(transcript, seconds || elapsed, lang);

  const save = () => {
    const entry = { id: uid('s'), lang, context, prompt, transcript, seconds, createdAt: Date.now(), metrics, ai: undefined as undefined | { at: number; band: number | null; feedback: string } };
    update((d) => {
      d.speakings.unshift(entry);
      if (d.speakings.length > 200) d.speakings.length = 200;
    });
    setSaved(true);
    markBlockDone('speaking', lang);
    onSaved?.(transcript, seconds);
  };

  const evaluate = async () => {
    setAi({ loading: true });
    try {
      const text = await aiCall({
        task: 'speaking',
        lang,
        messages: [{ role: 'user', content: `Задание: ${prompt}\nДлительность: ${seconds} с\nТранскрипция (автоматическое распознавание, возможны ошибки распознавания):\n${transcript}` }],
        context: { ...learnerContext(lang), exam: lang === 'en' ? 'IELTS Speaking' : 'КАЗТЕСТ Айтылым' },
      });
      setAi({ loading: false, text });
      const band = text.match(/(?:Band|балл)[^\d]{0,15}(\d(?:[.,]5)?)/i);
      update((d) => {
        const sp = d.speakings.find((x) => x.prompt === prompt && x.transcript === transcript);
        if (sp) sp.ai = { at: Date.now(), band: band ? parseFloat(band[1].replace(',', '.')) : null, feedback: text };
      });
      // Сохраняем выявленные AI ошибки в «Мои ошибки»
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*[-•]\s*«(.+?)»\s*→\s*«(.+?)»\s*[—-]\s*(.+)$/);
        if (m) recordFreeMistake({ key: `speak-${m[1]}`, lang, category: 'speaking', topic: lang === 'en' ? 'en.speaking' : 'kk.speaking', prompt: `Устный ответ: ${prompt}`, userAnswer: m[1], correct: m[2], explain: m[3] });
      }
    } catch (e) {
      setAi({ loading: false, error: (e as Error).message });
    }
  };

  const supported = recordingSupported() || recognitionSupported();

  return (
    <div className="mt-3 space-y-3">
      <MicNotice />
      {!supported && <Notice tone="warn">Браузер не поддерживает запись и распознавание речи. Проговорите ответ вслух и при желании запишите ключевые фразы текстом ниже.</Notice>}
      {prepLeft !== null && (
        <div className="rounded-xl bg-warn-soft px-4 py-3 text-center">
          <div className="text-sm">Подготовка</div>
          <div className="text-3xl font-semibold tabular-nums">{fmtTimer(prepLeft)}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!running ? (
          <>
            <Button icon="mic" onClick={() => (prepSeconds ? setPrepLeft(prepSeconds) : void begin())} disabled={prepLeft !== null || !supported}>
              {audioUrl || transcript ? 'Записать заново' : prepSeconds ? `Подготовка ${prepSeconds / 60} мин и запись` : 'Начать запись'}
            </Button>
          </>
        ) : (
          <Button variant="danger" icon="stop" onClick={end}>
            Остановить ({fmtTimer(elapsed)}
            {targetSeconds ? ` / ${fmtTimer(targetSeconds)}` : ''})
          </Button>
        )}
        {audioUrl && <audio src={audioUrl} controls className="h-10 max-w-full" />}
      </div>
      {running && (
        <div className="text-sm text-ink-soft">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-bad" />
          Запись… {targetSeconds && elapsed < targetSeconds * 0.5 && 'Старайтесь говорить без длинных пауз.'}
          {(transcript || interim) && <div className="mt-1 text-ink">«{(transcript + ' ' + interim).trim()}»</div>}
        </div>
      )}
      {error && <p className="text-sm text-warn">{error}</p>}
      {!running && (audioUrl || transcript || !supported) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Транскрипция {recognitionSupported() ? '(распознано автоматически — исправьте ошибки распознавания)' : '(введите вручную)'}</label>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={4} className="w-full rounded-xl border border-line p-3 outline-none focus:border-brand" lang={lang} />
          {!supported && (
            <label className="flex items-center gap-2 text-sm">
              Длительность ответа (сек):
              <input type="number" min={0} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="w-24 rounded-lg border border-line px-2 py-1" />
            </label>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-lg bg-canvas px-2 py-1.5">
              Слов: <strong>{metrics.words}</strong>
            </div>
            <div className="rounded-lg bg-canvas px-2 py-1.5">
              Темп: <strong>{metrics.wpm || '—'}</strong> сл/мин
            </div>
            <div className="rounded-lg bg-canvas px-2 py-1.5">
              Связки: <strong>{metrics.linking}</strong>
            </div>
            <div className="rounded-lg bg-canvas px-2 py-1.5">
              Слова-паразиты: <strong>{metrics.fillers}</strong>
            </div>
          </div>
          <p className="text-xs text-ink-soft">
            Автоматически оцениваются только объём, темп и связность по транскрипции. Произношение и интонация по тексту не оцениваются — прослушайте свою запись. {lang === 'en' && 'Ориентир беглой речи: 100–150 слов в минуту.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!saved && (
              <Button variant="good" icon="check" onClick={save} disabled={!transcript.trim() && !audioUrl}>
                Сохранить ответ
              </Button>
            )}
            {saved && <span className="text-sm text-good">Сохранено.</span>}
            {aiConfigured() && transcript.trim() && (
              <Button variant="secondary" icon="chat" onClick={evaluate} disabled={ai.loading}>
                {ai.loading ? 'AI анализирует…' : 'Анализ AI (предварительно)'}
              </Button>
            )}
          </div>
          {!aiConfigured() && <p className="text-xs text-ink-faint">AI-анализ грамматики и лексики устной речи доступен после подключения AI-сервера в Настройках (платный внешний сервис).</p>}
          {ai.text && (
            <div className="rounded-xl border border-line bg-canvas p-3 text-sm whitespace-pre-line">
              <div className="mb-1 text-xs font-semibold text-warn uppercase">Предварительная оценка AI по транскрипции</div>
              {ai.text}
            </div>
          )}
          {ai.error && <p className="text-sm text-bad">{ai.error}</p>}
        </div>
      )}
    </div>
  );
}
