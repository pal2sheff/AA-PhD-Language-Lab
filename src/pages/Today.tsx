import { useEffect, useState } from 'react';
import { useAppState } from '../lib/store';
import { today, formatDate } from '../lib/dates';
import { courseDay, planProgress, weekGoal, minutesSplit } from '../lib/planner';
import { addBlockToToday, ensureTodayPlan, moveBlock, postponeBlock, regenerateTodayPlan, toggleBlockDone } from '../lib/learning';
import type { PlanBlock } from '../lib/state';
import { navigate } from '../lib/router';
import { Button, Card, Empty, Eyebrow, LangTag, Modal, PageHeader, Progress, SectionTitle, cx } from '../components/ui';
import { Icon } from '../components/icons';
import { LESSONS } from '../data';
import type { Lang } from '../data/types';

export function PlanList({ blocks, compact, editable }: { blocks: PlanBlock[]; compact?: boolean; editable?: boolean }) {
  if (!blocks.length) return <Empty title="План пуст">Добавьте занятие или сформируйте план заново.</Empty>;
  const firstOpen = blocks.find((b) => !b.done)?.id;
  return (
    <ul className="-my-1 divide-y divide-line">
      {blocks.map((b, i) => (
        <li key={b.id} className="flex items-center gap-2 py-1.5">
          <button
            onClick={() => toggleBlockDone(b.id)}
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-subtle"
            aria-label={b.done ? `Снять отметку: ${b.title}` : `Отметить выполненным: ${b.title}`}
            title={b.done ? 'Снять отметку' : 'Отметить выполненным вручную'}
          >
            <span className={cx('flex h-6 w-6 items-center justify-center rounded-full border-2', b.done ? 'border-good bg-good text-white' : b.id === firstOpen ? 'border-brand' : 'border-line-strong')}>
              {b.done && <Icon name="check" size={14} strokeWidth={2.75} />}
            </span>
          </button>
          <button onClick={() => navigate(b.route.replace(/^#/, ''))} className="group flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl py-1.5 text-left">
            <span className="min-w-0 flex-1">
              <span className={cx('block leading-snug font-medium', b.done && 'text-ink-faint line-through')}>{b.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                <LangTag lang={b.lang} />
                <span className="tabular-nums">{b.minutes} мин</span>
                {b.id === firstOpen && !compact && <span className="font-medium text-brand">· следующий</span>}
              </span>
              {!compact && b.why && <span className="mt-1 block text-sm text-ink-soft">{b.why}</span>}
            </span>
            <Icon name="chevronRight" size={18} className="shrink-0 text-ink-faint group-hover:text-ink-soft" />
          </button>
          {editable && (
            <div className="flex shrink-0 flex-col sm:flex-row">
              <button className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-subtle disabled:opacity-30" disabled={i === 0} onClick={() => moveBlock(b.id, -1)} aria-label="Выше">
                <Icon name="up" size={17} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-subtle disabled:opacity-30" disabled={i === blocks.length - 1} onClick={() => moveBlock(b.id, 1)} aria-label="Ниже">
                <Icon name="down" size={17} />
              </button>
              {!b.done && (
                <button className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-subtle" onClick={() => postponeBlock(b.id)} aria-label="Отложить на завтра" title="Отложить на завтра">
                  <Icon name="clock" size={17} />
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function TodayPage() {
  const s = useAppState();
  const date = today();
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    ensureTodayPlan(date);
  }, [date]);
  const plan = s.plans[date]?.blocks ?? [];
  const p = planProgress(plan);
  const day = courseDay(s.settings, date);
  const split = minutesSplit(s.settings);
  const g = weekGoal(Math.max(1, Math.min(day, s.settings.courseDays)), s.settings.courseDays);
  const act = s.activity[date];

  const next = plan.find((b) => !b.done);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span className="text-sm text-ink-soft">{formatDate(date, true)} · день {day} из {s.settings.courseDays}</span>}
        title="Сегодня"
        subtitle={`План: английский ${split.en} мин, казахский ${split.kk} мин`}
      />
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-ink-soft">Выполнено</div>
            <div className="text-3xl font-semibold tabular-nums">{p.pct}%</div>
            <div className="mt-1 text-sm text-ink-soft">
              {p.done} из {p.total} мин по плану · фактически {Math.round((act?.seconds ?? 0) / 60)} мин
            </div>
          </div>
          {next && (
            <Button size="lg" icon="play" onClick={() => navigate(next.route.replace(/^#/, ''))} className="w-full sm:w-auto">
              Продолжить занятие
            </Button>
          )}
        </div>
        <Progress value={p.pct} className="mt-4" label="Выполнение плана" />
      </Card>

      <Card>
        <SectionTitle
          sub="Блоки по 5–15 минут — в любое время дня. Выполненные отмечаются автоматически."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon="plus" onClick={() => setAdding(true)} ariaLabel="Добавить занятие">
                <span className="hidden sm:inline">Добавить</span>
              </Button>
              <Button variant="secondary" size="sm" icon="refresh" onClick={() => regenerateTodayPlan(date)} ariaLabel="Пересобрать план">
                <span className="hidden sm:inline">Пересобрать</span>
              </Button>
            </div>
          }
        >
          План на день
        </SectionTitle>
        <PlanList blocks={plan} editable />
        <p className="mt-4 text-sm text-ink-soft">Отложенный блок переносится на завтра и заменяет менее важный блок — дневная нагрузка не растёт.</p>
      </Card>

      <Card>
        <Eyebrow tone="warm">Неделя {g.week}</Eyebrow>
        <h2 className="mt-1 text-xl font-semibold">{g.title}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-ink-soft">Учебные цели</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {g.goals.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-soft">Измеримые результаты</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {g.results.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <AddBlockModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function AddBlockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lang, setLang] = useState<Lang>('en');
  const add = (b: Omit<PlanBlock, 'id' | 'done'>) => {
    addBlockToToday(b);
    onClose();
  };
  const lessons = LESSONS.filter((l) => l.lang === lang);
  return (
    <Modal open={open} onClose={onClose} title="Выбрать тему самостоятельно">
      <div className="mb-3 flex gap-2">
        <Button size="sm" variant={lang === 'en' ? 'primary' : 'secondary'} onClick={() => setLang('en')}>
          Английский
        </Button>
        <Button size="sm" variant={lang === 'kk' ? 'kk' : 'secondary'} onClick={() => setLang('kk')}>
          Казахский
        </Button>
      </div>
      <div className="mb-2 text-sm font-semibold text-ink-soft">Тренажёры</div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          { kind: 'vocab' as const, title: 'Повторение слов', route: `#/vocab/review/${lang}`, minutes: 10 },
          { kind: 'mistakes' as const, title: 'Работа над ошибками', route: `#/mistakes/review/${lang}`, minutes: 10 },
          { kind: 'dictation' as const, title: 'Аудиодиктант', route: `#/dictation/${lang}`, minutes: 10 },
          { kind: 'pronunciation' as const, title: 'Произношение', route: `#/pronunciation/${lang}`, minutes: 5 },
          { kind: 'reading' as const, title: lang === 'en' ? 'IELTS Reading' : 'Оқылым', route: lang === 'en' ? '#/ielts/reading' : '#/kaztest/reading', minutes: 15 },
          { kind: 'listening' as const, title: lang === 'en' ? 'IELTS Listening' : 'Тыңдалым', route: lang === 'en' ? '#/ielts/listening' : '#/kaztest/listening', minutes: 15 },
          { kind: 'writing' as const, title: lang === 'en' ? 'IELTS Writing' : 'Жазылым', route: lang === 'en' ? '#/ielts/writing' : '#/kaztest/writing', minutes: 20 },
          { kind: 'speaking' as const, title: lang === 'en' ? 'IELTS Speaking' : 'Айтылым', route: lang === 'en' ? '#/ielts/speaking' : '#/kaztest/speaking', minutes: 10 },
        ].map((b) => (
          <button key={b.kind} onClick={() => add({ ...b, lang })} className="min-h-14 rounded-xl border border-line px-3 py-2.5 text-left text-sm hover:bg-subtle">
            <div className="font-medium">{b.title}</div>
            <div className="text-sm text-ink-soft">{b.minutes} мин</div>
          </button>
        ))}
      </div>
      <div className="mb-2 text-sm font-semibold text-ink-soft">Уроки (в том числе повтор пройденных)</div>
      <div className="space-y-1">
        {lessons.map((l) => (
          <button key={l.id} onClick={() => add({ lang, kind: 'lesson', title: `Урок: ${l.title}`, minutes: l.minutes, route: `#/lesson/${l.id}`, ref: l.id })} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm hover:bg-subtle">
            <span>{l.title}</span>
            <span className="shrink-0 text-ink-soft">{l.minutes} мин</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
