import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { cx } from './ui';
import { navigate, useRoute } from '../lib/router';

export const SECTIONS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: '/', label: 'Главная', icon: 'home', match: [''] },
  { href: '/today', label: 'Мои занятия', icon: 'today', match: ['today', 'lesson', 'practice', 'checkpoint'] },
  { href: '/en', label: 'Английский язык', icon: 'book', match: ['en'] },
  { href: '/kk', label: 'Казахский язык', icon: 'book', match: ['kk'] },
  { href: '/ielts', label: 'IELTS Academic', icon: 'target', match: ['ielts'] },
  { href: '/kaztest', label: 'КАЗТЕСТ', icon: 'target', match: ['kaztest'] },
  { href: '/tutor', label: 'AI-преподаватель', icon: 'chat', match: ['tutor'] },
  { href: '/conversation', label: 'Разговорный тренажёр', icon: 'mic', match: ['conversation'] },
  { href: '/pronunciation/en', label: 'Произношение и диктанты', icon: 'headphones', match: ['pronunciation', 'dictation'] },
  { href: '/vocab', label: 'Словарь', icon: 'cards', match: ['vocab'] },
  { href: '/mistakes', label: 'Мои ошибки', icon: 'flag', match: ['mistakes'] },
  { href: '/exams', label: 'Пробные экзамены', icon: 'clock', match: ['exams', 'exam'] },
  { href: '/calendar', label: 'Календарь', icon: 'calendar', match: ['calendar'] },
  { href: '/stats', label: 'Статистика', icon: 'chart', match: ['stats'] },
  { href: '/medical', label: 'Английский для врача', icon: 'stethoscope', match: ['medical'] },
  { href: '/emergency', label: 'Экстренная подготовка', icon: 'bolt', match: ['emergency'] },
  { href: '/settings', label: 'Настройки', icon: 'settings', match: ['settings', 'diagnostic', 'onboarding'] },
];

const BOTTOM = ['/', '/today', '/vocab', '/stats'];

function isActive(match: string[], first: string) {
  return match.includes(first);
}

export function Layout({ children }: { children: ReactNode }) {
  const { parts } = useRoute();
  const first = parts[0] ?? '';
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-dvh">
      {/* Боковая панель (планшет / компьютер) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <button onClick={() => navigate('/')} className="px-5 pt-5 pb-4 text-left">
          <div className="text-[15px] font-semibold tracking-tight">AA PhD Language Lab</div>
          <div className="text-xs text-ink-soft">90 дней до IELTS и КАЗТЕСТ</div>
        </button>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {SECTIONS.map((s) => (
            <button
              key={s.href}
              onClick={() => navigate(s.href)}
              className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', isActive(s.match, first) ? 'bg-brand-soft font-medium text-brand-ink' : 'text-ink-soft hover:bg-canvas hover:text-ink')}
            >
              <Icon name={s.icon} size={18} />
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="mx-auto max-w-3xl px-4 pt-4 pb-28 lg:ml-64 lg:max-w-4xl lg:px-8 lg:pt-8 lg:pb-12 safe-top">{children}</main>

      {/* Нижняя навигация (iPhone) */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden" aria-label="Основная навигация">
        <div className="mx-auto flex max-w-xl">
          {BOTTOM.map((href) => {
            const s = SECTIONS.find((x) => x.href === href)!;
            const active = isActive(s.match, first);
            const label = href === '/' ? 'Главная' : href === '/today' ? 'Занятия' : s.label;
            return (
              <button key={href} onClick={() => navigate(href)} className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', active ? 'text-brand' : 'text-ink-soft')}>
                <Icon name={s.icon} size={22} />
                {label}
              </button>
            );
          })}
          <button onClick={() => setMenu(true)} className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', menu ? 'text-brand' : 'text-ink-soft')}>
            <Icon name="menu" size={22} />
            Ещё
          </button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMenu(false)}>
          <div className="safe-bottom absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold">Все разделы</div>
              <button onClick={() => setMenu(false)} className="rounded-lg p-2 text-ink-soft" aria-label="Закрыть меню">
                <Icon name="x" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.href}
                  onClick={() => {
                    setMenu(false);
                    navigate(s.href);
                  }}
                  className={cx('flex min-h-14 items-center gap-2.5 rounded-xl border px-3 text-left text-sm', isActive(s.match, first) ? 'border-brand/30 bg-brand-soft text-brand-ink' : 'border-line')}
                >
                  <Icon name={s.icon} size={18} className="shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
