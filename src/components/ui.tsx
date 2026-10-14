// Базовые UI-компоненты.
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { navigate } from '../lib/router';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export type Tone = 'en' | 'kk' | 'warn' | 'good' | 'bad' | 'brand';

export function Card({ children, className = '', tone, as = 'section' }: { children: ReactNode; className?: string; tone?: Tone; as?: 'section' | 'div' | 'article' }) {
  const toneCls =
    tone === 'en'
      ? 'border-line border-t-brand border-t-[3px]'
      : tone === 'kk'
        ? 'border-line border-t-kk border-t-[3px]'
        : tone === 'warn'
          ? 'border-warn/25 bg-warn-soft'
          : tone === 'good'
            ? 'border-good/25 bg-good-soft'
            : tone === 'bad'
              ? 'border-bad/25 bg-bad-soft'
              : tone === 'brand'
                ? 'border-brand/20 bg-brand-soft'
                : 'border-line';
  const Tag = as;
  return <Tag className={cx('rounded-card border bg-surface p-5 shadow-card sm:p-6', toneCls, className)}>{children}</Tag>;
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'kk' | 'good' | 'quiet' | 'ink';

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  icon,
  iconRight,
  type = 'button',
  size = 'md',
  href,
  title,
  ariaLabel,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  icon?: IconName;
  iconRight?: IconName;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  title?: string;
  ariaLabel?: string;
}) {
  const v: Record<Variant, string> = {
    primary: 'bg-brand text-white shadow-sm hover:bg-brand-ink',
    kk: 'bg-kk text-white shadow-sm hover:bg-kk-ink',
    ink: 'bg-ink text-white shadow-sm hover:bg-ink/90',
    good: 'bg-good text-white shadow-sm hover:brightness-95',
    secondary: 'bg-surface text-ink border border-line-strong hover:bg-subtle',
    quiet: 'bg-subtle text-ink hover:bg-line',
    ghost: 'text-brand hover:bg-brand-soft',
    danger: 'bg-surface text-bad border border-bad/40 hover:bg-bad-soft',
  };
  const s =
    size === 'sm'
      ? 'min-h-11 px-3.5 text-sm rounded-xl'
      : size === 'lg'
        ? 'min-h-[52px] px-6 text-base font-semibold rounded-xl'
        : size === 'xl'
          ? 'min-h-14 px-7 text-[17px] font-semibold rounded-2xl'
          : 'min-h-11 px-4 text-[15px] rounded-xl';
  const iconSize = size === 'sm' ? 16 : size === 'xl' ? 20 : 18;
  return (
    <button
      type={type}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={href ? () => navigate(href) : onClick}
      className={cx('inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45', v[variant], s, className)}
    >
      {icon && <Icon name={icon} size={iconSize} className="shrink-0" />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} className="shrink-0" />}
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad' | 'kk' | 'warm'; className?: string }) {
  const t = {
    neutral: 'bg-subtle text-ink-soft border-line',
    brand: 'bg-brand-soft text-brand-ink border-brand/15',
    good: 'bg-good-soft text-good border-good/20',
    warn: 'bg-warn-soft text-warn border-warn/20',
    bad: 'bg-bad-soft text-bad border-bad/20',
    kk: 'bg-kk-soft text-kk-ink border-kk/20',
    warm: 'bg-warm-soft text-warm-ink border-warm/25',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', t, className)}>{children}</span>;
}

/** Метка языка: EN — синий, KK — бирюзовый. Единые цвета во всём приложении. */
export function LangTag({ lang, long }: { lang: 'en' | 'kk'; long?: boolean }) {
  return <Badge tone={lang === 'en' ? 'brand' : 'kk'}>{long ? (lang === 'en' ? 'Английский' : 'Казахский') : lang === 'en' ? 'EN' : 'KK'}</Badge>;
}

/** Надзаголовок раздела (маленькие прописные). */
export function Eyebrow({ children, tone = 'soft', className = '' }: { children: ReactNode; tone?: 'soft' | 'en' | 'kk' | 'warm'; className?: string }) {
  const c = { soft: 'text-ink-soft', en: 'text-brand', kk: 'text-kk', warm: 'text-warm-ink' }[tone];
  return <div className={cx('text-xs font-semibold tracking-[0.06em] uppercase', c, className)}>{children}</div>;
}

/** Заголовок секции внутри страницы (20–24 px). */
export function SectionTitle({ children, action, sub, className = '' }: { children: ReactNode; action?: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('mb-4 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-xl leading-snug font-semibold sm:text-[22px]">{children}</h2>
        {sub && <div className="mt-1 text-sm text-ink-soft">{sub}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Progress({ value, tone = 'brand', className = '', label }: { value: number; tone?: 'brand' | 'kk' | 'good' | 'warn' | 'warm'; className?: string; label?: string }) {
  const c = { brand: 'bg-brand', kk: 'bg-kk', good: 'bg-good', warn: 'bg-warn', warm: 'bg-warm' }[tone];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-subtle ring-1 ring-line/60 ring-inset', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx('h-full rounded-full transition-all', c)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, tone = 'brand', children, stroke = 6 }: { value: number; size?: number; tone?: 'brand' | 'kk' | 'good' | 'warm'; children?: ReactNode; stroke?: number }) {
  const r = (size - stroke - 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = { brand: 'var(--color-brand)', kk: 'var(--color-kk)', good: 'var(--color-good)', warm: 'var(--color-warm)' }[tone];
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-subtle)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{children ?? `${Math.round(pct)}%`}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, back, actions, eyebrow }: { title: string; subtitle?: ReactNode; back?: string; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8">
      {back && (
        <button onClick={() => navigate(back)} className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-ink-soft hover:bg-surface hover:text-ink" aria-label="Назад">
          <Icon name="chevronLeft" size={18} />
          Назад
        </button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight sm:text-[32px]">{title}</h1>
          {subtitle && <div className="mt-2 text-base text-ink-soft">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Notice({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'warn' | 'good' | 'bad'; title?: string }) {
  const t = {
    info: ['bg-brand-soft border-brand/15', 'text-brand'],
    warn: ['bg-warn-soft border-warn/20', 'text-warn'],
    good: ['bg-good-soft border-good/20', 'text-good'],
    bad: ['bg-bad-soft border-bad/20', 'text-bad'],
  }[tone];
  const icon: IconName = tone === 'warn' || tone === 'bad' ? 'alert' : tone === 'good' ? 'check' : 'info';
  return (
    <div className={cx('flex gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-relaxed text-ink', t[0])} role={tone === 'bad' ? 'alert' : undefined}>
      <Icon name={icon} size={20} className={cx('mt-0.5 shrink-0', t[1])} />
      <div className="min-w-0">
        {title && <div className="mb-0.5 font-semibold">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl leading-tight font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-sm text-ink-faint">{hint}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-subtle p-1 ring-1 ring-line" role="tablist">
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={cx('min-h-10 flex-1 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap transition-colors', value === i.value ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-ink-soft hover:text-ink')}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="safe-bottom max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-raised outline-none sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-subtle" aria-label="Закрыть">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Rich({ text }: { text: string }) {
  // Поддержка **жирного** текста и переносов строк.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i} className="whitespace-pre-line">
            {p}
          </span>
        ),
      )}
    </>
  );
}

export function LinkRow({ href, icon, title, subtitle, right, tone }: { href: string; icon?: IconName; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; tone?: 'en' | 'kk' | 'warm' | 'neutral' }) {
  return (
    <button onClick={() => navigate(href)} className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3.5 rounded-xl px-2 py-2.5 text-left hover:bg-subtle">
      {icon && (
        <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone === 'kk' ? 'bg-kk-soft text-kk' : tone === 'warm' ? 'bg-warm-soft text-warm-ink' : tone === 'neutral' ? 'bg-subtle text-ink-soft' : 'bg-brand-soft text-brand')}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {subtitle && <span className="block text-sm text-ink-soft">{subtitle}</span>}
      </span>
      {right}
      <Icon name="chevronRight" size={18} className="shrink-0 text-ink-faint" />
    </button>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-surface px-5 py-10 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full min-h-12 rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx('min-h-11 rounded-xl border px-4 text-sm font-medium transition-colors', value === o.value ? 'border-brand bg-brand-soft text-brand-ink ring-1 ring-brand' : 'border-line-strong bg-surface text-ink-soft hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Крупный вариант ответа с буквой (A, B, C…) и чётким выбранным состоянием. */
export function OptionButton({
  letter,
  selected,
  state,
  disabled,
  onClick,
  children,
  lang,
}: {
  letter: string;
  selected: boolean;
  state?: 'right' | 'wrong' | 'dim';
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  lang?: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      lang={lang}
      className={cx(
        'flex min-h-14 w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-[17px] transition-colors disabled:cursor-not-allowed',
        state === 'right' ? 'border-good bg-good-soft' : state === 'wrong' ? 'border-bad bg-bad-soft' : selected ? 'border-brand bg-brand-soft' : state === 'dim' ? 'border-line opacity-70' : 'border-line hover:border-line-strong hover:bg-subtle disabled:opacity-50',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
          state === 'right' ? 'border-good bg-good text-white' : state === 'wrong' ? 'border-bad bg-bad text-white' : selected ? 'border-brand bg-brand text-white' : 'border-line-strong text-ink-soft',
        )}
      >
        {state === 'right' ? <Icon name="check" size={16} strokeWidth={2.75} /> : state === 'wrong' ? <Icon name="x" size={16} strokeWidth={2.75} /> : letter}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/** Шкала уровня CEFR из шести делений (A0…C1). */
export const CEFR = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
export function LevelScale({ level, tone = 'brand' }: { level: string | null; tone?: 'brand' | 'kk' }) {
  const idx = level ? CEFR.indexOf(level) : -1;
  return (
    <div className="flex gap-1" role="img" aria-label={level ? `Уровень ${level} по шкале A0–C1` : 'Не проверено'}>
      {CEFR.map((l, i) => (
        <span key={l} className={cx('h-2 flex-1 rounded-full', idx < 0 ? 'border border-dashed border-line-strong' : i <= idx ? (tone === 'kk' ? 'bg-kk' : 'bg-brand') : 'bg-subtle ring-1 ring-line ring-inset')} />
      ))}
    </div>
  );
}

/** Закреплённая внизу панель главного действия (Проверить / Далее). Учитывает safe area iPhone
 *  и нижнюю навигацию. На телефоне кнопки растягиваются на всю ширину. */
export function ActionBar({ children, className = '', left }: { children: ReactNode; className?: string; left?: ReactNode }) {
  return (
    <div className={cx('action-bar -mx-4 mt-6 border-t border-line bg-canvas/95 px-4 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10', className)}>
      <div className="flex items-center gap-3">
        {left && <div className="min-w-0 flex-1 text-sm text-ink-soft">{left}</div>}
        <div className={cx('flex gap-2', left ? 'shrink-0' : 'flex-1 justify-end', '[&>button]:flex-1 sm:[&>button]:flex-none sm:[&>button]:min-w-40')}>{children}</div>
      </div>
    </div>
  );
}

export function fmtMin(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

export function fmtTimer(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
