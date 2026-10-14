// Фирменный знак AA PhD Language Lab: монограмма «AA» с тёплой перемычкой —
// «мост» между двумя языками. Та же геометрия, что в public/icons/icon.svg.
import { cx } from './ui';

export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={cx('shrink-0', className)} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#1d3f7a" />
      <g fill="none" stroke="#ffffff" strokeWidth="36" strokeLinejoin="miter" strokeMiterlimit="8">
        <polyline points="92,384 174,148 256,384" />
        <polyline points="256,384 338,148 420,384" />
      </g>
      <rect x="122" y="296" width="268" height="28" rx="4" fill="#c9a161" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <LogoMark size={compact ? 32 : 38} />
      <span className="min-w-0 leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-ink">AA PhD Language Lab</span>
        {!compact && <span className="block text-xs text-ink-soft">90 дней до IELTS и КАЗТЕСТ</span>}
      </span>
    </span>
  );
}
