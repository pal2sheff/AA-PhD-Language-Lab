import { useState } from 'react';
import { KAZTEST_LISTENING_1, KAZTEST_READING_1, KAZTEST_SPEAKING, KAZTEST_WRITING } from '../data/kaztest';
import { KAZTEST_MAX_POINTS, KAZTEST_STRUCTURE, KAZTEST_TOTAL_MINUTES } from '../lib/scoring';
import { useAppState } from '../lib/store';
import { latestSections } from '../lib/selectors';
import { navigate } from '../lib/router';
import { useStudyTimer } from '../lib/hooks';
import { questionCount } from '../data/exam-types';
import { Badge, Button, Card, LinkRow, Notice, PageHeader, cx } from '../components/ui';
import { WritingTrainer } from '../components/WritingTrainer';
import { SpeakRecorder } from '../components/SpeakRecorder';
import { SpeakButton } from '../components/Audio';

export function KaztestHub() {
  const s = useAppState();
  const last = latestSections(s, 'kaztest');
  const t = s.settings.kazThresholds;
  return (
    <div className="space-y-4">
      <PageHeader title="КАЗТЕСТ" subtitle={`Целевой уровень: ${s.settings.kazTargetLevel ?? 'не выбран'}${s.settings.kazRequired ? ` · требование: ${s.settings.kazRequired}` : ''}`} />
      <Card>
        <h2 className="font-semibold">Структура сертификационного тестирования</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-ink-soft">
                <th className="py-1">Блок</th>
                <th>Задания</th>
                <th>Время</th>
                <th>Последний результат</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(KAZTEST_STRUCTURE).map((b) => (
                <tr key={b.key} className="border-t border-line">
                  <td className="py-1.5">
                    <strong>{b.kz}</strong> <span className="text-ink-soft">{b.ru}</span>
                  </td>
                  <td>{b.questions}</td>
                  <td>{b.minutes} мин</td>
                  <td>{last[b.key] ? `${Math.round((last[b.key].correct / last[b.key].total) * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm">
          Общая продолжительность — {KAZTEST_TOTAL_MINUTES} минут, максимум — {KAZTEST_MAX_POINTS} баллов. Сертификат требует преодоления порога по каждому блоку.
        </p>
        <Notice tone="warn">
          Параметры структуры взяты из технического задания; проверить их на testcenter.kz из текущей среды не удалось — сверьте перед экзаменом. Официальные пороги {t ? `введены (${t.source || 'источник не указан'})` : 'не введены'} — Настройки → Цели.
        </Notice>
      </Card>
      <Card>
        <LinkRow href="/kaztest/listening" icon="headphones" title="Тыңдалым — аудирование" subtitle="2 диалога (по 5 вопросов) + текст (10 вопросов)" />
        <LinkRow href="/kaztest/reading" icon="book" title="Оқылым — чтение" subtitle="4 текста: 6 + 10 + 12 + 12 вопросов (в приложении пока тексты 1–2)" />
        <LinkRow href="/kaztest/writing" icon="pen" title="Жазылым — письмо" subtitle="Описание изображения + эссе, 50 минут" />
        <LinkRow href="/kaztest/speaking" icon="mic" title="Айтылым — говорение" subtitle="Мнение по вопросам + высказывание по ситуации, 7 минут" />
      </Card>
      <Button href="/exams">Пробный КАЗТЕСТ</Button>
    </div>
  );
}

function KazTestCard({ id }: { id: string }) {
  const s = useAppState();
  const t = [KAZTEST_LISTENING_1, KAZTEST_READING_1].find((x) => x.id === id)!;
  const attempts = s.exams.filter((e) => e.testId === id);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">{t.title}</h2>
        <Badge>{questionCount(t)} вопросов</Badge>
        <Badge>{t.minutes} мин</Badge>
        {!t.fullFormat && <Badge tone="warn">частичный формат</Badge>}
      </div>
      <p className="mt-1 text-sm text-ink-soft">{t.formatNote}</p>
      {attempts.length > 0 && (
        <p className="mt-1 text-sm">
          Попыток: {attempts.length} · последняя: {attempts.at(-1)!.correct}/{attempts.at(-1)!.total}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate(`/exam/${id}/training`)}>
          Тренировка (с переводом)
        </Button>
        <Button variant="kk" onClick={() => navigate(`/exam/${id}/exam`)} icon="clock">
          Экзаменационный режим
        </Button>
      </div>
    </Card>
  );
}

export function KaztestListening() {
  useStudyTimer('kk');
  return (
    <div className="space-y-4">
      <PageHeader title="Тыңдалым" back="/kaztest" subtitle="20 вопросов, 20 минут" />
      <Card>
        <h2 className="font-semibold">Как тренироваться</h2>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
          <li>Сначала прочитайте вопросы: кто? где? когда? сколько?</li>
          <li>Числа, дни недели и время — частые ответы (урок «Числа, время, даты»).</li>
          <li>Ответ часто перефразирован: «түстен кейін» ↔ «15:00».</li>
        </ul>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="secondary" href="/lesson/kk-11">
            Урок: числа и время
          </Button>
          <Button size="sm" variant="secondary" href="/dictation/kk">
            Диктанты
          </Button>
        </div>
      </Card>
      <KazTestCard id="kaz-listening-1" />
    </div>
  );
}

export function KaztestReading() {
  useStudyTimer('kk');
  return (
    <div className="space-y-4">
      <PageHeader title="Оқылым" back="/kaztest" subtitle="Официальный формат: 4 текста, 40 вопросов, 50 минут" />
      <Card>
        <h2 className="font-semibold">Стратегия</h2>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
          <li>Тексты разного стиля: объявление, публицистика, научно-популярный текст.</li>
          <li>Ищите в тексте ключевые слова вопроса и их синонимы.</li>
          <li>Вопросы «не айтылмаған» (что НЕ сказано) — проверяйте каждый вариант по тексту.</li>
        </ul>
      </Card>
      <KazTestCard id="kaz-reading-1" />
    </div>
  );
}

export function KaztestWriting() {
  useStudyTimer('kk');
  const [id, setId] = useState<string | null>(null);
  const t = KAZTEST_WRITING.find((x) => x.id === id);
  if (t)
    return (
      <div className="space-y-4">
        <PageHeader title={t.title} back="/kaztest/writing" />
        <button className="text-sm text-brand underline" onClick={() => setId(null)}>
          ← другие задания
        </button>
        <WritingTrainer
          key={t.id}
          lang="kk"
          task={t.task}
          promptId={t.id}
          prompt={t.prompt}
          minutes={25}
          minWords={t.task === 'kaz1' ? 80 : 120}
          extra={
            <div>
              <p className="text-sm text-ink-soft">{t.ru}</p>
              {t.scene && (
                <div className="mt-3 flex flex-wrap justify-center gap-3 rounded-xl bg-canvas p-4 text-4xl" role="img" aria-label="Изображение для описания">
                  {t.scene.map((e, i) => (
                    <span key={i}>{e}</span>
                  ))}
                </div>
              )}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-brand">Полезные конструкции</summary>
                <ul className="mt-1 list-disc pl-5" lang="kk">
                  {t.hints.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </details>
            </div>
          }
        />
      </div>
    );
  return (
    <div className="space-y-4">
      <PageHeader title="Жазылым" back="/kaztest" subtitle="2 задания, 50 минут: описание изображения и эссе" />
      <Notice tone="info">Автоматически проверяются объём, связки, окончания множественного числа и использование казахских букв. Грамматику и раскрытие темы полноценно оценивает AI или преподаватель.</Notice>
      {(['kaz1', 'kaz2'] as const).map((task) => (
        <Card key={task}>
          <h2 className="font-semibold">{task === 'kaz1' ? '1-тапсырма: сурет бойынша' : '2-тапсырма: эссе'}</h2>
          <div className="mt-2 space-y-1">
            {KAZTEST_WRITING.filter((w) => w.task === task).map((w) => (
              <button key={w.id} onClick={() => setId(w.id)} className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-canvas">
                {w.title}
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function KaztestSpeaking() {
  useStudyTimer('kk');
  const [id, setId] = useState(KAZTEST_SPEAKING[0].id);
  const t = KAZTEST_SPEAKING.find((x) => x.id === id)!;
  return (
    <div className="space-y-4">
      <PageHeader title="Айтылым" back="/kaztest" subtitle="2 задания, 7 минут" />
      <div className="flex flex-wrap gap-1.5">
        {KAZTEST_SPEAKING.map((x, i) => (
          <button key={x.id} onClick={() => setId(x.id)} className={cx('rounded-full border px-3 py-1 text-sm', x.id === id ? 'border-kk bg-kk-soft' : 'border-line')}>
            {x.task === 1 ? 'Пікір' : 'Жағдаят'} {i + 1}
          </button>
        ))}
      </div>
      <Card>
        <Badge tone="kk">{t.task === 1 ? '1-тапсырма: өз пікіріңізді білдіріңіз' : '2-тапсырма: жағдаят бойынша сөйлеңіз'}</Badge>
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-kk-soft p-3">
          <SpeakButton text={t.prompt} lang="kk" compact allowReveal={false} />
          <div>
            <div className="font-medium" lang="kk">
              {t.prompt}
            </div>
            <div className="text-sm text-ink-soft">{t.ru}</div>
          </div>
        </div>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-brand">Опорные фразы</summary>
          <ul className="mt-1 list-disc pl-5" lang="kk">
            {t.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
        <SpeakRecorder key={id} lang="kk" context={`КАЗТЕСТ Айтылым ${t.task}`} prompt={t.prompt} targetSeconds={t.task === 1 ? 120 : 150} />
      </Card>
    </div>
  );
}
