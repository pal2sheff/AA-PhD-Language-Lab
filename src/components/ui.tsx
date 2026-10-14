// Базовые UI-компоненты.
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { navigate } from '../lib/router';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Card({ children, className = '', tone }: { children: ReactNode; className?: string; tone?: 'en' | 'kk' | 'warn' | 'good' | 'bad' | 'brand' }) {
  const toneCls =
    tone === 'en'
      ? 'border-brand/20'
      : tone === 'kk'
        ? 'border-kk/25'
        : tone === 'warn'
          ? 'border-warn/30 bg-warn-soft'
          : tone === 'good'
            ? 'border-good/30 bg-good-soft'
            : tone === 'bad'
              ? 'border-bad/30 bg-bad-soft'
              : tone === 'brand'
                ? 'border-brand/25 bg-brand-soft'
                : 'border-line';
  return <section className={cx('rounded-2xl border bg-surface p-4 sm:p-5', toneCls, className)}>{children}</section>;
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'kk' | 'good';

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  icon,
  type = 'button',
  size = 'md',
  href,
  title,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  icon?: IconName;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  title?: string;
}) {
  const v: Record<Variant, string> = {
    primary: 'bg-brand text-white hover:bg-brand-ink',
    kk: 'bg-kk text-white hover:opacity-90',
    good: 'bg-good text-white hover:opacity-90',
    secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
    ghost: 'text-brand hover:bg-brand-soft',
    danger: 'bg-surface text-bad border border-bad/40 hover:bg-bad-soft',
  };
  const s = size === 'sm' ? 'min-h-9 px-3 text-sm' : size === 'lg' ? 'min-h-13 px-5 text-base' : 'min-h-11 px-4 text-[15px]';
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={href ? () => navigate(href) : onClick}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45', v[variant], s, className)}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad' | 'kk'; className?: string }) {
  const t = {
    neutral: 'bg-canvas text-ink-soft border-line',
    brand: 'bg-brand-soft text-brand-ink border-brand/20',
    good: 'bg-good-soft text-good border-good/25',
    warn: 'bg-warn-soft text-warn border-warn/25',
    bad: 'bg-bad-soft text-bad border-bad/25',
    kk: 'bg-kk-soft text-kk border-kk/25',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap', t, className)}>{children}</span>;
}

export function Progress({ value, tone = 'brand', className = '', label }: { value: number; tone?: 'brand' | 'kk' | 'good' | 'warn'; className?: string; label?: string }) {
  const c = { brand: 'bg-brand', kk: 'bg-kk', good: 'bg-good', warn: 'bg-warn' }[tone];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-line', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx('h-full rounded-full transition-all', c)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, tone = 'brand', children }: { value: number; size?: number; tone?: 'brand' | 'kk' | 'good'; children?: ReactNode }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = { brand: 'var(--color-brand)', kk: 'var(--color-kk)', good: 'var(--color-good)' }[tone];
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-line)" strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{children ?? `${Math.round(pct)}%`}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, back, actions }: { title: string; subtitle?: ReactNode; back?: string; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex items-start gap-3">
      {back && (
        <button onClick={() => navigate(back)} className="mt-0.5 -ml-2 rounded-lg p-2 text-ink-soft hover:bg-surface" aria-label="Назад">
          <Icon name="chevronLeft" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <div className="mt-0.5 text-sm text-ink-soft">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

export function Notice({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'warn' | 'good' | 'bad'; title?: string }) {
  const t = {
    info: 'bg-brand-soft border-brand/20 text-brand-ink',
    warn: 'bg-warn-soft border-warn/25 text-[#7c3d0a]',
    good: 'bg-good-soft border-good/25 text-[#14532d]',
    bad: 'bg-bad-soft border-bad/25 text-[#7f1d1d]',
  }[tone];
  const icon: IconName = tone === 'warn' || tone === 'bad' ? 'alert' : tone === 'good' ? 'check' : 'info';
  return (
    <div className={cx('flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm', t)}>
      <Icon name={icon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-line/60 p-1" role="tablist">
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={cx('min-h-9 flex-1 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors', value === i.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink')}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="safe-bottom max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-surface p-5 outline-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-soft hover:bg-canvas" aria-label="Закрыть">
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

export function LinkRow({ href, icon, title, subtitle, right }: { href: string; icon?: IconName; title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <button onClick={() => navigate(href)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-canvas">
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
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
    <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-8 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full min-h-11 rounded-xl border border-line bg-surface px-3 py-2 outline-none focus:border-brand';

export function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx('min-h-10 rounded-xl border px-3.5 text-sm font-medium', value === o.value ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-surface text-ink-soft hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
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
