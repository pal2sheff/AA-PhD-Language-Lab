import { useState, type ReactNode } from 'react';
import { useAppState } from '../lib/store';
import { accuracy, latestDiag, lessonProgress, SKILL_NAMES, studyDaysCount, vocabStats } from '../lib/selectors';
import { addDays, formatDate, today, toISODate } from '../lib/dates';
import { courseDay, planProgress, weakTopics } from '../lib/planner';
import { topicName } from '../data/curriculum';
import { ieltsOverall } from '../lib/scoring';
import { Badge, Card, Eyebrow, LangTag, LevelScale, Notice, PageHeader, Progress, SectionTitle, Tabs, cx } from '../components/ui';
import { LineChart, SERIES, StackedBars } from '../components/Charts';
import type { Lang } from '../data/types';
import type { AppState } from '../lib/state';

function sectionSeries(s: AppState, exam: 'ielts' | 'kaztest', section: string) {
  return s.exams
    .filter((e) => e.exam === exam && e.section === section)
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map((e) => ({ label: formatDate(toISODate(new Date(e.finishedAt))), value: Math.round((e.correct / Math.max(1, e.total)) * 100) }));
}

type Period = '7' | '30' | 'course';

export function StatsPage() {
  const s = useAppState();
  const t = today();
  const [period, setPeriod] = useState<Period>('30');
  const day = Math.max(1, courseDay(s.settings, t));
  const n = period === '7' ? 7 : period === '30' ? 30 : Math.min(Math.max(1, day), s.settings.courseDays);
  const days = Array.from({ length: n }, (_, i) => addDays(t, i - (n - 1)));
  const minutesData = days.map((d) => ({ label: formatDate(d), values: [Math.round((s.activity[d]?.en ?? 0) / 60), Math.round((s.activity[d]?.kk ?? 0) / 60)] }));
  const enMin = minutesData.reduce((a, d) => a + d.values[0], 0);
  const kkMin = minutesData.reduce((a, d) => a + d.values[1], 0);
  const studyDays = days.filter((d) => (s.activity[d]?.seconds ?? 0) >= 300).length;
  const planDays = days.map((d) => s.plans[d]).filter((p): p is NonNullable<typeof p> => !!p && p.date <= t);
  const planPct = planDays.length ? Math.round(planDays.reduce((a, p) => a + planProgress(p.blocks).pct, 0) / planDays.length) : null;
  const reviews = days.reduce((a, d) => a + (s.activity[d]?.reviews ?? 0), 0);
  const answered = days.reduce((a, d) => a + (s.activity[d]?.answered ?? 0), 0);
  const correct = days.reduce((a, d) => a + (s.activity[d]?.correct ?? 0), 0);
  const totalLessons = Object.values(s.lessons).filter((l) => l.passed).length;
  const vs = vocabStats(s);
  const acc = accuracy(s);
  const fmtH = (m: number) => (m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч ${m % 60} мин`);

  return (
    <div className="space-y-8">
      <PageHeader title="Статистика" subtitle={`День ${day} из ${s.settings.courseDays} · всего дней обучения: ${studyDaysCount(s)}`} />

      {/* За период */}
      <section aria-labelledby="h-period">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="h-period" className="text-xl font-semibold sm:text-[22px]">
            За период
          </h2>
          <div className="w-full sm:w-80">
            <Tabs value={period} onChange={setPeriod} items={[{ value: '7', label: '7 дней' }, { value: '30', label: '30 дней' }, { value: 'course', label: 'Весь курс' }]} />
          </div>
        </div>
        <Card>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
            <Metric label="Время занятий" value={fmtH(enMin + kkMin)} hint={`дней с занятиями: ${studyDays} из ${n}`} />
            <Metric label="Выполнение плана" value={planPct === null ? '—' : `${planPct}%`} hint="в среднем по дням" />
            <Metric label="Повторений слов" value={reviews} hint={`освоено всего: ${vs.mastered}`} />
            <Metric label="Верных ответов" value={answered ? `${Math.round((correct / answered) * 100)}%` : '—'} hint={`из ${answered} за период`} />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: SERIES.en }} />
                Английский · {fmtH(enMin)}
              </span>
              <span className="flex items-center gap-2">
                Казахский · {fmtH(kkMin)}
                <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: SERIES.kk }} />
              </span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-subtle" role="img" aria-label={`Доля времени: английский ${enMin} мин, казахский ${kkMin} мин`}>
              {enMin + kkMin > 0 && (
                <>
                  <div style={{ width: `${(enMin / (enMin + kkMin)) * 100}%`, background: SERIES.en }} />
                  <div className="ml-0.5 flex-1" style={{ background: SERIES.kk }} />
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <SectionTitle sub={`Пунктир — дневная цель ${s.settings.dailyMinutes} мин. Учитывается только активное время на страницах занятий.`}>Минуты занятий по дням</SectionTitle>
        <StackedBars data={minutesData} series={[{ label: 'Английский', color: SERIES.en }, { label: 'Казахский', color: SERIES.kk }]} unit=" мин" target={s.settings.dailyMinutes} />
      </Card>

      {/* Общие итоги */}
      <Card>
        <SectionTitle>Итоги за всё время</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
          <Metric label="Пройдено уроков" value={totalLessons} />
          <Metric label="Слов освоено" value={vs.mastered} hint={`в словаре: ${vs.total}`} />
          <Metric label="Точность ответов" value={acc.pct === null ? '—' : `${acc.pct}%`} hint={`из ${acc.answered}`} />
          <Metric label="Письмо / речь" value={`${s.writings.length} / ${s.speakings.length}`} hint="работ сохранено" />
        </div>
        <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          {(['en', 'kk'] as Lang[]).map((l) => {
            const lp = lessonProgress(s, l);
            return (
              <div key={l}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <LangTag lang={l} long />
                  <span className="tabular-nums text-ink-soft">
                    {lp.passed} из {lp.lessonsAvailable} готовых уроков · {lp.totalUnits} тем
                  </span>
                </div>
                <Progress value={lp.lessonsAvailable ? (lp.passed / lp.lessonsAvailable) * 100 : 0} tone={l === 'kk' ? 'kk' : 'brand'} className="mt-2" label="Пройдено уроков" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Экзамены и навыки */}
      <section aria-labelledby="h-exams">
        <SectionTitle sub="Пробные секции, динамика навыков и честная пометка, что проверено, а что — только предварительно.">
          <span id="h-exams">Экзамены и навыки</span>
        </SectionTitle>
        <div className="grid gap-5 lg:grid-cols-2">
          <ExamBlock lang="en" />
          <ExamBlock lang="kk" />
        </div>
      </section>

      <Card>
        <SectionTitle sub="Нужно ≥ 3 ответов по теме с точностью ниже 60 % или ≥ 2 открытых ошибки.">Слабые темы</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          {(['en', 'kk'] as Lang[]).map((l) => {
            const w = weakTopics(s, l);
            return (
              <div key={l}>
                <LangTag lang={l} long />
                {w.length ? (
                  <ul className="mt-2 divide-y divide-line">
                    {w.map((x) => (
                      <li key={x.topic}>
                        <a href={`#/practice/${encodeURIComponent(x.topic)}`} className="flex min-h-12 items-center justify-between gap-3 py-2 hover:text-brand">
                          <span className="min-w-0">{topicName(x.topic)}</span>
                          <span className="shrink-0 text-sm font-semibold text-warn tabular-nums">{Math.round(x.accuracy * 100)}%</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-ink-soft">Слабых тем пока нет.</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl leading-tight font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-sm text-ink-soft">{hint}</div>}
    </div>
  );
}

