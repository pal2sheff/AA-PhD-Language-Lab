import { useEffect, useState } from 'react';
import { useAppState } from '../lib/store';
import { today, formatDate } from '../lib/dates';
import { courseDay, planProgress, weekGoal, minutesSplit } from '../lib/planner';
import { addBlockToToday, ensureTodayPlan, moveBlock, postponeBlock, regenerateTodayPlan, toggleBlockDone } from '../lib/learning';
import type { PlanBlock } from '../lib/state';
import { navigate } from '../lib/router';
import { Badge, Button, Card, Empty, Modal, PageHeader, Progress, cx } from '../components/ui';
import { Icon } from '../components/icons';
import { LESSONS } from '../data';
import type { Lang } from '../data/types';

export function PlanList({ blocks, compact, editable }: { blocks: PlanBlock[]; compact?: boolean; editable?: boolean }) {
  if (!blocks.length) return <Empty title="План пуст">Добавьте занятие или сформируйте план заново.</Empty>;
  return (
    <ul className="divide-y divide-line">
      {blocks.map((b, i) => (
        <li key={b.id} className="flex items-center gap-3 py-2.5">
          <button
            onClick={() => toggleBlockDone(b.id)}
            className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', b.done ? 'border-good bg-good text-white' : 'border-line')}
            aria-label={b.done ? 'Снять отметку' : 'Отметить выполненным'}
            title={b.done ? 'Снять отметку' : 'Отметить выполненным вручную'}
          >
            {b.done && <Icon name="check" size={14} strokeWidth={2.5} />}
          </button>
          <button onClick={() => navigate(b.route.replace(/^#/, ''))} className="min-w-0 flex-1 text-left">
            <div className={cx('flex items-center gap-2', b.done && 'text-ink-faint line-through')}>
              <Badge tone={b.lang === 'en' ? 'brand' : 'kk'}>{b.lang === 'en' ? 'EN' : 'KK'}</Badge>
              <span className="truncate font-medium">{b.title}</span>
            </div>
            {!compact && b.why && <div className="mt-0.5 text-xs text-ink-soft">{b.why}</div>}
          </button>
          <span className="shrink-0 text-sm text-ink-soft tabular-nums">{b.minutes} мин</span>
          {editable && (
            <div className="flex shrink-0">
              <button className="rounded p-1.5 text-ink-soft hover:bg-canvas disabled:opacity-30" disabled={i === 0} onClick={() => moveBlock(b.id, -1)} aria-label="Выше">
                <Icon name="up" size={16} />
              </button>
              <button className="rounded p-1.5 text-ink-soft hover:bg-canvas disabled:opacity-30" disabled={i === blocks.length - 1} onClick={() => moveBlock(b.id, 1)} aria-label="Ниже">
                <Icon name="down" size={16} />
              </button>
              {!b.done && (
                <button className="rounded p-1.5 text-ink-soft hover:bg-canvas" onClick={() => postponeBlock(b.id)} aria-label="Отложить на завтра" title="Отложить на завтра">
                  <Icon name="clock" size={16} />
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Мои занятия"
        subtitle={`${formatDate(date, true)} · день ${day} из ${s.settings.courseDays} · план: английский ${split.en} мин, казахский ${split.kk} мин`}
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Выполнено {p.pct}%</div>
            <div className="text-sm text-ink-soft">
              {p.done} из {p.total} мин по плану · фактически занимались {Math.round((act?.seconds ?? 0) / 60)} мин
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon="plus" onClick={() => setAdding(true)}>
              Добавить
            </Button>
            <Button variant="secondary" size="sm" icon="refresh" onClick={() => regenerateTodayPlan(date)}>
              Пересобрать
            </Button>
          </div>
        </div>
        <Progress value={p.pct} className="mt-3" />
        <p className="mt-2 text-xs text-ink-soft">
          Занимайтесь блоками по 5–15 минут в любое время дня — утром, днём и вечером. Выполненные блоки отмечаются автоматически, все результаты объединяются в общий дневной прогресс. Отложенный блок
          переносится на завтра и заменяет менее важный блок (дневная нагрузка не растёт).
        </p>
      </Card>

      <Card>
        <PlanList blocks={plan} editable />
      </Card>

      <Card>
        <h2 className="font-semibold">Неделя {g.week}: {g.title}</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-ink-soft">Учебные цели</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {g.goals.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium text-ink-soft">Измеримые результаты</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
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
      <div className="mb-2 text-sm font-medium text-ink-soft">Тренажёры</div>
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
          <button key={b.kind} onClick={() => add({ ...b, lang })} className="rounded-xl border border-line px-3 py-2.5 text-left text-sm hover:bg-canvas">
            <div className="font-medium">{b.title}</div>
            <div className="text-xs text-ink-soft">{b.minutes} мин</div>
          </button>
        ))}
      </div>
      <div className="mb-2 text-sm font-medium text-ink-soft">Уроки (в том числе повтор пройденных)</div>
      <div className="space-y-1">
        {lessons.map((l) => (
          <button key={l.id} onClick={() => add({ lang, kind: 'lesson', title: `Урок: ${l.title}`, minutes: l.minutes, route: `#/lesson/${l.id}`, ref: l.id })} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-canvas">
            <span>{l.title}</span>
            <span className="text-ink-soft">{l.minutes} мин</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
