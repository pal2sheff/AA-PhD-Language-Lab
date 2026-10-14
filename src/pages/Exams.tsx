import { useState } from 'react';
import { IELTS_LISTENING_TESTS } from '../data/ielts/listening';
import { IELTS_READING_TESTS } from '../data/ielts/reading';
import { KAZTEST_TESTS } from '../data/kaztest';
import { questionCount } from '../data/exam-types';
import { useAppState, update } from '../lib/store';
import { ieltsOverall, kaztestPassCheck, writingBand, KAZTEST_STRUCTURE, type KaztestBlock } from '../lib/scoring';
import { navigate } from '../lib/router';
import { useStudyTimer } from '../lib/hooks';
import { ExamRunner } from '../components/ExamRunner';
import { Badge, Button, Card, Notice, PageHeader, Tabs } from '../components/ui';
import type { AppState } from '../lib/state';

const ALL_TESTS = [...IELTS_READING_TESTS, ...IELTS_LISTENING_TESTS, ...KAZTEST_TESTS];

export function ExamRun({ testId, mode }: { testId: string; mode: 'exam' | 'training' }) {
  const t = ALL_TESTS.find((x) => x.id === testId);
  useStudyTimer(t?.lang ?? null);
  if (!t)
    return (
      <div>
        <PageHeader title="Тест не найден" back="/exams" />
      </div>
    );
  const back = t.exam === 'ielts' ? `/ielts/${t.section}` : `/kaztest/${t.section}`;
  return (
    <div className="space-y-3">
      <PageHeader title={t.title} back={back} subtitle={mode === 'exam' ? 'Экзаменационный режим' : 'Учебный режим'} />
      <ExamRunner test={t} mode={mode} onExit={() => navigate(back)} />
    </div>
  );
}

function bestBand(s: AppState, kind: 'writing' | 'speaking', task?: 'ielts1' | 'ielts2'): { band: number; source: 'manual' | 'ai' } | null {
  const list = kind === 'writing' ? s.writings.filter((w) => w.lang === 'en' && (!task || w.task === task)) : s.speakings.filter((w) => w.lang === 'en');
  const manual = list.find((w) => w.manualBand);
  if (manual) return { band: manual.manualBand!.band, source: 'manual' };
  const ai = list.find((w) => w.ai?.band != null);
  if (ai) return { band: ai.ai!.band!, source: 'ai' };
  return null;
}

