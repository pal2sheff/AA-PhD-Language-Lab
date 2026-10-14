import { useAppState } from '../lib/store';
import { accuracy, latestDiag, lessonProgress, SKILL_NAMES, studyDaysCount, vocabStats } from '../lib/selectors';
import { addDays, formatDate, today, toISODate } from '../lib/dates';
import { courseDay, planProgress, weakTopics } from '../lib/planner';
import { topicName } from '../data/curriculum';
import { ieltsOverall } from '../lib/scoring';
import { Badge, Card, Notice, PageHeader, Stat } from '../components/ui';
import { LineChart, SERIES, StackedBars } from '../components/Charts';
import type { Lang } from '../data/types';
import type { AppState } from '../lib/state';

function sectionSeries(s: AppState, exam: 'ielts' | 'kaztest', section: string) {
  return s.exams
    .filter((e) => e.exam === exam && e.section === section)
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map((e) => ({ label: formatDate(toISODate(new Date(e.finishedAt))), value: Math.round((e.correct / Math.max(1, e.total)) * 100) }));
}

export function StatsPage() {
  const s = useAppState();
  const t = today();
  const days = Array.from({ length: 30 }, (_, i) => addDays(t, i - 29));
  const minutesData = days.map((d) => ({ label: formatDate(d), values: [Math.round((s.activity[d]?.en ?? 0) / 60), Math.round((s.activity[d]?.kk ?? 0) / 60)] }));
  const planDays = Object.values(s.plans).filter((p) => p.date <= t);
  const planPct = planDays.length ? Math.round(planDays.reduce((a, p) => a + planProgress(p.blocks).pct, 0) / planDays.length) : null;
  const totalLessons = Object.values(s.lessons).filter((l) => l.passed).length;
  const vs = vocabStats(s);
  const totalReviews = Object.values(s.activity).reduce((a, x) => a + x.reviews, 0);
  const acc = accuracy(s);
  // недельная точность
  const weekly: { label: string; value: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    let a = 0;
    let c = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(t, -(w * 7 + i));
      a += s.activity[d]?.answered ?? 0;
      c += s.activity[d]?.correct ?? 0;
    }
    if (a > 0) weekly.push({ label: formatDate(addDays(t, -w * 7)), value: Math.round((c / a) * 100) });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Моя статистика" subtitle={`День ${Math.max(1, courseDay(s.settings, t))} из ${s.settings.courseDays}`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Дней обучения" value={studyDaysCount(s)} hint="≥ 5 минут" />
        <Stat label="Выполнение плана" value={planPct === null ? '—' : `${planPct}%`} hint="в среднем по дням" />
        <Stat label="Пройдено уроков" value={totalLessons} />
        <Stat label="Верных ответов" value={acc.pct === null ? '—' : `${acc.pct}%`} hint={`из ${acc.answered}`} />
        <Stat label="Слов освоено" value={vs.mastered} hint={`всего ${vs.total}`} />
        <Stat label="Повторений слов" value={totalReviews} />
        <Stat label="Письменных работ" value={s.writings.length} />
        <Stat label="Устных ответов" value={s.speakings.length} />
      </div>

      <Card>
        <h2 className="mb-2 font-semibold">Минуты занятий за 30 дней</h2>
        <StackedBars data={minutesData} series={[{ label: 'Английский', color: SERIES.en }, { label: 'Казахский', color: SERIES.kk }]} unit=" мин" target={s.settings.dailyMinutes} />
        <p className="mt-1 text-xs text-ink-soft">Пунктир — дневная цель {s.settings.dailyMinutes} мин. Учитывается только активное время на страницах занятий.</p>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Точность ответов по неделям</h2>
        <LineChart points={weekly} />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ExamBlock lang="en" />
        <ExamBlock lang="kk" />
      </div>

      <Card>
        <h2 className="font-semibold">Слабые грамматические темы</h2>
        {(['en', 'kk'] as Lang[]).map((l) => {
          const w = weakTopics(s, l);
          return (
            <div key={l} className="mt-2">
              <div className="text-sm text-ink-soft">{l === 'en' ? 'Английский' : 'Казахский'}</div>
              {w.length ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {w.map((x) => (
                    <a key={x.topic} href={`#/practice/${encodeURIComponent(x.topic)}`}>
                      <Badge tone="warn">
                        {topicName(x.topic)} · {Math.round(x.accuracy * 100)}%
                      </Badge>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm">Нет (нужно ≥ 3 ответов по теме с точностью ниже 60 % или ≥ 2 открытых ошибки)</div>
              )}
            </div>
          );
        })}
      </Card>

      <Card>
        <h2 className="font-semibold">Прогресс по программе</h2>
        {(['en', 'kk'] as Lang[]).map((l) => {
          const lp = lessonProgress(s, l);
          return (
            <p key={l} className="mt-1 text-sm">
              {l === 'en' ? 'Английский' : 'Казахский'}: пройдено {lp.passed} из {lp.lessonsAvailable} готовых уроков; всего в программе {lp.totalUnits} тем.
            </p>
          );
        })}
      </Card>
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

  return (
    <Card tone={isEn ? 'en' : 'kk'}>
      <h2 className="font-semibold">{isEn ? 'IELTS: динамика по компонентам' : 'КАЗТЕСТ: динамика по блокам'}</h2>
      {diag && (
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
          {Object.entries(diag.skills).map(([k, v]) => (
            <Badge key={k}>
              {SKILL_NAMES[k]}: {v?.tested ? v.level : '—'}
            </Badge>
          ))}
        </div>
      )}
      {sections.map((sec) => {
        const pts = sectionSeries(s, exam, sec);
        return pts.length ? (
          <div key={sec} className="mt-3">
            <div className="text-sm font-medium">{names[sec]} — % верных</div>
            <LineChart points={pts} color={isEn ? SERIES.en : SERIES.kk} height={80} />
          </div>
        ) : null;
      })}
      <div className="mt-3 space-y-1 text-sm">
        <div>
          <span className="text-ink-soft">Фактически проверено: </span>
          {verified.length ? verified.join(', ') : '—'}
        </div>
        <div>
          <span className="text-ink-soft">Предварительная оценка AI: </span>
          {aiOnly.length ? aiOnly.join(', ') : '—'}
        </div>
        <div>
          <span className="text-ink-soft">Недостаточно проверено: </span>
          {untested.length ? untested.join(', ') : '—'}
        </div>
      </div>
      {isEn &&
        (overall !== null ? (
          <Notice tone={aiOnly.length ? 'warn' : 'info'}>
            Ориентировочный общий балл: <strong>{overall.toFixed(1)}</strong>
            {aiOnly.length ? ' (включает предварительные оценки AI)' : ''}. Рассчитан по правилу IELTS: среднее четырёх модулей с округлением до 0,5.
          </Notice>
        ) : (
          <Notice tone="warn">Общий прогноз IELTS не рассчитывается: не все четыре компонента проверены ({untested.join(', ')}).</Notice>
        ))}
      {!isEn && <p className="mt-2 text-xs text-ink-soft">Итоговый балл по шкале 160 и выполнение порогов показываются только при наличии официальных порогов (Настройки → КАЗТЕСТ).</p>}
    </Card>
  );
}
