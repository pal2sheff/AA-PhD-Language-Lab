import { useEffect, type ReactNode } from 'react';
import { useAppState } from '../lib/store';
import { today, formatDate, daysWord, toISODate } from '../lib/dates';
import { courseDay, nextLesson, phaseOf, PHASE_NAMES, planProgress, isRestDay } from '../lib/planner';
import { ensureTodayPlan } from '../lib/learning';
import { latestDiag, lessonProgress, nextCheckpoint, streak, vocabStats } from '../lib/selectors';
import { getLesson } from '../data';
import { navigate } from '../lib/router';
import { Button, Card, Eyebrow, LangTag, Notice, Progress, SectionTitle } from '../components/ui';
import { Icon } from '../components/icons';
import { PlanList } from './Today';
import type { Lang } from '../data/types';
import { useStudyTimer } from '../lib/hooks';

/** Блок 2: карточка экзамена — уровень, цель, прогресс курса, следующее занятие. */
function ExamCard({ lang }: { lang: Lang }) {
  const s = useAppState();
  const last = latestDiag(s, lang);
  const lp = lessonProgress(s, lang);
  const next = nextLesson(s, lang);
  const isEn = lang === 'en';
  const nextTitle = !last ? 'Диагностика уровня' : next ? getLesson(next)!.title : 'Экзаменационные тренажёры';
  const go = !last ? `/diagnostic/${lang}` : next ? `/lesson/${next}` : isEn ? '/ielts' : '/kaztest';
  const pct = lp.lessonsAvailable ? Math.round((lp.passed / lp.lessonsAvailable) * 100) : 0;
  return (
    <Card tone={isEn ? 'en' : 'kk'} className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow tone={isEn ? 'en' : 'kk'}>{isEn ? 'Английский' : 'Казахский'}</Eyebrow>
          <h3 className="mt-1 text-xl font-semibold">{isEn ? 'IELTS Academic' : 'КАЗТЕСТ'}</h3>
        </div>
        <button onClick={() => navigate(`/${lang}`)} className="-mt-1 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-subtle" aria-label={isEn ? 'Курс английского' : 'Курс казахского'}>
          <Icon name="chevronRight" />
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-ink-soft">Уровень</dt>
          <dd className="mt-0.5 text-lg font-semibold">{last?.overall ?? '—'}</dd>
          {!last && <dd className="text-sm text-ink-soft">после диагностики</dd>}
        </div>
        <div>
          <dt className="text-sm text-ink-soft">Цель</dt>
          <dd className="mt-0.5 text-lg font-semibold">{isEn ? `${s.settings.ieltsMin.toFixed(1)}–${s.settings.ieltsTarget.toFixed(1)}` : (s.settings.kazTargetLevel ?? '—')}</dd>
          {!isEn && !s.settings.kazTargetLevel && <dd className="text-sm text-ink-soft">не выбрана</dd>}
        </div>
      </dl>
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-ink-soft">Прогресс курса</span>
          <span className="font-medium tabular-nums">
            {lp.passed} из {lp.lessonsAvailable} уроков
          </span>
        </div>
        <Progress value={pct} tone={isEn ? 'brand' : 'kk'} className="mt-2" label={`Прогресс курса: ${pct}%`} />
      </div>
      <button onClick={() => navigate(go)} className="group mt-auto flex min-h-14 w-full items-center gap-3 border-t border-line pt-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink-soft">Следующее занятие</span>
          <span className="block font-medium">{nextTitle}</span>
        </span>
        <span className={isEn ? 'text-brand' : 'text-kk'}>
          <Icon name="chevronRight" />
        </span>
      </button>
    </Card>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl leading-tight font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-sm text-ink-soft">{hint}</div>}
    </div>
  );
}

