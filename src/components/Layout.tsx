import { useEffect, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { cx } from './ui';
import { Logo, LogoMark } from './Logo';
import { navigate, useRoute } from '../lib/router';

type NavItem = { href: string; label: string; icon: IconName; match: (p: string[]) => boolean };

const is =
  (...names: string[]) =>
  (p: string[]) =>
    names.includes(p[0] ?? '');
/** Урок и диагностика относятся к своему языку (идентификаторы уроков начинаются с en-/kk-). */
const langOf = (p: string[]) => (p[0] === 'lesson' ? ((p[1] ?? '').startsWith('kk') ? 'kk' : 'en') : p[0] === 'diagnostic' ? (p[1] === 'kk' ? 'kk' : 'en') : null);

export const NAV_GROUPS: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [{ href: '/', label: 'Главная', icon: 'home', match: (p) => p.length === 0 }] },
  {
    title: 'Обучение',
    items: [
      { href: '/today', label: 'Сегодня', icon: 'today', match: is('today', 'practice', 'checkpoint') },
      { href: '/en', label: 'Английский', icon: 'book2', match: (p) => p[0] === 'en' || langOf(p) === 'en' },
      { href: '/kk', label: 'Казахский', icon: 'book2', match: (p) => p[0] === 'kk' || langOf(p) === 'kk' },
    ],
  },
  {
    title: 'Практика',
    items: [
      { href: '/vocab', label: 'Словарь', icon: 'cards', match: is('vocab') },
      { href: '/pronunciation/en', label: 'Произношение', icon: 'headphones', match: is('pronunciation', 'dictation') },
      { href: '/conversation', label: 'Разговорный тренажёр', icon: 'mic', match: is('conversation') },
      { href: '/mistakes', label: 'Мои ошибки', icon: 'flag', match: is('mistakes') },
      { href: '/tutor', label: 'AI-преподаватель', icon: 'chat', match: is('tutor') },
    ],
  },
  {
    title: 'Экзамены',
    items: [
      { href: '/ielts', label: 'IELTS Academic', icon: 'target', match: is('ielts') },
      { href: '/kaztest', label: 'КАЗТЕСТ', icon: 'target', match: is('kaztest') },
      { href: '/exams', label: 'Пробные экзамены', icon: 'clock', match: is('exams', 'exam') },
    ],
  },
  {
    title: 'Прогресс',
    items: [
      { href: '/calendar', label: 'Календарь', icon: 'calendar', match: is('calendar') },
      { href: '/stats', label: 'Статистика', icon: 'chart', match: is('stats') },
    ],
  },
  {
    title: 'Дополнительно',
    items: [
      { href: '/medical', label: 'Английский для врача', icon: 'stethoscope', match: is('medical') },
      { href: '/emergency', label: 'Экстренная подготовка', icon: 'bolt', match: is('emergency') },
      { href: '/settings', label: 'Настройки', icon: 'settings', match: is('settings', 'onboarding') },
    ],
  },
];

/** Плоский список разделов (для совместимости и поиска по меню). */
export const SECTIONS = NAV_GROUPS.flatMap((g) => g.items);

/** Нижняя навигация iPhone: пять основных пунктов. */
const BOTTOM: { href: string; label: string; icon: IconName; match: (p: string[]) => boolean }[] = [
  { href: '/', label: 'Главная', icon: 'home', match: (p) => p.length === 0 },
  { href: '/today', label: 'Сегодня', icon: 'today', match: is('today', 'practice', 'checkpoint') },
  { href: '/courses', label: 'Курсы', icon: 'grad', match: is('courses', 'en', 'kk', 'lesson', 'diagnostic', 'vocab', 'pronunciation', 'dictation', 'conversation', 'mistakes', 'tutor', 'medical') },
  { href: '/exam-center', label: 'Экзамены', icon: 'target', match: is('exam-center', 'ielts', 'kaztest', 'exams', 'exam', 'emergency') },
];

/** «Режим фокуса»: во время урока, диагностики, экзамена и повторения нижняя навигация скрыта,
 *  чтобы закреплённая кнопка действия не перекрывалась. Выход — кнопка «Назад» в заголовке. */
export function isFocusRoute(p: string[]) {
  return p[0] === 'lesson' || p[0] === 'exam' || p[0] === 'checkpoint' || (p[0] === 'diagnostic' && !!p[2]) || ((p[0] === 'vocab' || p[0] === 'mistakes') && p[1] === 'review');
}

