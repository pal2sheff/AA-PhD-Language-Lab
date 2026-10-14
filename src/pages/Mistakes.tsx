import { useMemo, useState } from 'react';
import type { Exercise, Lang, MistakeCategory } from '../data/types';
import { useAppState, getState } from '../lib/store';
import { deleteMistake, markBlockDone, setMistakeStatus } from '../lib/learning';
import { exercisesForTopic, findExercise, lessonForTopic } from '../data';
import { topicName } from '../data/curriculum';
import { ExerciseRunner, type ExerciseResult } from '../components/ExerciseRunner';
import { Badge, Button, Card, Empty, Notice, PageHeader, Tabs, cx } from '../components/ui';
import { useStudyTimer } from '../lib/hooks';
import { Theory } from './Lesson';
import { Modal } from '../components/ui';
import { formatDate, toISODate } from '../lib/dates';

const CAT_NAMES: Record<MistakeCategory, string> = {
  grammar: 'Грамматика',
  vocab: 'Лексика',
  spelling: 'Орфография',
  listening: 'Аудирование',
  reading: 'Чтение',
  writing: 'Письменная речь',
  speaking: 'Устная речь',
};

export function MistakesPage() {
  const s = useAppState();
  const [lang, setLang] = useState<Lang | 'all'>('all');
  const [cat, setCat] = useState<MistakeCategory | 'all'>('all');
  const [status, setStatus] = useState<'open' | 'fixed' | 'all'>('open');
  const list = s.mistakes.filter((m) => (lang === 'all' || m.lang === lang) && (cat === 'all' || m.category === cat) && (status === 'all' || m.status === status));
  const byTopic = new Map<string, number>();
  for (const m of s.mistakes) if (m.status === 'open' && (lang === 'all' || m.lang === lang)) byTopic.set(m.topic, (byTopic.get(m.topic) ?? 0) + m.count);
  const topTopics = [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-4">
      <PageHeader title="Мои ошибки" subtitle="История неправильных ответов с объяснениями. Тема считается исправленной после двух верных ответов подряд на новые задания." />
      <div className="flex flex-wrap gap-2">
        <Button href="/mistakes/review/en" icon="refresh">
          Повторить мои ошибки (EN)
        </Button>
        <Button href="/mistakes/review/kk" icon="refresh" variant="kk">
          Повторить мои ошибки (KK)
        </Button>
      </div>
      <Tabs value={lang} onChange={setLang} items={[{ value: 'all', label: 'Все' }, { value: 'en', label: 'Английский' }, { value: 'kk', label: 'Казахский' }]} />
      {topTopics.length > 0 && (
        <Card>
          <h2 className="font-semibold">Повторяющиеся ошибки по темам</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topTopics.map(([t, n]) => (
              <a key={t} href={`#/practice/${encodeURIComponent(t)}`}>
                <Badge tone="warn">
                  {topicName(t)} · {n}
                </Badge>
              </a>
            ))}
          </div>
        </Card>
      )}
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...Object.keys(CAT_NAMES)] as (MistakeCategory | 'all')[]).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cx('rounded-full border px-3 py-1 text-sm', cat === c ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line text-ink-soft')}>
            {c === 'all' ? 'все категории' : CAT_NAMES[c]}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {(['open', 'fixed', 'all'] as const).map((x) => (
          <button key={x} onClick={() => setStatus(x)} className={cx('rounded-full border px-3 py-1 text-sm', status === x ? 'border-ink bg-ink text-white' : 'border-line text-ink-soft')}>
            {x === 'open' ? 'не исправлены' : x === 'fixed' ? 'исправлены' : 'все'}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty title="Ошибок нет">Здесь появятся неправильные ответы из уроков, тестов, словаря, письма и речи.</Empty>
      ) : (
        <div className="space-y-2">
          {list.slice(0, 200).map((m) => (
            <Card key={m.id} className="!p-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <Badge tone={m.lang === 'en' ? 'brand' : 'kk'}>{m.lang === 'en' ? 'EN' : 'KK'}</Badge>
                <Badge>{CAT_NAMES[m.category]}</Badge>
                <Badge>{topicName(m.topic)}</Badge>
                {m.count > 1 && <Badge tone="warn">повторялась {m.count} раза</Badge>}
                <Badge tone={m.status === 'fixed' ? 'good' : 'bad'}>{m.status === 'fixed' ? 'исправлена' : 'не исправлена'}</Badge>
                <span className="ml-auto text-ink-faint">{formatDate(toISODate(new Date(m.lastAt)))}</span>
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{m.prompt}</div>
                <div className="mt-1">
                  Ваш ответ: <span className="text-bad">{m.userAnswer || '—'}</span>
                </div>
                <div>
                  Правильно: <span className="text-good">{m.correct}</span>
                </div>
                {m.explain && <div className="mt-1 text-ink-soft">{m.explain}</div>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" href={`/practice/${encodeURIComponent(m.topic)}`}>
                  Потренировать тему
                </Button>
                {m.status === 'open' ? (
                  <Button size="sm" variant="ghost" onClick={() => setMistakeStatus(m.id, 'fixed')}>
                    Отметить исправленной
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setMistakeStatus(m.id, 'open')}>
                    Вернуть в работу
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteMistake(m.id)}>
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Персональное занятие по ошибкам: для каждой темы с открытыми ошибками берутся НОВЫЕ
 * упражнения той же темы (которые пользователь ещё не решал или давно не видел);
 * исходное задание возвращается не чаще одного раза.
 */
function buildMistakeSession(lang: Lang): Exercise[] {
  const s = getState();
  const open = s.mistakes.filter((m) => m.lang === lang && m.status === 'open');
  const topics = [...new Set(open.map((m) => m.topic))];
  const out: Exercise[] = [];
  for (const t of topics.slice(0, 6)) {
    const failedKeys = new Set(open.filter((m) => m.topic === t).map((m) => m.key));
    const pool = exercisesForTopic(t).filter((e) => !failedKeys.has(e.id) && (e.type !== 'listen' || e.say));
    pool.sort((a, b) => (s.seenExercises[a.id] ?? 0) - (s.seenExercises[b.id] ?? 0));
    out.push(...pool.slice(0, 2));
    // одно исходное задание — после новых, для проверки
    const orig = [...failedKeys].map((k) => findExercise(k)?.ex).find((e) => e && (e.type !== 'listen' || e.say));
    if (orig && pool.length < 2) out.push(orig);
  }
  return out.slice(0, 12);
}

export function MistakesReview({ lang }: { lang: Lang }) {
  useStudyTimer(lang);
  const [session] = useState(() => buildMistakeSession(lang));
  const [done, setDone] = useState<ExerciseResult[] | null>(null);
  const openTopics = useMemo(() => [...new Set(getState().mistakes.filter((m) => m.lang === lang && m.status === 'open').map((m) => m.topic))], [lang]);
  const freeOnly = openTopics.length > 0 && session.length === 0;
  return (
    <div className="space-y-4">
      <PageHeader title="Повторение ошибок" back="/mistakes" subtitle={lang === 'en' ? 'Английский' : 'Казахский'} />
      {done ? (
        <Card>
          <h2 className="text-lg font-semibold">Занятие завершено</h2>
          <p>
            Верно: {done.filter((r) => r.correct).length} из {done.length}. Темы с двумя верными ответами подряд отмечены как исправленные.
          </p>
          <div className="mt-3 flex gap-2">
            <Button href="/mistakes" variant="secondary">
              Мои ошибки
            </Button>
            <Button href="/today">К плану</Button>
          </div>
        </Card>
      ) : session.length ? (
        <>
          <Notice tone="info">Персональное занятие: {openTopics.length} тем с ошибками. Используются новые задания на те же правила, а не повтор одних и тех же вопросов.</Notice>
          <ExerciseRunner
            exercises={session}
            lang={lang}
            title="Задание"
            onDone={(r) => {
              setDone(r);
              markBlockDone('mistakes', lang);
            }}
          />
        </>
      ) : (
        <Empty title={freeOnly ? 'Нет готовых упражнений по этим темам' : 'Открытых ошибок нет'}>
          {freeOnly ? 'Ошибки относятся к письму, речи или словарю — повторите их в соответствующих тренажёрах или со словарём.' : 'Отличная работа! Новые ошибки появятся здесь автоматически.'}
        </Empty>
      )}
    </div>
  );
}

export function PracticeTopic({ topic }: { topic: string }) {
  const lang: Lang = topic.startsWith('kk.') ? 'kk' : 'en';
  useStudyTimer(lang);
  const [rule, setRule] = useState(false);
  const [done, setDone] = useState<ExerciseResult[] | null>(null);
  const lesson = lessonForTopic(topic);
  const [session] = useState(() => {
    const s = getState();
    const pool = exercisesForTopic(topic).filter((e) => e.type !== 'listen' || e.say);
    return pool.sort((a, b) => (s.seenExercises[a.id] ?? 0) - (s.seenExercises[b.id] ?? 0)).slice(0, 8);
  });
  return (
    <div className="space-y-4">
      <PageHeader title={`Тренировка: ${topicName(topic)}`} back={lang === 'en' ? '/en' : '/kk'} />
      {lesson && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon="book" onClick={() => setRule(true)}>
            Повтори правило
          </Button>
          <Button size="sm" variant="secondary" href={`/lesson/${lesson.id}`}>
            Открыть урок
          </Button>
        </div>
      )}
      {done ? (
        <Card>
          <h2 className="text-lg font-semibold">Готово</h2>
          <p>
            Верно: {done.filter((r) => r.correct).length} из {done.length}.
          </p>
          <div className="mt-3 flex gap-2">
            <Button href="/today">К плану</Button>
          </div>
        </Card>
      ) : session.length ? (
        <ExerciseRunner
          exercises={session}
          lang={lang}
          onShowRule={lesson ? () => setRule(true) : undefined}
          onDone={(r) => {
            setDone(r);
            markBlockDone('topic', lang, topic);
          }}
        />
      ) : (
        <Empty title="Для этой темы пока нет готовых упражнений">Тема запланирована в программе, учебный материал для неё ещё не создан.</Empty>
      )}
      {lesson && (
        <Modal open={rule} onClose={() => setRule(false)} title={lesson.title}>
          <p className="mb-3 rounded-xl bg-canvas p-3">{lesson.simple}</p>
          <Theory blocks={lesson.theory} />
        </Modal>
      )}
    </div>
  );
}
