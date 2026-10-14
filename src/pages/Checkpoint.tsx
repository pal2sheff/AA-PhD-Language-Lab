// Контрольная точка: новые задания по пройденным темам (без повторения уже решённых),
// после неё план пересчитывается.
import { useState } from 'react';
import type { Exercise, Lang } from '../data/types';
import { LESSONS } from '../data';
import { EN_DIAG, KK_DIAG } from '../data/diagnostic';
import { getState, update, useAppState } from '../lib/store';
import { courseDay, checkpointDays } from '../lib/planner';
import { today } from '../lib/dates';
import { markBlockDone, regenerateTodayPlan } from '../lib/learning';
import { shuffle, uid } from '../lib/text';
import { ExerciseRunner, type ExerciseResult } from '../components/ExerciseRunner';
import { Button, Card, Notice, PageHeader } from '../components/ui';
import { topicName } from '../data/curriculum';
import { useStudyTimer } from '../lib/hooks';
import { mcq } from '../data/builders';

function buildCheckpoint(lang: Lang): Exercise[] {
  const s = getState();
  const studied = LESSONS.filter((l) => l.lang === lang && s.lessons[l.id]);
  const pool: Exercise[] = [];
  for (const l of studied) {
    const fresh = [...l.extra, ...l.control, ...l.practice].filter((e) => !s.seenExercises[e.id] && (e.type !== 'listen' || e.say));
    const older = [...l.extra, ...l.control].filter((e) => s.seenExercises[e.id] && (e.type !== 'listen' || e.say)).sort((a, b) => (s.seenExercises[a.id] ?? 0) - (s.seenExercises[b.id] ?? 0));
    pool.push(...fresh.slice(0, 2), ...(fresh.length < 2 ? older.slice(0, 2 - fresh.length) : []));
  }
  // Добавляем задания из банка навыков (чтение и аудирование), чтобы контроль не был только грамматическим.
  const bank = (lang === 'en' ? EN_DIAG : KK_DIAG).filter((d) => (d.skill === 'reading' || d.skill === 'listening') && !s.seenExercises[d.id]);
  const skillItems = shuffle(bank)
    .slice(0, 4)
    .map((d) => {
      const ex = mcq(d.id, d.topic, (d.passage ? d.passage + '\n\n' : '') + d.prompt, d.options, d.answer, d.explain, undefined, d.skill === 'reading' ? 'reading' : 'listening');
      return d.say ? { ...ex, type: 'listen' as const, mode: 'mcq' as const, say: d.say } : ex;
    });
  return [...shuffle(pool).slice(0, 12), ...skillItems];
}

export function CheckpointPage({ lang }: { lang: Lang }) {
  useStudyTimer(lang);
  const s = useAppState();
  const [items] = useState(() => buildCheckpoint(lang));
  const [done, setDone] = useState<ExerciseResult[] | null>(null);
  const day = courseDay(s.settings, today());
  const cp = checkpointDays(s.settings.courseDays).filter((c) => c.day <= Math.max(1, day)).at(-1);
  const prev = s.checkpoints.filter((c) => c.lang === lang);

  if (done) {
    const byTopic: Record<string, { c: number; t: number }> = {};
    for (const r of done) {
      const x = (byTopic[r.ex.topic] ??= { c: 0, t: 0 });
      x.t++;
      if (r.correct) x.c++;
    }
    const c = done.filter((r) => r.correct).length;
    const last = prev.at(-1);
    return (
      <div className="space-y-4">
        <PageHeader title="Результат контрольной точки" back="/" />
        <Card>
          <div className="text-3xl font-semibold">{Math.round((c / Math.max(1, done.length)) * 100)}%</div>
          <p className="text-ink-soft">
            {c} из {done.length} верно{last ? ` · прошлый контроль: ${Math.round((last.correct / Math.max(1, last.total)) * 100)}%` : ''}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(byTopic).map(([t, v]) => (
              <li key={t} className="flex justify-between gap-2">
                <span>{topicName(t)}</span>
                <span className={v.c / v.t < 0.6 ? 'text-bad' : 'text-good'}>
                  {v.c}/{v.t}
                </span>
              </li>
            ))}
          </ul>
          <Notice tone="info">План пересчитан: темы с результатом ниже 60 % получают дополнительные упражнения в ближайшие дни.</Notice>
          <div className="mt-3 flex gap-2">
            <Button href="/today">К плану</Button>
            <Button variant="secondary" href="/stats">
              Статистика
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={`Контрольная точка${cp ? `: ${cp.title}` : ''}`} back="/today" subtitle={lang === 'en' ? 'Английский' : 'Казахский'} />
      {items.length < 4 ? (
        <Notice tone="warn">Для контроля пока мало пройденного материала. Пройдите несколько уроков — контроль строится только из новых заданий по изученным темам.</Notice>
      ) : (
        <>
          <Notice tone="info">Задания, которые вы ещё не решали, по пройденным темам плюс чтение и аудирование. Без подсказок «Дай ещё упражнение».</Notice>
          <ExerciseRunner
            exercises={items}
            lang={lang}
            title="Задание"
            allowMore={false}
            onDone={(r) => {
              setDone(r);
              const byTopic: Record<string, { c: number; t: number }> = {};
              for (const x of r) {
                const b = (byTopic[x.ex.topic] ??= { c: 0, t: 0 });
                b.t++;
                if (x.correct) b.c++;
              }
              update((d) => {
                d.checkpoints.push({ id: uid('cp'), day, date: today(), lang, correct: r.filter((x) => x.correct).length, total: r.length, byTopic });
              });
              markBlockDone('checkpoint', lang);
              regenerateTodayPlan();
            }}
          />
        </>
      )}
    </div>
  );
}