export function Layout({ children }: { children: ReactNode }) {
  const { parts } = useRoute();
  const [menu, setMenu] = useState(false);
  const focus = isFocusRoute(parts);
  const wide = parts[0] === 'exam' || parts[0] === 'ielts' || parts[0] === 'kaztest';
  const moreActive = !BOTTOM.some((b) => b.match(parts));
  const path = parts.join('/');

  useEffect(() => setMenu(false), [path]);

  return (
    <div className="min-h-dvh">
      <a href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:shadow-raised">
        К содержимому
      </a>

      {/* Боковая панель (планшет в альбомной ориентации и компьютер) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-surface lg:flex">
        <button onClick={() => navigate('/')} className="mx-3 mt-4 mb-2 rounded-2xl px-3 py-3 text-left hover:bg-subtle" aria-label="AA PhD Language Lab — на главную">
          <Logo />
        </button>
        <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Разделы">
          {NAV_GROUPS.map((g, gi) => (
            <div key={gi} className={gi ? 'mt-4' : 'mt-1'}>
              {g.title && <div className="mb-1.5 px-3 text-xs font-semibold tracking-[0.06em] text-ink-faint uppercase">{g.title}</div>}
              <ul className="space-y-0.5">
                {g.items.map((s) => {
                  const active = s.match(parts);
                  return (
                    <li key={s.href}>
                      <button
                        onClick={() => navigate(s.href)}
                        aria-current={active ? 'page' : undefined}
                        className={cx(
                          'relative flex min-h-9 w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-[15px] transition-colors',
                          active ? 'bg-brand-soft font-semibold text-brand-ink' : 'text-ink-soft hover:bg-subtle hover:text-ink',
                        )}
                      >
                        {active && <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand" aria-hidden="true" />}
                        <Icon name={s.icon} size={19} className="shrink-0" />
                        <span className="min-w-0 truncate">{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        {/* Верхняя полоса на телефоне: фирменный знак (вне режима фокуса) */}
        {!focus && (
          <div className="safe-top lg:hidden">
            <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
              <button onClick={() => navigate('/')} className="-ml-1 flex min-h-11 items-center gap-2.5 rounded-xl px-1" aria-label="На главную">
                <LogoMark size={30} />
                <span className="text-[15px] font-semibold tracking-tight">Language Lab</span>
              </button>
              <button onClick={() => navigate('/settings')} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-surface" aria-label="Настройки">
                <Icon name="settings" size={21} />
              </button>
            </div>
          </div>
        )}
        <main
          id="main"
          tabIndex={-1}
          className={cx(
            'mx-auto px-4 outline-none sm:px-6 lg:px-10 lg:pt-10',
            focus ? 'safe-top pt-3 pb-8 lg:pb-12' : 'pt-2 pb-32 lg:pb-14',
            wide ? 'max-w-3xl lg:max-w-6xl' : 'max-w-3xl lg:max-w-5xl',
          )}
        >
          {children}
        </main>
      </div>

      {/* Нижняя навигация (iPhone): пять пунктов */}
      {!focus && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden" aria-label="Основная навигация">
          <div className="mx-auto flex max-w-xl px-1">
            {BOTTOM.map((b) => {
              const active = b.match(parts);
              return (
                <button
                  key={b.href}
                  onClick={() => navigate(b.href)}
                  aria-current={active ? 'page' : undefined}
                  className={cx('flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium', active ? 'text-brand' : 'text-ink-soft')}
                >
                  <span className={cx('flex h-7 w-12 items-center justify-center rounded-full transition-colors', active && 'bg-brand-soft')}>
                    <Icon name={b.icon} size={21} strokeWidth={active ? 2.1 : 1.8} />
                  </span>
                  {b.label}
                </button>
              );
            })}
            <button
              onClick={() => setMenu(true)}
              aria-haspopup="dialog"
              aria-expanded={menu}
              className={cx('flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium', menu || moreActive ? 'text-brand' : 'text-ink-soft')}
            >
              <span className={cx('flex h-7 w-12 items-center justify-center rounded-full', (menu || moreActive) && 'bg-brand-soft')}>
                <Icon name="dots" size={21} />
              </span>
              Ещё
            </button>
          </div>
        </nav>
      )}

      {menu && <MoreSheet parts={parts} onClose={() => setMenu(false)} />}
    </div>
  );
}

/** Лист «Ещё»: все разделы, сгруппированные, в две колонки — без длинной прокрутки. */
function MoreSheet({ parts, onClose }: { parts: string[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-ink/45 lg:hidden" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Все разделы"
        className="safe-bottom absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-surface px-4 pt-3 pb-4 shadow-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <div className="mb-1 flex items-center justify-between">
          <div className="text-lg font-semibold">Все разделы</div>
          <button onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft" aria-label="Закрыть меню">
            <Icon name="x" />
          </button>
        </div>
        {NAV_GROUPS.filter((g) => g.title).map((g) => (
          <div key={g.title} className="mt-3">
            <div className="mb-1.5 text-xs font-semibold tracking-[0.06em] text-ink-faint uppercase">{g.title}</div>
            <div className="grid grid-cols-2 gap-2">
              {g.items.map((s) => {
                const active = s.match(parts);
                return (
                  <button
                    key={s.href}
                    onClick={() => {
                      onClose();
                      navigate(s.href);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={cx('flex min-h-12 items-center gap-2.5 rounded-xl border px-3 text-left text-sm font-medium', active ? 'border-brand/30 bg-brand-soft text-brand-ink' : 'border-line text-ink')}
                  >
                    <Icon name={s.icon} size={18} className={cx('shrink-0', active ? 'text-brand' : 'text-ink-soft')} />
                    <span className="min-w-0">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
