import { useState } from 'react';
import { MED_ABSTRACTS, MED_EXERCISES, MED_PHRASES, MED_TERMS } from '../data/medical';
import { addCustomWord } from '../lib/learning';
import { useStudyTimer } from '../lib/hooks';
import { ExerciseRunner, type ExerciseResult } from '../components/ExerciseRunner';
import { SpeakButton } from '../components/Audio';
import { Button, Card, Notice, PageHeader, Tabs } from '../components/ui';

export function MedicalPage() {
  useStudyTimer('en');
  const [tab, setTab] = useState<'terms' | 'abstract' | 'phrases' | 'quiz'>('terms');
  const [quiz, setQuiz] = useState<ExerciseResult[] | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [showRu, setShowRu] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-4">
      <PageHeader title="Английский для врача и исследователя" subtitle="Дополнительный модуль. До сдачи экзаменов — второстепенный: 1–2 раза в неделю." />
      <Notice tone="info">Медицинская лексика не заменяет общую подготовку к IELTS: экзамен проверяет общий академический английский. Используйте модуль как бонус и для подготовки к докторантуре.</Notice>
      <Tabs value={tab} onChange={setTab} items={[{ value: 'terms', label: 'Термины' }, { value: 'abstract', label: 'Аннотации' }, { value: 'phrases', label: 'Доклад и переписка' }, { value: 'quiz', label: 'Тест' }]} />
      {tab === 'terms' &&
        MED_TERMS.map((g) => (
          <Card key={g.title}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <Button
                size="sm"
                variant="secondary"
                disabled={added[g.title]}
                onClick={() => {
                  g.terms.forEach((t) => addCustomWord('en', t.en, t.ru, '', '', 'Медицина'));
                  setAdded((a) => ({ ...a, [g.title]: true }));
                }}
              >
                {added[g.title] ? 'В словаре' : 'В словарь'}
              </Button>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {g.terms.map((t) => (
                <li key={t.en} className="flex items-center gap-3 py-2">
                  <SpeakButton text={t.en.replace(/\(.*?\)/g, '')} lang="en" compact allowReveal={false} />
                  <div>
                    <div className="font-medium">{t.en}</div>
                    <div className="text-sm text-ink-soft">
                      {t.ru} {t.note && <span className="text-ink-faint">{t.note}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      {tab === 'abstract' &&
        MED_ABSTRACTS.map((a) => (
          <Card key={a.id}>
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="text-xs text-ink-soft">Исследование вымышленное и создано для обучения; цифры не являются научными данными.</p>
            <div className="mt-3 space-y-3">
              {a.parts.map((p) => (
                <div key={p.label} className="rounded-xl border border-line p-3">
                  <div className="text-xs font-semibold tracking-wide text-brand uppercase">{p.label}</div>
                  <p className="mt-1">{p.en}</p>
                  {showRu[p.label] ? (
                    <>
                      <p className="mt-1 text-sm text-ink-soft">{p.ru}</p>
                      <p className="mt-1 text-sm">
                        <strong>Разбор:</strong> {p.note}
                      </p>
                    </>
                  ) : (
                    <button className="mt-1 text-sm text-brand underline" onClick={() => setShowRu((x) => ({ ...x, [p.label]: true }))}>
                      Перевод и разбор
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      {tab === 'phrases' &&
        MED_PHRASES.map((g) => (
          <Card key={g.title}>
            <h2 className="text-lg font-semibold">{g.title}</h2>
            <ul className="mt-2 space-y-2">
              {g.items.map((p) => (
                <li key={p.en} className="flex items-start gap-3">
                  <SpeakButton text={p.en} lang="en" compact allowReveal={false} />
                  <div>
                    <div className="font-medium">{p.en}</div>
                    <div className="text-sm text-ink-soft">{p.ru}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      {tab === 'quiz' &&
        (quiz ? (
          <Card>
            <h2 className="text-lg font-semibold">
              Результат: {quiz.filter((r) => r.correct).length} из {quiz.length}
            </h2>
            <Button className="mt-2" variant="secondary" onClick={() => setQuiz(null)}>
              Пройти ещё раз
            </Button>
          </Card>
        ) : (
          <ExerciseRunner exercises={MED_EXERCISES} lang="en" category="vocab" onDone={setQuiz} allowMore={false} />
        ))}
    </div>
  );
}