function ExamBlock({ lang }: { lang: Lang }) {
  const s = useAppState();
  const isEn = lang === 'en';
  const exam = isEn ? 'ielts' : 'kaztest';
  const sections = isEn ? ['listening', 'reading', 'writing', 'speaking'] : ['listening', 'reading', 'writing', 'speaking'];
  const names: Record<string, string> = isEn ? { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' } : { listening: 'Тыңдалым', reading: 'Оқылым', writing: 'Жазылым', speaking: 'Айтылым' };
  const diag = latestDiag(s, lang);

  // три категории: проверено / предварительная оценка AI / не проверено
  const verified: string[] = [];
  const aiOnly: string[] = [];
  const untested: string[] = [];
  const bands: Record<string, number | undefined> = {};
  for (const sec of sections) {
    const objective = s.exams.filter((e) => e.exam === exam && e.section === sec);
    if (sec === 'listening' || sec === 'reading') {
      if (objective.length) {
        verified.push(names[sec]);
        const last = objective.sort((a, b) => b.finishedAt - a.finishedAt)[0];
        bands[sec] = last.band ?? undefined;
      } else untested.push(names[sec]);
    } else {
      const ai = sec === 'writing' ? s.writings.filter((w) => w.lang === lang && w.ai?.band != null) : s.speakings.filter((w) => w.lang === lang && w.ai?.band != null);
      const manual = sec === 'writing' ? s.writings.filter((w) => w.lang === lang && w.manualBand) : s.speakings.filter((w) => w.lang === lang && w.manualBand);
      if (manual.length) {
        verified.push(`${names[sec]} (оценка введена вручную)`);
        bands[sec] = manual[0].manualBand!.band;
      } else if (ai.length) {
        aiOnly.push(names[sec]);
        bands[sec] = ai[0].ai!.band ?? undefined;
      } else untested.push(names[sec]);
    }
  }
  const overall = isEn && untested.length === 0 ? ieltsOverall({ listening: bands.listening, reading: bands.reading, writing: bands.writing, speaking: bands.speaking }) : null;

  const Row = ({ tone, label, items }: { tone: 'good' | 'warm' | 'neutral'; label: string; items: string[] }) => (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 py-2.5">
      <span className="w-full text-sm text-ink-soft sm:w-48 sm:shrink-0">{label}</span>
      <span className="flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((x) => (
            <Badge key={x} tone={tone}>
              {x}
            </Badge>
          ))
        ) : (
          <span className="text-ink-soft">—</span>
        )}
      </span>
    </div>
  );

  return (
    <Card tone={isEn ? 'en' : 'kk'}>
      <Eyebrow tone={isEn ? 'en' : 'kk'}>{isEn ? 'Английский' : 'Казахский'}</Eyebrow>
      <h3 className="mt-1 text-xl font-semibold">{isEn ? 'IELTS: динамика по компонентам' : 'КАЗТЕСТ: динамика по блокам'}</h3>
      {diag && (
        <div className="mt-5 space-y-3">
          <div className="text-sm font-semibold text-ink-soft">Навыки по последней диагностике</div>
          {Object.entries(diag.skills).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="truncate">{SKILL_NAMES[k]}</span>
              <LevelScale level={v?.tested ? (v.level ?? null) : null} tone={isEn ? 'brand' : 'kk'} />
              <span className={cx('text-right font-semibold', !v?.tested && 'font-normal text-ink-soft')}>{v?.tested ? v.level : '—'}</span>
            </div>
          ))}
        </div>
      )}
      {sections.some((sec) => sectionSeries(s, exam, sec).length) && (
        <div className="mt-5 space-y-4">
          {sections.map((sec) => {
            const pts = sectionSeries(s, exam, sec);
            return pts.length ? (
              <div key={sec}>
                <div className="text-sm font-semibold">{names[sec]} — % верных</div>
                <LineChart points={pts} color={isEn ? SERIES.en : SERIES.kk} height={80} />
              </div>
            ) : null;
          })}
        </div>
      )}
      <div className="mt-5 divide-y divide-line border-t border-line">
        <Row tone="good" label="Проверено (тесты, ввод вручную)" items={verified} />
        <Row tone="warm" label="Предварительная оценка AI" items={aiOnly} />
        <Row tone="neutral" label="Недостаточно проверено" items={untested} />
      </div>
      {isEn && (
        <div className="mt-4">
          {overall !== null ? (
            <Notice tone={aiOnly.length ? 'warn' : 'info'}>
              Ориентировочный общий балл: <strong>{overall.toFixed(1)}</strong>
              {aiOnly.length ? ' (включает предварительные оценки AI)' : ''}. Рассчитан по правилу IELTS: среднее четырёх модулей с округлением до 0,5.
            </Notice>
          ) : (
            <Notice tone="warn">Общий прогноз IELTS не рассчитывается: не все четыре компонента проверены ({untested.join(', ')}).</Notice>
          )}
        </div>
      )}
      {!isEn && <p className="mt-4 text-sm text-ink-soft">Итоговый балл по шкале 160 и выполнение порогов показываются только при наличии официальных порогов (Настройки → КАЗТЕСТ).</p>}
    </Card>
  );
}
