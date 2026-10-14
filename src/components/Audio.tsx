import { useEffect, useState } from 'react';
import type { Lang } from '../data/types';
import { speak, stopSpeaking, voiceInfo, type Accent } from '../lib/speech';
import { useVoices } from '../lib/hooks';
import { Icon } from './icons';
import { cx } from './ui';

/** Кнопка озвучивания. Если голоса нет — честно предлагает показать текст. */
export function SpeakButton({
  text,
  lang,
  accent,
  label = 'Прослушать',
  rate,
  onPlayed,
  compact,
  allowReveal = true,
}: {
  text: string;
  lang: Lang;
  accent?: Accent;
  label?: string;
  rate?: number;
  onPlayed?: () => void;
  compact?: boolean;
  allowReveal?: boolean;
}) {
  useVoices();
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const info = voiceInfo(lang, accent);
  useEffect(() => () => stopSpeaking(), []);
  // Новый текст — новое задание: раскрытый текст и состояние воспроизведения сбрасываются.
  useEffect(() => {
    setRevealed(false);
    setPlaying(false);
  }, [text]);
  if (!info.ok && compact) {
    // В списках не загромождаем экран: неактивная кнопка с пояснением во всплывающей подсказке.
    return (
      <span
        className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-faint"
        title={info.note ?? 'Озвучка недоступна'}
        aria-label={info.note ?? 'Озвучка недоступна'}
        role="img"
      >
        <Icon name="speaker" size={16} />
      </span>
    );
  }
  if (!info.ok) {
    return (
      <div className="rounded-xl border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-[#7c3d0a]">
        <div className="flex items-start gap-2">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          <span>{info.note}</span>
        </div>
        {allowReveal &&
          (revealed ? (
            <p className="mt-2 rounded-lg bg-surface px-2 py-1.5 font-medium text-ink">{text}</p>
          ) : (
            <button
              className="mt-2 text-sm font-medium text-brand underline"
              onClick={() => {
                setRevealed(true);
                onPlayed?.();
              }}
            >
              Показать текст (упражнение станет чтением)
            </button>
          ))}
      </div>
    );
  }
  return (
    <span className="inline-flex flex-col">
      <button
        onClick={() => {
          if (playing) {
            stopSpeaking();
            setPlaying(false);
            return;
          }
          const ok = speak(text, lang, { accent, rate, onEnd: () => setPlaying(false) });
          if (ok) {
            setPlaying(true);
            onPlayed?.();
          }
        }}
        className={cx(
          'inline-flex items-center gap-2 rounded-xl border font-medium transition-colors',
          compact ? 'min-h-9 px-2.5 text-sm' : 'min-h-11 px-4',
          lang === 'kk' ? 'border-kk/30 bg-kk-soft text-kk' : 'border-brand/25 bg-brand-soft text-brand-ink',
        )}
        aria-label={label}
      >
        <Icon name={playing ? 'stop' : 'speaker'} size={compact ? 16 : 18} />
        {!compact && (playing ? 'Стоп' : label)}
      </button>
      {info.note && !compact && <span className="mt-1 max-w-xs text-xs text-warn">{info.note}</span>}
    </span>
  );
}

export function VoiceLabel({ lang, accent }: { lang: Lang; accent?: Accent }) {
  useVoices();
  const i = voiceInfo(lang, accent);
  return (
    <p className="text-xs text-ink-faint">
      Озвучка: синтезатор речи устройства{i.voiceName ? ` — ${i.voiceName}` : ''}. Это не запись носителя языка.
    </p>
  );
}
