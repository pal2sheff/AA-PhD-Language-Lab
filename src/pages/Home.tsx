import { useEffect } from 'react';
import { useAppState } from '../lib/store';
import { today, formatDate, daysWord, toISODate, plural } from '../lib/dates';
import { courseDay, nextLesson, phaseOf, PHASE_NAMES, planProgress, weekGoal, isRestDay } from '../lib/planner';
import { ensureTodayPlan } from '../lib/learning';
import { accuracy, firstDiag, latestDiag, latestSections, lessonProgress, nextCheckpoint, SKILL_NAMES, streak, vocabStats, weakSkills } from '../lib/selectors';
import { getLesson } from '../data';
import { navigate } from '../lib/router';
import { Badge, Button, Card, Notice, Progress, Ring, Stat } from '../components/ui';
import { Icon } from '../components/icons';
import { PlanList } from './Today';
import type { Lang } from '../data/types';
import { useStudyTimer } from '../lib/hooks';

function ExamCard({ lang }: { lang: Lang }) {
  const s = useAppState();
  const first = firstDiag(s, lang);
  const last = latestDiag(s, lang);
  const lp = lessonProgress(s, lang);
  const next = nextLesson(s, lang);
  const weak = weakSkills(s, lang);
  const sections = latestSections(s, lang === 'en' ? 'ielts' : 'kaztest');
  const isEn = lang === 'en';
  return (
    <Card tone={isEn ? 'en' : 'kk'} className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={isEn ? 'text-xs font-semibold tracking-wide text-brand uppercase' : 'text-xs font-semibold tracking-wide text-kk uppercase'}>{isEn ? 'Английский' : 'Казахский'}</div>
          <h2 className="text-lg font-semibold">{isEn ? 'IELTS Academic' : 'КАЗТЕСТ'}</h2>
        </div>
        <Ring value={lp.pctOfProgram} tone={isEn ? 'brand' : 'kk'} size={58} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-ink-soft">Исходный уровень</dt>
        <dd className="font-medium">{first?.overall ?? 'не определён'}</dd>
        <dt className="text-ink-soft">Текущий (ориент.)</dt>
        <dd className="font-medium">{last?.overall ? `${last.overall}${last !== first ? '' : ' (по диагностике)'}` : '—'}</dd>
        <dt className="text-ink-soft">Цель</dt>
        <dd className="font-medium">{isEn ? `IELTS ${s.settings.ieltsMin.toFixed(1)}–${s.settings.ieltsTarget.toFixed(1)}` : s.settings.kazTargetLevel ? `уровень ${s.settings.kazTargetLevel}` : 'не выбрана'}</dd>
        <dt className="text-ink-soft">Уроки</dt>
        <dd className="font-medium">
          {lp.passed} из {lp.lessonsAvailable} готовых
        </dd>
      </dl>
      <p className="mt-1 text-xs text-ink-faint">Программа: {lp.totalUnits} {plural(lp.totalUnits, 'тема', 'темы', 'тем')}; готовых уроков: {lp.lessonsAvailable}, остальные темы — тренажёры или материал в разработке.</p>
      {weak.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-ink-soft">Слабые навыки:</span>
          {weak.map((w) => (
            <Badge key={w} tone="warn">
              {SKILL_NAMES[w]}
            </Badge>
          ))}
        </div>
      )}
      {!isEn && Object.keys(sections).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {Object.values(sections).map((e) => (
            <Badge key={e.section} tone="kk">
              {e.section}: {Math.round((e.correct / Math.max(1, e.total)) * 100)}%
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-3 text-sm">
        <span className="text-ink-soft">Следующее занятие: </span>
        <span className="font-medium">{!last ? 'Диагностика' : next ? getLesson(next)!.title : 'Экзаменационные тренажёры'}</span>
      </div>
      <div className="mt-auto pt-4">
        <Button variant={isEn ? 'primary' : 'kk'} className="w-full" onClick={() => navigate(!last ? `/diagnostic/${lang}` : next ? `/lesson/${next}` : isEn ? '/ielts' : '/kaztest')}>
          {isEn ? 'Продолжить английский' : 'Продолжить казахский'}
        </Button>
      </div>
    </Card>
  );
}

export function Home() {
  const s = useAppState();
  useStudyTimer(null);
  const date = today();
  useEffect(() => {
    ensureTodayPlan(date);
  }, [date]);
  const day = courseDay(s.settings, date);
  const total = s.settings.courseDays;
  const left = Math.max(0, total - day);
  const plan = s.plans[date]?.blocks ?? [];
  const prog = planProgress(plan);
  const nextBlock = plan.find((b) => !b.done);
  const vs = vocabStats(s);
  const cp = nextCheckpoint(s, date);
  const acc = accuracy(s);
  const goal = weekGoal(Math.max(1, day), total);
  const before = day < 1;
  const after = day > total;
  const rest = isRestDay(s.settings, date);

  return (
    <div className="space-y-4">
      <header className="pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">AA PhD Language Lab</h1>
        <p className="text-ink-soft">Персональная подготовка к IELTS и КАЗТЕСТ</p>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {before ? (
            <div className="text-lg font-semibold">Курс начнётся {formatDate(s.settings.startDate)}</div>
          ) : after ? (
            <div className="text-lg font-semibold">Курс завершён ({total} дней)</div>
          ) : (
            <div className="text-lg font-semibold">
              Сегодня: день {day} из {total}
            </div>
          )}
          <div className="text-sm text-ink-soft">
            {!before && !after && <>До завершения программы осталось: {daysWord(left)} · </>}
            Этап {phaseOf(Math.min(Math.max(1, day), total), total)}: {PHASE_NAMES[phaseOf(Math.min(Math.max(1, day), total), total)]}
          </div>
          <div className="mt-1 text-sm">
            <span className="text-ink-soft">Цель недели: </span>
            {goal.title}
          </div>
        </div>
        <Button size="lg" icon="play" onClick={() => navigate(nextBlock ? nextBlock.route.replace(/^#/, '') : '/today')}>
          Начать занятие
        </Button>
      </Card>

      {rest && <Notice tone="info">Сегодня по вашему расписанию выходной. Можно заниматься по желанию — план сформирован.</Notice>}
      {!s.diagnostics.en.length && !s.diagnostics.kk.length && (
        <Notice tone="warn" title="Начните с диагностики">
          Короткая адаптивная диагностика определит ориентировочный уровень и слабые места. Её можно проходить частями.
        </Notice>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <ExamCard lang="en" />
        <ExamCard lang="kk" />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Мой план на сегодня</h2>
            <div className="text-sm text-ink-soft">
              {prog.done} из {prog.total} мин · {prog.pct}%
            </div>
          </div>
          <Button variant="ghost" size="sm" href="/today">
            Изменить
          </Button>
        </div>
        <Progress value={prog.pct} className="mb-3" label="Выполнение плана" />
        <PlanList blocks={plan} compact />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Дней подряд" value={streak(s)} hint="≥ 5 минут в день" />
        <Stat label="Слов в словаре" value={vs.total} hint={`освоено: ${vs.mastered}`} />
        <Stat label="Ближайшее повторение" value={vs.due ? `${vs.due} сейчас` : vs.nextDue ? formatDate(toISODate(new Date(vs.nextDue))) : '—'} />
        <Stat label="Контрольная точка" value={cp ? `день ${cp.day}` : '—'} hint={cp?.title} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Кратко</h2>
          <Button variant="ghost" size="sm" href="/stats">
            Статистика <Icon name="chevronRight" size={16} />
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-ink-soft">Верных ответов</div>
            <div className="font-semibold">{acc.pct === null ? '—' : `${acc.pct}%`}</div>
          </div>
          <div>
            <div className="text-ink-soft">Ответов всего</div>
            <div className="font-semibold">{acc.answered}</div>
          </div>
          <div>
            <div className="text-ink-soft">Открытых ошибок</div>
            <div className="font-semibold">{s.mistakes.filter((m) => m.status === 'open').length}</div>
          </div>
          <div>
            <div className="text-ink-soft">Пробных секций</div>
            <div className="font-semibold">{s.exams.length}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