export function Home() {
  const s = useAppState();
  useStudyTimer(null);
  const date = today();
  useEffect(() => {
    ensureTodayPlan(date);
  }, [date]);
  const total = s.settings.courseDays;
  const day = courseDay(s.settings, date);
  const before = day < 1;
  const after = day > total;
  const dayIn = Math.min(Math.max(1, day), total);
  const left = Math.max(0, total - day);
  const phase = phaseOf(dayIn, total);
  const plan = s.plans[date]?.blocks ?? [];
  const prog = planProgress(plan);
  const nextBlock = plan.find((b) => !b.done);
  const vs = vocabStats(s);
  const cp = nextCheckpoint(s, date);
  const rest = isRestDay(s.settings, date);
  const coursePct = before ? 0 : Math.round((Math.min(day, total) / total) * 100);
  const noDiag = !s.diagnostics.en.length && !s.diagnostics.kk.length;

  return (
    <div className="space-y-8">
      {/* Блок 1: где я и что делать дальше */}
      <Card className="p-6 sm:p-8">
        <Eyebrow tone="warm">{formatDate(date, true)}</Eyebrow>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight sm:text-[32px]">
          {before ? `Курс начнётся ${formatDate(s.settings.startDate)}` : after ? `Курс завершён: ${total} дней` : `День ${day} из ${total}`}
        </h1>
        <p className="mt-2 text-ink-soft">
          Этап {phase} · {PHASE_NAMES[phase]}
          {!before && !after && <> · осталось {daysWord(left)}</>}
        </p>
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink-soft">Общий прогресс программы</span>
            <span className="font-semibold tabular-nums">{coursePct}%</span>
          </div>
          <Progress value={coursePct} tone="warm" className="mt-2" label="Общий прогресс программы" />
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-subtle p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            {nextBlock ? (
              <>
                <div className="text-sm text-ink-soft">Следующий шаг</div>
                <div className="mt-0.5 text-[17px] leading-snug font-semibold">{nextBlock.title}</div>
                <div className="mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
                  <LangTag lang={nextBlock.lang} long />
                  <span className="tabular-nums">{nextBlock.minutes} мин</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[17px] font-semibold">План на сегодня выполнен</div>
                <div className="mt-0.5 text-sm text-ink-soft">Можно повторить слова или добавить занятие.</div>
              </>
            )}
          </div>
          <Button size="xl" icon={nextBlock ? 'play' : 'today'} onClick={() => navigate(nextBlock ? nextBlock.route.replace(/^#/, '') : '/today')} className="w-full sm:w-auto">
            {nextBlock ? 'Продолжить занятие' : 'Открыть план'}
          </Button>
        </div>
      </Card>

      {rest && <Notice tone="info">Сегодня по вашему расписанию выходной. Можно заниматься по желанию — план сформирован.</Notice>}
      {noDiag && (
        <Notice tone="warn" title="Начните с диагностики">
          Короткая адаптивная диагностика определит ориентировочный уровень и слабые места. Её можно проходить частями.
        </Notice>
      )}

      {/* Блок 2: два экзамена */}
      <section aria-labelledby="h-exams">
        <SectionTitle>
          <span id="h-exams">Мои экзамены</span>
        </SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          <ExamCard lang="en" />
          <ExamCard lang="kk" />
        </div>
      </section>

      {/* Блок 3: план на сегодня */}
      <Card as="div">
        <SectionTitle
          sub={
            <span className="tabular-nums">
              {prog.done} из {prog.total} мин · {prog.pct}%
            </span>
          }
          action={
            <Button variant="ghost" size="sm" href="/today" iconRight="chevronRight">
              Весь план
            </Button>
          }
        >
          План на сегодня
        </SectionTitle>
        <Progress value={prog.pct} tone="good" className="mb-3" label="Выполнение плана" />
        <PlanList blocks={plan} compact />
      </Card>

      {/* Блок 4: коротко о прогрессе */}
      <Card as="div">
        <SectionTitle
          action={
            <Button variant="ghost" size="sm" href="/stats" iconRight="chevronRight">
              Статистика
            </Button>
          }
        >
          Коротко о прогрессе
        </SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
          <MiniStat label="Освоено слов" value={vs.mastered} hint={`в словаре: ${vs.total}`} />
          <MiniStat label="К повторению" value={vs.due} hint={vs.due ? 'слов сейчас' : vs.nextDue ? `следующее ${formatDate(toISODate(new Date(vs.nextDue)))}` : 'нет запланированных'} />
          <MiniStat label="Контрольная точка" value={cp ? `день ${cp.day}` : '—'} hint={cp?.title} />
          <MiniStat label="Дней подряд" value={streak(s)} hint="от 5 минут в день" />
        </div>
      </Card>
    </div>
  );
}
