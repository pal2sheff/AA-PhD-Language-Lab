import { useAppState, update } from '../lib/store';
import { diffDays, today, daysWord } from '../lib/dates';
import { weakTopics } from '../lib/planner';
import { latestDiag, SKILL_NAMES, weakSkills } from '../lib/selectors';
import { topicName } from '../data/curriculum';
import { regenerateTodayPlan } from '../lib/learning';
import { Badge, Button, Card, LinkRow, Notice, PageHeader, Segmented } from '../components/ui';

const PLAN_14 = [
  { days: '14–11', focus: 'Диагностический пробный экзамен по всем доступным модулям. Определить 2–3 самых слабых компонента.' },
  { days: '10–8', focus: 'Слабые компоненты: ежедневно 1 экзаменационное задание на время + разбор ошибок. Writing: одно эссе через день с проверкой.' },
  { days: '7', focus: 'Второй пробный экзамен (секции на время). Сравнение с днём 14.' },
  { days: '6–3', focus: 'Только повторение критических тем и стратегий; новые необязательные темы не изучаются. Speaking — ежедневно 10–15 минут.' },
  { days: '2', focus: 'Лёгкий день: словарь, короткое аудирование, проверка документов и маршрута к месту экзамена.' },
  { days: '1', focus: 'Отдых. Никаких пробных экзаменов. Ранний сон.' },
];

export function EmergencyPage() {
  const s = useAppState();
  const em = s.settings.emergency;
  const lang = em.exam === 'ielts' ? 'en' : 'kk';
  const date = em.exam === 'ielts' ? s.examDates.ielts : s.examDates.kaztest;
  const left = date ? diffDays(today(), date) : null;
  const weak = weakTopics(s, lang).slice(0, 6);
  const skills = weakSkills(s, lang);
  const diag = latestDiag(s, lang);

  return (
    <div className="space-y-4">
      <PageHeader title="Экстренная подготовка" subtitle="Режим последних 14 дней перед экзаменом" />
      <Card>
        <div className="mb-2 text-sm font-medium">Экзамен</div>
        <Segmented value={em.exam} onChange={(v) => update((d) => void (d.settings.emergency.exam = v))} options={[{ value: 'ielts', label: 'IELTS' }, { value: 'kaztest', label: 'КАЗТЕСТ' }]} />
        <p className="mt-3 text-sm">
          {date ? (left !== null && left >= 0 ? `До экзамена: ${daysWord(left)}.` : 'Дата экзамена прошла.') : 'Дата экзамена не указана — введите её в Календаре.'}
          {left !== null && left > 14 && ' Режим рекомендуется включать за 14 дней до экзамена.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant={em.active ? 'danger' : 'primary'}
            onClick={() => {
              update((d) => void (d.settings.emergency.active = !d.settings.emergency.active));
              regenerateTodayPlan();
            }}
          >
            {em.active ? 'Выключить режим' : 'Включить режим'}
          </Button>
          <Button variant="secondary" href="/calendar">
            Даты экзаменов
          </Button>
        </div>
        {em.active && <Notice tone="good">Режим включён: в ежедневном плане для {em.exam === 'ielts' ? 'английского' : 'казахского'} — только экзаменационные задания, слабые темы и повторение; новые необязательные темы исключены.</Notice>}
      </Card>

      <Card>
        <h2 className="font-semibold">Приоритеты (определены автоматически)</h2>
        {!diag && <p className="text-sm text-warn">Диагностика не пройдена — приоритеты неточны.</p>}
        {skills.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
            Слабые компоненты:
            {skills.map((k) => (
              <Badge key={k} tone="warn">
                {SKILL_NAMES[k]}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-2">
          {weak.length ? (
            weak.map((w) => <LinkRow key={w.topic} href={`/practice/${encodeURIComponent(w.topic)}`} title={topicName(w.topic)} subtitle={`точность ${Math.round(w.accuracy * 100)}%`} />)
          ) : (
            <p className="text-sm text-ink-soft">Критических тем не выявлено.</p>
          )}
        </div>
        <LinkRow href={`/mistakes/review/${lang}`} icon="flag" title="Повторить мои ошибки" />
        <LinkRow href="/exams" icon="clock" title="Пробные экзамены на время" />
        <LinkRow href={em.exam === 'ielts' ? '/ielts/writing' : '/kaztest/writing'} icon="pen" title="Проверка письменных работ" />
        <LinkRow href={em.exam === 'ielts' ? '/ielts/speaking' : '/kaztest/speaking'} icon="mic" title="Разговорная практика" />
      </Card>

      <Card>
        <h2 className="font-semibold">План на 14 дней</h2>
        <ul className="mt-2 space-y-2">
          {PLAN_14.map((p) => (
            <li key={p.days} className="flex gap-3 text-sm">
              <span className="w-14 shrink-0 font-semibold">день −{p.days}</span>
              <span>{p.focus}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-soft">Не более двух полных пробных экзаменов за 14 дней: ежедневные полные экзамены утомляют и не дают времени на разбор ошибок. Сон и восстановление — часть подготовки.</p>
      </Card>
    </div>
  );
}
