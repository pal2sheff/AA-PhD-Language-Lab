import type { Lang } from '../data/types';
import { UNITS } from '../data/curriculum';
import { getLesson } from '../data';
import { useAppState } from '../lib/store';
import { lessonProgress, latestDiag, SKILL_NAMES, vocabStats } from '../lib/selectors';
import { topicMastered, weakTopics } from '../lib/planner';
import { navigate } from '../lib/router';
import { Badge, Button, Card, LinkRow, PageHeader, Progress } from '../components/ui';
import { topicName } from '../data/curriculum';

export function LanguageHub({ lang }: { lang: Lang }) {
  const s = useAppState();
  const lp = lessonProgress(s, lang);
  const diag = latestDiag(s, lang);
  const vs = vocabStats(s, lang);
  const weak = weakTopics(s, lang);
  const isEn = lang === 'en';
  const units = UNITS[lang];

  return (
    <div className="space-y-4">
      <PageHeader title={isEn ? 'Английский язык' : 'Казахский язык'} subtitle={isEn ? 'Самоучитель A1 → B2 с фокусом на IELTS Academic 5.0–5.5' : 'Самоучитель с объяснениями на русском и подготовкой к КАЗТЕСТ'} />
      <Card tone={isEn ? 'en' : 'kk'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-ink-soft">Ориентировочный уровень</div>
            <div className="text-2xl font-semibold">{diag?.overall ?? '—'}</div>
          </div>
          <div className="text-sm">
            <div>
              Уроков пройдено: <strong>{lp.passed}</strong> из {lp.lessonsAvailable}
            </div>
            <div>
              Слов: <strong>{vs.total}</strong> (освоено {vs.mastered})
            </div>
          </div>
          {!diag && (
            <Button variant={isEn ? 'primary' : 'kk'} href={`/diagnostic/${lang}`}>
              Пройти диагностику
            </Button>
          )}
        </div>
        {diag && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(diag.skills).map(([k, v]) => (
              <Badge key={k} tone={v?.tested ? (isEn ? 'brand' : 'kk') : 'warn'}>
                {SKILL_NAMES[k]}: {v?.tested ? v.level : 'не проверено'}
              </Badge>
            ))}
          </div>
        )}
        <Progress value={lp.pctOfProgram} tone={isEn ? 'brand' : 'kk'} className="mt-3" label="Прогресс программы" />
      </Card>

      {weak.length > 0 && (
        <Card tone="warn">
          <h2 className="font-semibold">Темы, требующие внимания</h2>
          <div className="mt-2 space-y-1">
            {weak.slice(0, 5).map((w) => (
              <LinkRow key={w.topic} href={`/practice/${encodeURIComponent(w.topic)}`} title={topicName(w.topic)} subtitle={`точность ${Math.round(w.accuracy * 100)}%, открытых ошибок: ${w.open}`} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-1 font-semibold">Программа курса</h2>
        <p className="mb-2 text-sm text-ink-soft">Темы с готовым материалом открываются сразу. Темы с пометкой «в разработке» запланированы, но учебный материал для них ещё не создан.</p>
        <ul className="divide-y divide-line">
          {units.map((u, i) => {
            const lesson = u.lessonId ? getLesson(u.lessonId) : undefined;
            const p = u.lessonId ? s.lessons[u.lessonId] : undefined;
            const mastered = topicMastered(s, u.topic);
            return (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 shrink-0 text-right text-sm text-ink-faint tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{u.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
                    <Badge>{u.level}</Badge>
                    <Badge>этап {u.phase}</Badge>
                    {p?.passed && <Badge tone="good">пройден {Math.round(p.bestControl * 100)}%</Badge>}
                    {p && !p.passed && p.completedAt && <Badge tone="warn">повторить</Badge>}
                    {mastered && <Badge tone="good">тема освоена</Badge>}
                    {!lesson && !u.route && <Badge tone="neutral">в разработке</Badge>}
                    {!lesson && u.route && <Badge tone={isEn ? 'brand' : 'kk'}>тренажёр</Badge>}
                  </div>
                </div>
                {lesson ? (
                  <Button size="sm" variant={p?.passed ? 'secondary' : isEn ? 'primary' : 'kk'} onClick={() => navigate(`/lesson/${lesson.id}`)}>
                    {p?.passed ? 'Повторить' : p ? 'Продолжить' : 'Начать'}
                  </Button>
                ) : u.route ? (
                  <Button size="sm" variant="secondary" onClick={() => navigate(u.route!.replace(/^#/, ''))}>
                    Открыть
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold">Тренажёры</h2>
        <LinkRow href={`/vocab/review/${lang}`} icon="cards" title="Повторение слов" subtitle={`${vs.due} к повтору сейчас`} />
        <LinkRow href={`/dictation/${lang}`} icon="headphones" title="Аудиодиктанты" />
        <LinkRow href={`/pronunciation/${lang}`} icon="mic" title="Произношение: повтор за диктором" />
        <LinkRow href={`/mistakes/review/${lang}`} icon="flag" title="Повторить мои ошибки" />
        <LinkRow href={isEn ? '/ielts' : '/kaztest'} icon="target" title={isEn ? 'IELTS Academic' : 'КАЗТЕСТ'} />
        {isEn && <LinkRow href="/medical" icon="stethoscope" title="Английский для врача и исследователя" subtitle="Дополнительный модуль" />}
      </Card>
    </div>
  );
}
