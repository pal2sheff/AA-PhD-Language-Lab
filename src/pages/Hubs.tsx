// Разделы-витрины нижней навигации iPhone: «Курсы» (обучение + практика) и «Экзамены».
// Только навигация: никаких новых данных и расчётов — показатели берутся из существующих селекторов.
import type { ReactNode } from 'react';
import type { Lang } from '../data/types';
import { getLesson } from '../data';
import { useAppState } from '../lib/store';
import { nextLesson } from '../lib/planner';
import { latestDiag, latestSections, lessonProgress, vocabStats } from '../lib/selectors';
import { navigate } from '../lib/router';
import { Button, Card, Eyebrow, PageHeader, Progress, SectionTitle, cx } from '../components/ui';
import { Icon, type IconName } from '../components/icons';

export function Tile({ href, icon, title, subtitle, tone = 'neutral', meta }: { href: string; icon: IconName; title: string; subtitle?: ReactNode; tone?: 'en' | 'kk' | 'warm' | 'neutral'; meta?: ReactNode }) {
  const ic = { en: 'bg-brand-soft text-brand', kk: 'bg-kk-soft text-kk', warm: 'bg-warm-soft text-warm-ink', neutral: 'bg-subtle text-ink-soft' }[tone];
  return (
    <button onClick={() => navigate(href)} className="group flex min-h-[76px] w-full items-center gap-4 rounded-card border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-line-strong">
      <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', ic)}>
        <Icon name={icon} size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {subtitle && <span className="mt-0.5 block text-sm text-ink-soft">{subtitle}</span>}
      </span>
      {meta && <span className="shrink-0 text-sm font-medium text-ink-soft tabular-nums">{meta}</span>}
      <Icon name="chevronRight" size={18} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function CourseCard({ lang }: { lang: Lang }) {
  const s = useAppState();
  const isEn = lang === 'en';
  const lp = lessonProgress(s, lang);
  const diag = latestDiag(s, lang);
  const next = nextLesson(s, lang);
  const nextTitle = !diag ? 'Диагностика уровня' : next ? getLesson(next)!.title : 'Экзаменационные тренажёры';
  const go = !diag ? `/diagnostic/${lang}` : next ? `/lesson/${next}` : isEn ? '/ielts' : '/kaztest';
  return (
    <Card tone={isEn ? 'en' : 'kk'} className="flex flex-col">
      <Eyebrow tone={isEn ? 'en' : 'kk'}>{isEn ? 'Английский язык' : 'Казахский язык'}</Eyebrow>
      <h2 className="mt-1 text-xl font-semibold">{isEn ? 'Курс A1 → B2 · IELTS' : 'Курс с нуля · КАЗТЕСТ'}</h2>
      <div className="mt-4 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-ink-soft">Пройдено уроков</span>
        <span className="font-semibold tabular-nums">
          {lp.passed} из {lp.lessonsAvailable}
        </span>
      </div>
      <Progress value={lp.lessonsAvailable ? (lp.passed / lp.lessonsAvailable) * 100 : 0} tone={isEn ? 'brand' : 'kk'} className="mt-2" label="Пройдено уроков" />
      <div className="mt-4 text-sm text-ink-soft">Следующее</div>
      <div className="font-medium">{nextTitle}</div>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button variant={isEn ? 'primary' : 'kk'} onClick={() => navigate(go)} className="flex-1">
          Продолжить
        </Button>
        <Button variant="secondary" href={`/${lang}`} className="flex-1">
          Программа
        </Button>
      </div>
    </Card>
  );
}

export function CoursesPage() {
  const s = useAppState();
  const vs = vocabStats(s);
  const open = s.mistakes.filter((m) => m.status === 'open').length;
  return (
    <div>
      <PageHeader title="Курсы" subtitle="Самоучители по двум языкам и тренажёры для ежедневной практики" />
      <div className="grid gap-5 md:grid-cols-2">
        <CourseCard lang="en" />
        <CourseCard lang="kk" />
      </div>
      <SectionTitle className="mt-10">Практика</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Tile href="/vocab" icon="cards" title="Словарь" subtitle="Интервальное повторение слов" meta={vs.due ? `${vs.due} к повтору` : undefined} />
        <Tile href="/pronunciation/en" icon="headphones" title="Произношение и диктанты" subtitle="Повтор за диктором, аудиодиктанты" />
        <Tile href="/conversation" icon="mic" title="Разговорный тренажёр" subtitle="Диалоги по ситуациям" />
        <Tile href="/mistakes" icon="flag" title="Мои ошибки" subtitle="Повторение и разбор" meta={open ? `${open} открыто` : undefined} />
        <Tile href="/tutor" icon="chat" title="AI-преподаватель" subtitle="Объяснения и проверка (нужен сервер)" />
        <Tile href="/medical" icon="stethoscope" title="Английский для врача" subtitle="Дополнительный модуль" tone="warm" />
      </div>
    </div>
  );
}

function ExamCard({ exam }: { exam: 'ielts' | 'kaztest' }) {
  const s = useAppState();
  const isEn = exam === 'ielts';
  const sec = Object.values(latestSections(s, exam));
  return (
    <Card tone={isEn ? 'en' : 'kk'} className="flex flex-col">
      <Eyebrow tone={isEn ? 'en' : 'kk'}>{isEn ? 'Английский' : 'Казахский'}</Eyebrow>
      <h2 className="mt-1 text-xl font-semibold">{isEn ? 'IELTS Academic' : 'КАЗТЕСТ'}</h2>
      <div className="mt-1 text-sm text-ink-soft">
        {isEn
          ? `Цель: ${s.settings.ieltsMin.toFixed(1)}–${s.settings.ieltsTarget.toFixed(1)}`
          : s.settings.kazTargetLevel
            ? `Цель: уровень ${s.settings.kazTargetLevel}`
            : 'Цель уточняется после диагностики'}
      </div>
      <div className="mt-4 text-sm">
        {sec.length ? (
          <ul className="space-y-1.5">
            {sec.map((e) => (
              <li key={e.section} className="flex justify-between gap-3">
                <span className="text-ink-soft">{e.section}</span>
                <span className="font-medium tabular-nums">
                  {e.correct} / {e.total}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-ink-soft">Секции ещё не выполнялись.</span>
        )}
      </div>
      <div className="mt-auto pt-5">
        <Button variant={isEn ? 'primary' : 'kk'} href={isEn ? '/ielts' : '/kaztest'} className="w-full">
          {isEn ? 'Тренажёры IELTS' : 'Тренажёры КАЗТЕСТ'}
        </Button>
      </div>
    </Card>
  );
}

export function ExamCenterPage() {
  const s = useAppState();
  return (
    <div>
      <PageHeader title="Экзамены" subtitle="Тренажёры по секциям и пробные экзамены с таймером" />
      <div className="grid gap-5 md:grid-cols-2">
        <ExamCard exam="ielts" />
        <ExamCard exam="kaztest" />
      </div>
      <SectionTitle className="mt-10">Проверка в условиях экзамена</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Tile href="/exams" icon="clock" title="Пробные экзамены" subtitle="Таймер, без подсказок, результат после сдачи" meta={s.exams.length ? `${s.exams.length} попыт.` : undefined} />
        <Tile href="/emergency" icon="bolt" title="Экстренная подготовка" subtitle="Если экзамен уже скоро" tone="warm" />
      </div>
    </div>
  );
}