export function ExamsPage() {
  const s = useAppState();
  const [tab, setTab] = useState<'ielts' | 'kaztest'>('ielts');
  const [speakManual, setSpeakManual] = useState('');

  const lastExam = (testIds: string[]) =>
    s.exams
      .filter((e) => testIds.includes(e.testId) && e.mode === 'exam')
      .sort((a, b) => b.finishedAt - a.finishedAt)[0];
  const L = lastExam(IELTS_LISTENING_TESTS.map((t) => t.id));
  const R = lastExam(IELTS_READING_TESTS.map((t) => t.id));
  const w1 = bestBand(s, 'writing', 'ielts1');
  const w2 = bestBand(s, 'writing', 'ielts2');
  const W = w1 && w2 ? { band: writingBand(w1.band, w2.band), source: w1.source === 'ai' || w2.source === 'ai' ? 'ai' : 'manual' } : null;
  const S = bestBand(s, 'speaking');
  const overall = ieltsOverall({ listening: L?.band ?? undefined, reading: R?.band ?? undefined, writing: W?.band, speaking: S?.band });
  const anyAi = W?.source === 'ai' || S?.source === 'ai';

  const kazBlock = (b: KaztestBlock) => {
    if (b === 'listening' || b === 'reading') {
      const e = lastExam(KAZTEST_TESTS.filter((t) => t.section === b).map((t) => t.id));
      return e ? { correct: e.correct, total: e.total, full: e.fullFormat } : undefined;
    }
    return undefined;
  };
  const kazChecks = kaztestPassCheck({ listening: kazBlock('listening'), reading: kazBlock('reading') }, s.settings.kazThresholds);

  return (
    <div className="space-y-4">
      <PageHeader title="Пробные экзамены" subtitle="Полный пробный экзамен, отдельные блоки, учебный и экзаменационный режимы" />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'ielts', label: 'IELTS Mock Test' }, { value: 'kaztest', label: 'КАЗТЕСТ Mock Test' }]} />
      {tab === 'ielts' ? (
        <>
          <Card>
            <h2 className="font-semibold">Полный пробный IELTS</h2>
            <p className="text-sm text-ink-soft">Пройдите модули по порядку, как на экзамене: Listening → Reading → Writing → Speaking. Результат каждого модуля сохраняется.</p>
            <ol className="mt-3 space-y-2">
              {IELTS_LISTENING_TESTS.map((t) => (
                <Row key={t.id} n={1} title={`Listening (${questionCount(t)} вопросов, ${t.minutes} мин)`} done={L ? `${L.correct}/40 → band ${L.band ?? '—'}` : null} onStart={() => navigate(`/exam/${t.id}/exam`)} />
              ))}
              {IELTS_READING_TESTS.map((t) => (
                <Row key={t.id} n={2} title={`Reading (${questionCount(t)} вопросов, ${t.minutes} мин)`} done={R ? `${R.correct}/40 → band ${R.band ?? '—'}` : null} onStart={() => navigate(`/exam/${t.id}/exam`)} />
              ))}
              <Row n={3} title="Writing: Task 1 (20 мин) + Task 2 (40 мин)" done={W ? `band ${W.band}${W.source === 'ai' ? ' (AI, предварительно)' : ' (преподаватель)'}` : w1 || w2 ? 'нужна оценка обоих заданий' : null} onStart={() => navigate('/ielts/writing')} />
              <Row n={4} title="Speaking: полный пробный (11–14 мин)" done={S ? `band ${S.band}${S.source === 'ai' ? ' (AI, предварительно)' : ' (вручную)'}` : null} onStart={() => navigate('/ielts/speaking')} />
            </ol>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span>Оценка Speaking от преподавателя:</span>
              <input value={speakManual} onChange={(e) => setSpeakManual(e.target.value)} className="w-20 rounded-lg border border-line px-2 py-1" placeholder="5.5" inputMode="decimal" />
              <Button
                size="sm"
                variant="secondary"
                disabled={!s.speakings.some((x) => x.lang === 'en') || !speakManual || Number.isNaN(Number(speakManual.replace(',', '.')))}
                onClick={() => {
                  update((d) => {
                    const sp = d.speakings.find((x) => x.lang === 'en');
                    if (sp) sp.manualBand = { band: Number(speakManual.replace(',', '.')), source: 'преподаватель' };
                  });
                  setSpeakManual('');
                }}
              >
                Сохранить к последнему ответу
              </Button>
            </div>
          </Card>
          <Card tone={overall !== null ? 'brand' : undefined}>
            <h2 className="font-semibold">Ориентировочный общий результат</h2>
            {overall !== null ? (
              <>
                <div className="text-3xl font-semibold">{overall.toFixed(1)}</div>
                <p className="text-sm">
                  L {L?.band} · R {R?.band} · W {W?.band} · S {S?.band}. Среднее четырёх модулей, округлённое по правилам IELTS. Writing = (Task 1 + 2 × Task 2) / 3.
                </p>
                {anyAi && <Notice tone="warn">Включает предварительные оценки AI — это не официальный результат.</Notice>}
              </>
            ) : (
              <Notice tone="warn">
                Общий балл не рассчитывается, пока не проверены все четыре компонента: {[!L && 'Listening', !R && 'Reading', !W && 'Writing', !S && 'Speaking'].filter(Boolean).join(', ')}.
              </Notice>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <h2 className="font-semibold">Пробный КАЗТЕСТ</h2>
            <ol className="mt-3 space-y-2">
              {KAZTEST_TESTS.map((t, i) => (
                <Row key={t.id} n={i + 1} title={`${KAZTEST_STRUCTURE[t.section].kz} (${questionCount(t)} вопр., ${t.minutes} мин)${t.fullFormat ? '' : ' — неполный формат'}`} done={kazBlock(t.section) ? `${kazBlock(t.section)!.correct}/${kazBlock(t.section)!.total}` : null} onStart={() => navigate(`/exam/${t.id}/exam`)} />
              ))}
              <Row n={3} title="Жазылым: 2 задания" done={s.writings.some((w) => w.lang === 'kk') ? 'есть работы (оценка — AI или преподаватель)' : null} onStart={() => navigate('/kaztest/writing')} />
              <Row n={4} title="Айтылым: 2 задания" done={s.speakings.some((w) => w.lang === 'kk') ? 'есть записи' : null} onStart={() => navigate('/kaztest/speaking')} />
            </ol>
          </Card>
          <Card>
            <h2 className="font-semibold">Результаты по блокам</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {kazChecks.map((c) => (
                <li key={c.block} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{KAZTEST_STRUCTURE[c.block].kz}</span>
                  <span>
                    {c.percent === null ? 'не проверено' : `${c.percent}%`}{' '}
                    {c.passed === null ? <Badge>порог не задан</Badge> : c.passed ? <Badge tone="good">порог пройден</Badge> : <Badge tone="bad">ниже порога</Badge>}
                  </span>
                </li>
              ))}
            </ul>
            <Notice tone="warn">Итог по шкале 160 баллов не рассчитывается: официальные шкалы перевода в приложение не встроены, а Жазылым и Айтылым не оцениваются автоматически. Проценты — предварительная учебная оценка.</Notice>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ n, title, done, onStart }: { n: number; title: string; done: string | null; onStart: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{n}</span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-ink-soft">{done ?? 'не выполнено'}</div>
      </div>
      <Button size="sm" onClick={onStart}>
        {done ? 'Ещё раз' : 'Начать'}
      </Button>
    </li>
  );
}
