import { useMemo, useState } from 'react';
import { useAppState, update } from '../lib/store';
import { buildCalendar, PHASE_NAMES, type CalendarDay } from '../lib/planner';
import { WEEK_GOALS } from '../data/curriculum';
import { addDays, diffDays, formatDate, today, daysWord } from '../lib/dates';
import { Badge, Button, Card, Field, Notice, PageHeader, cx, inputCls } from '../components/ui';
import { uid } from '../lib/text';
import { navigate } from '../lib/router';

const STATUS: Record<CalendarDay['status'], { label: string; cls: string }> = {
  done: { label: 'выполнено', cls: 'bg-good text-white' },
  partial: { label: 'частично', cls: 'bg-warn-soft text-warn border border-warn/30' },
  missed: { label: 'пропущено', cls: 'bg-bad-soft text-bad border border-bad/20' },
  rest: { label: 'выходной', cls: 'bg-canvas text-ink-faint border border-line' },
  today: { label: 'сегодня', cls: 'bg-brand text-white' },
  future: { label: 'план', cls: 'bg-surface text-ink border border-line' },
};

export function CalendarPage() {
  const s = useAppState();
  const date = today();
  const { days, overflow } = useMemo(() => buildCalendar(s, date), [s, date]);
  const [open, setOpen] = useState<number | null>(null);
  const weeks: CalendarDay[][] = [];
  for (const d of days) (weeks[d.week - 1] ??= []).push(d);
  const sel = open !== null ? days[open - 1] : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Календарь подготовки" subtitle={`${s.settings.courseDays} дней · начало ${formatDate(s.settings.startDate)} · окончание ${formatDate(addDays(s.settings.startDate, s.settings.courseDays - 1))}`} />
      <ExamDates />
      {(overflow.en > 0 || overflow.kk > 0) && (
        <Notice tone="warn" title="Не все темы помещаются в оставшийся срок">
          Не распределено тем: английский — {overflow.en}, казахский — {overflow.kk}. Рекомендуется увеличить ежедневную нагрузку или продлить программу в Настройках. Пропущенные дни не «догоняются» перегрузкой — темы сдвигаются.
        </Notice>
      )}
      <Card>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(STATUS).map(([k, v]) => (
            <span key={k} className={cx('rounded px-1.5 py-0.5', v.cls)}>
              {v.label}
            </span>
          ))}
          <span className="rounded border border-brand px-1.5 py-0.5">◆ контроль</span>
          <span className="rounded border border-warn px-1.5 py-0.5">▲ пробный экзамен</span>
        </div>
        <p className="text-xs text-ink-soft">Темы с ✓ имеют готовый учебный материал; остальные запланированы, материал ещё в разработке.</p>
        <div className="mt-3 space-y-3">
          {weeks.map((w, i) => {
            const g = WEEK_GOALS[Math.min(12, Math.floor((i / weeks.length) * 13))];
            return (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">Неделя {i + 1}</span>
                  <span className="truncate pl-2 text-xs text-ink-soft">{g.title}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {w.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setOpen(open === d.day ? null : d.day)}
                      className={cx('relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs', STATUS[d.status].cls, open === d.day && 'ring-2 ring-ink')}
                      aria-label={`День ${d.day}, ${formatDate(d.date)}, ${STATUS[d.status].label}`}
                    >
                      <span className="font-semibold">{d.day}</span>
                      <span className="text-[10px] opacity-75">{formatDate(d.date).split(' ')[0]}</span>
                      {d.checkpoint && <span className="absolute top-0.5 right-1 text-[9px]">◆</span>}
                      {d.mock && <span className="absolute top-0.5 left-1 text-[9px]">▲</span>}
                      {d.examMarks.length > 0 && <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-bad" />}
                    </button>
                  ))}
                </div>
                {sel && w.some((d) => d.day === sel.day) && <DayDetails d={sel} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function DayDetails({ d }: { d: CalendarDay }) {
  const s = useAppState();
  const plan = s.plans[d.date];
  return (
    <div className="mt-2 rounded-xl border border-line bg-canvas p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <strong>
          День {d.day} · {formatDate(d.date, true)}
        </strong>
        <Badge>этап {d.phase}</Badge>
        <span className="text-ink-soft">{PHASE_NAMES[d.phase]}</span>
      </div>
      {d.examMarks.length > 0 && <div className="mt-1 font-medium text-bad">{d.examMarks.join(', ')}</div>}
      {d.checkpoint && <div className="mt-1">◆ Контрольная точка: {d.checkpoint}</div>}
      {d.mock && <div className="mt-1">▲ Экзаменационная симуляция по секциям</div>}
      {d.rest && <div className="mt-1 text-ink-soft">Выходной по расписанию</div>}
      {d.review && <div className="mt-1">Повторение недели и мини-тест</div>}
      {d.units.length > 0 && (
        <ul className="mt-2 space-y-1">
          {d.units.map((u) => (
            <li key={u.unit.id} className="flex items-center gap-2">
              <Badge tone={u.lang === 'en' ? 'brand' : 'kk'}>{u.lang.toUpperCase()}</Badge>
              <span>{u.unit.title}</span>
              {u.hasContent ? <span className="text-good">✓</span> : <span className="text-xs text-ink-faint">в разработке</span>}
            </li>
          ))}
        </ul>
      )}
      {d.status !== 'future' && d.status !== 'rest' && (
        <div className="mt-2 text-ink-soft">
          Фактически: {d.minutes} мин{plan ? ` · блоков выполнено ${plan.blocks.filter((b) => b.done).length} из ${plan.blocks.length}` : ''}
        </div>
      )}
      {d.status === 'today' && (
        <Button size="sm" className="mt-2" onClick={() => navigate('/today')}>
          Открыть план на сегодня
        </Button>
      )}
    </div>
  );
}

function ExamDates() {
  const s = useAppState();
  const ed = s.examDates;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const t = today();
  const left = (d: string) => (d ? diffDays(t, d) : null);
  const set = (k: 'ielts' | 'kaztest' | 'phdDeadline', v: string) =>
    update((x) => {
      x.examDates[k] = v;
    });
  const warnings: string[] = [];
  if (ed.ielts && ed.phdDeadline && diffDays(ed.ielts, ed.phdDeadline) < 14)
    warnings.push('Между IELTS и подачей документов меньше 14 дней. Результаты компьютерного IELTS обычно приходят через 3–5 дней, бумажного — через 13 дней (по данным IELTS; уточните у организатора) — заложите запас.');
  if (ed.kaztest && ed.phdDeadline && diffDays(ed.kaztest, ed.phdDeadline) < 14) warnings.push('Между КАЗТЕСТ и подачей документов меньше 14 дней. Срок выдачи результатов уточните на testcenter.kz.');
  if (ed.ielts && !ed.ieltsRegistered && (left(ed.ielts) ?? 999) < 45) warnings.push('До IELTS меньше 45 дней, а регистрация не отмечена — места на популярные даты заканчиваются заранее.');
  if (ed.kaztest && !ed.kaztestRegistered && (left(ed.kaztest) ?? 999) < 30) warnings.push('До КАЗТЕСТ меньше 30 дней, а регистрация не отмечена.');
  const end = addDays(s.settings.startDate, s.settings.courseDays - 1);
  if (ed.ielts && diffDays(end, ed.ielts) < 0) warnings.push(`Дата IELTS раньше окончания программы (${formatDate(end)}). Рассмотрите режим «Экстренная подготовка» за 14 дней до экзамена.`);

  return (
    <Card>
      <h2 className="font-semibold">Даты экзаменов и сроки</h2>
      <p className="text-sm text-ink-soft">Введите подтверждённые даты. Приложение не придумывает даты экзаменов — официальное расписание смотрите на ielts.org (и у местного организатора) и testcenter.kz.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="IELTS Academic" hint={ed.ielts ? `через ${daysWord(Math.max(0, left(ed.ielts)!))}` : undefined}>
          <input type="date" className={inputCls} value={ed.ielts} onChange={(e) => set('ielts', e.target.value)} />
        </Field>
        <Field label="КАЗТЕСТ" hint={ed.kaztest ? `через ${daysWord(Math.max(0, left(ed.kaztest)!))}` : undefined}>
          <input type="date" className={inputCls} value={ed.kaztest} onChange={(e) => set('kaztest', e.target.value)} />
        </Field>
        <Field label="Подача документов в докторантуру" hint={ed.phdDeadline ? `через ${daysWord(Math.max(0, left(ed.phdDeadline)!))}` : undefined}>
          <input type="date" className={inputCls} value={ed.phdDeadline} onChange={(e) => set('phdDeadline', e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={ed.ieltsRegistered} onChange={(e) => update((x) => void (x.examDates.ieltsRegistered = e.target.checked))} /> Зарегистрирован(а) на IELTS
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={ed.kaztestRegistered} onChange={(e) => update((x) => void (x.examDates.kaztestRegistered = e.target.checked))} /> Зарегистрирован(а) на КАЗТЕСТ
        </label>
      </div>
      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map((w) => (
            <Notice key={w} tone="warn">
              {w}
            </Notice>
          ))}
        </div>
      )}
      <div className="mt-4">
        <div className="text-sm font-medium">Другие важные даты</div>
        <ul className="mt-1 space-y-1 text-sm">
          {ed.custom.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span>
                {formatDate(c.date)} — {c.title} <span className="text-ink-soft">({left(c.date)! >= 0 ? `через ${daysWord(left(c.date)!)}` : 'прошло'})</span>
              </span>
              <button className="text-bad" onClick={() => update((x) => void (x.examDates.custom = x.examDates.custom.filter((y) => y.id !== c.id)))}>
                удалить
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <input className={cx(inputCls, 'max-w-60')} placeholder="Например: собеседование" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="date" className={cx(inputCls, 'max-w-44')} value={date} onChange={(e) => setDate(e.target.value)} />
          <Button
            variant="secondary"
            disabled={!title || !date}
            onClick={() => {
              update((x) => void x.examDates.custom.push({ id: uid('d'), title, date }));
              setTitle('');
              setDate('');
            }}
          >
            Добавить
          </Button>
        </div>
      </div>
    </Card>
  );
}
