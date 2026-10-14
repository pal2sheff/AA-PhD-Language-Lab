import { useMemo, useState } from 'react';
import type { DiagItem, Lang, Skill } from '../data/types';
import { DIAG_SPEAKING_PROMPTS, DIAG_WRITING_PROMPTS, EN_DIAG, KK_DIAG } from '../data/diagnostic';
import { answerItem, estimateLevel, gapTopics, ITEMS_PER_SKILL, newSkillSession, OBJECTIVE_SKILLS, overallLevel, pickNextItem, type ObjectiveSkill } from '../lib/diagnostic';
import { useAppState, update, getState } from '../lib/store';
import type { DiagnosticResult, DiagnosticSession } from '../lib/state';
import { navigate } from '../lib/router';
import { Badge, Button, Card, Notice, PageHeader, Progress, cx } from '../components/ui';
import { SpeakButton } from '../components/Audio';
import { SpeakRecorder } from '../components/SpeakRecorder';
import { shuffle, wordCount } from '../lib/text';
import { SKILL_NAMES } from '../lib/selectors';
import { topicName } from '../data/curriculum';
import { courseDay, isRestDay, minutesSplit, recommendEnShare } from '../lib/planner';
import { ieltsFeasibility, kazFeasibility } from '../lib/feasibility';
import { addDays, today } from '../lib/dates';
import { useStudyTimer } from '../lib/hooks';
import { markBlockDone, regenerateTodayPlan } from '../lib/learning';

const BANK: Record<Lang, DiagItem[]> = { en: EN_DIAG, kk: KK_DIAG };
const LANG_NAME: Record<Lang, string> = { en: 'английского', kk: 'казахского' };

function ensureSession(lang: Lang): DiagnosticSession {
  const s = getState().diagSessions[lang];
  if (s) return s;
  const fresh: DiagnosticSession = { lang, startedAt: Date.now(), skills: {}, skipped: [] };
  update((d) => {
    d.diagSessions[lang] = fresh;
  });
  return fresh;
}

export function DiagnosticPage({ lang, part }: { lang: Lang; part?: string }) {
  const state = useAppState();
  useStudyTimer(lang);
  const session = state.diagSessions[lang];
  if (part === 'result') return <DiagnosticResultView lang={lang} />;
  if (part && session) {
    if ((OBJECTIVE_SKILLS as readonly string[]).includes(part)) return <SkillRun lang={lang} skill={part as ObjectiveSkill} />;
    if (part === 'writing') return <WritingPart lang={lang} />;
    if (part === 'speaking') return <SpeakingPart lang={lang} />;
  }

  const status = (k: Skill) => {
    if (session?.skipped.includes(k)) return 'skipped';
    if (k === 'writing') return session?.writing ? 'done' : 'todo';
    if (k === 'speaking') return session?.speaking ? 'done' : 'todo';
    const ss = session?.skills[k as ObjectiveSkill];
    if (!ss) return 'todo';
    return ss.done ? 'done' : 'progress';
  };
  const all: Skill[] = ['grammar', 'vocab', 'reading', 'listening', 'writing', 'speaking'];
  const doneCount = all.filter((k) => status(k) !== 'todo' && status(k) !== 'progress').length;
  const objectiveDone = OBJECTIVE_SKILLS.filter((k) => status(k) === 'done').length;

  return (
    <div className="space-y-4">
      <PageHeader title={`Диагностика ${LANG_NAME[lang]}`} back="/" subtitle="Адаптивный тест: сложность меняется по вашим ответам. Можно проходить частями." />
      {state.diagnostics[lang].length > 0 && (
        <Notice tone="info">
          Диагностика уже пройдена ({state.diagnostics[lang].length} раз). Повторное прохождение обновит текущий ориентировочный уровень; исходный уровень сохранится.{' '}
          <button className="underline" onClick={() => navigate(`/diagnostic/${lang}/result`)}>
            Открыть последний результат
          </button>
        </Notice>
      )}
      <Card>
        <div className="mb-2 flex justify-between text-sm text-ink-soft">
          <span>Выполнено частей: {doneCount} из 6</span>
          <span>≈ 25–35 минут всего</span>
        </div>
        <Progress value={(doneCount / 6) * 100} tone={lang === 'kk' ? 'kk' : 'brand'} />
        <ul className="mt-3 divide-y divide-line">
          {all.map((k) => {
            const st = status(k);
            return (
              <li key={k} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium">{SKILL_NAMES[k]}</div>
                  <div className="text-xs text-ink-soft">
                    {k === 'writing' ? 'Короткий текст; без AI проверяются объём и структура' : k === 'speaking' ? 'Запись ответа ≈ 1 минута; без AI — только беглость' : `${ITEMS_PER_SKILL} адаптивных заданий`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {st === 'done' && <Badge tone="good">готово</Badge>}
                  {st === 'skipped' && <Badge tone="warn">пропущено</Badge>}
                  {st === 'progress' && <Badge tone="brand">в процессе</Badge>}
                  {st !== 'done' && (
                    <Button
                      size="sm"
                      variant={st === 'skipped' ? 'secondary' : lang === 'kk' ? 'kk' : 'primary'}
                      onClick={() => {
                        ensureSession(lang);
                        if (st === 'skipped')
                          update((d) => {
                            d.diagSessions[lang]!.skipped = d.diagSessions[lang]!.skipped.filter((x) => x !== k);
                          });
                        navigate(`/diagnostic/${lang}/${k}`);
                      }}
                    >
                      {st === 'progress' ? 'Продолжить' : 'Начать'}
                    </Button>
                  )}
                  {st === 'todo' && (k === 'writing' || k === 'speaking') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        ensureSession(lang);
                        update((d) => {
                          d.diagSessions[lang]!.skipped.push(k);
                        });
                      }}
                    >
                      Пропустить
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <p className="text-sm text-ink-soft">
          Результат — <strong>ориентировочный учебный уровень</strong>, а не официально подтверждённый. Он нужен для составления плана. Непроверенные навыки будут явно отмечены.
        </p>
        <div className="mt-3 flex justify-end">
          <Button disabled={objectiveDone < 1} onClick={() => finishDiagnostic(lang)}>
            {objectiveDone < 4 ? `Завершить с тем, что есть (${objectiveDone}/4 тестовых частей)` : 'Завершить диагностику'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function finishDiagnostic(lang: Lang) {
  const s = getState();
  const ses = s.diagSessions[lang];
  if (!ses) return;
  const skills: DiagnosticResult['skills'] = {};
  const answers = [];
  for (const k of OBJECTIVE_SKILLS) {
    const ss = ses.skills[k];
    if (ss && ss.answers.length) {
      const est = estimateLevel(ss.answers);
      skills[k] = { level: est.level, correct: est.correct, total: est.total, confidence: est.confidence, tested: true };
      answers.push(...ss.answers);
    } else skills[k] = { level: null, correct: 0, total: 0, confidence: 'low', tested: false };
  }
  skills.writing = { level: null, correct: 0, total: 0, confidence: 'low', tested: false };
  skills.speaking = { level: null, correct: 0, total: 0, confidence: 'low', tested: false };
  const result: DiagnosticResult = {
    lang,
    completedAt: Date.now(),
    skills,
    overall: overallLevel(OBJECTIVE_SKILLS.map((k) => skills[k]?.level)),
    gaps: gapTopics(answers),
    writing: ses.writing,
    speaking: ses.speaking,
  };
  update((d) => {
    d.diagnostics[lang].push(result);
    d.diagSessions[lang] = null;
    // Пересчёт доли английского после диагностики (если разрешено)
    if (d.settings.autoSplit) {
      const en = lang === 'en' ? result.overall : d.diagnostics.en.at(-1)?.overall ?? null;
      const kk = lang === 'kk' ? result.overall : d.diagnostics.kk.at(-1)?.overall ?? null;
      d.settings.enShare = recommendEnShare(en, kk, d.settings.kazTargetLevel);
    }
  });
  markBlockDone('diagnostic', lang);
  // План на сегодня пересобирается с учётом диагностики (выполненные блоки сохраняются)
  regenerateTodayPlan();
  navigate(`/diagnostic/${lang}/result`);
}

function SkillRun({ lang, skill }: { lang: Lang; skill: ObjectiveSkill }) {
  const state = useAppState();
  const session = state.diagSessions[lang]!;
  const ss = session.skills[skill] ?? newSkillSession(skill);
  const item = pickNextItem(BANK[lang], ss);
  const [picked, setPicked] = useState<number | null>(null);
  const [played, setPlayed] = useState(false);
  const order = useMemo(() => (item ? (item.options.some((o) => /not given/i.test(o)) ? item.options.map((_, i) => i) : shuffle(item.options.map((_, i) => i))) : []), [item?.id]);

  if (!item || ss.done) {
    return (
      <div className="space-y-4">
        <PageHeader title={`${SKILL_NAMES[skill]}: готово`} back={`/diagnostic/${lang}`} />
        <Card>
          <p>Часть «{SKILL_NAMES[skill]}» завершена. Ответы сохранены — результат будет показан после завершения диагностики.</p>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => navigate(`/diagnostic/${lang}`)}>К списку частей</Button>
          </div>
        </Card>
      </div>
    );
  }

  const submit = () => {
    if (picked === null) return;
    const correct = picked === item.answer;
    update((d) => {
      const cur = d.diagSessions[lang]!.skills[skill] ?? newSkillSession(skill);
      d.diagSessions[lang]!.skills[skill] = answerItem(cur, item, correct);
    });
    setPicked(null);
    setPlayed(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={`Диагностика: ${SKILL_NAMES[skill]}`} back={`/diagnostic/${lang}`} subtitle={`Вопрос ${ss.answers.length + 1} из ${ITEMS_PER_SKILL}`} />
      <Progress value={(ss.answers.length / ITEMS_PER_SKILL) * 100} tone={lang === 'kk' ? 'kk' : 'brand'} />
      <Card>
        {item.passage && <div className="mb-4 rounded-xl bg-canvas p-3 whitespace-pre-line" lang={lang}>{item.passage}</div>}
        {item.say && (
          <div className="mb-3">
            <SpeakButton key={item.id} text={item.say} lang={lang} onPlayed={() => setPlayed(true)} />
            <p className="mt-1 text-xs text-ink-faint">Озвучка синтезатором устройства. Можно прослушать повторно.</p>
          </div>
        )}
        <p className="text-[17px] font-medium">{item.prompt}</p>
        <div className="mt-3 grid gap-2">
          {order.map((k) => (
            <button key={k} onClick={() => setPicked(k)} disabled={!!item.say && !played} className={cx('min-h-12 rounded-xl border px-4 py-2.5 text-left disabled:opacity-50', picked === k ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas')}>
              {item.options[k]}
            </button>
          ))}
        </div>
        {item.say && !played && <p className="mt-2 text-sm text-ink-soft">Сначала прослушайте фрагмент.</p>}
        <p className="mt-3 text-xs text-ink-faint">Правильные ответы не показываются во время диагностики, чтобы не влиять на следующие вопросы. Разбор — в результатах.</p>
        <div className="mt-4 flex justify-between gap-2">
          <Button variant="ghost" onClick={() => navigate(`/diagnostic/${lang}`)}>
            Прервать (прогресс сохранён)
          </Button>
          <Button onClick={submit} disabled={picked === null}>
            Ответить
          </Button>
        </div>
      </Card>
    </div>
  );
}

function WritingPart({ lang }: { lang: Lang }) {
  const prompt = DIAG_WRITING_PROMPTS[lang];
  const [text, setText] = useState(getState().diagSessions[lang]?.writing?.text ?? '');
  const n = wordCount(text);
  const save = () => {
    update((d) => {
      d.diagSessions[lang]!.writing = { text, words: n, prompt };
    });
    navigate(`/diagnostic/${lang}`);
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Диагностика: письмо" back={`/diagnostic/${lang}`} />
      <Card>
        <p className="font-medium" lang={lang}>
          {prompt}
        </p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} className="mt-3 w-full rounded-xl border border-line p-3 outline-none focus:border-brand" lang={lang} spellCheck={false} placeholder="Ваш текст…" />
        <div className="mt-1 text-sm text-ink-soft">Слов: {n}</div>
        <Notice tone="info">Без AI-проверки уровень письма не определяется — текст сохранится, а навык будет отмечен как «не проверено». Его можно проверить позже в разделе Writing / Жазылым.</Notice>
        <div className="mt-3 flex justify-end">
          <Button onClick={save} disabled={n < 10}>
            Сохранить
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SpeakingPart({ lang }: { lang: Lang }) {
  const prompt = DIAG_SPEAKING_PROMPTS[lang];
  return (
    <div className="space-y-4">
      <PageHeader title="Диагностика: говорение" back={`/diagnostic/${lang}`} />
      <Card>
        <p className="font-medium" lang={lang}>
          {prompt}
        </p>
        <SpeakRecorder
          lang={lang}
          context="diagnostic"
          prompt={prompt}
          targetSeconds={60}
          onSaved={(transcript, seconds) => {
            update((d) => {
              d.diagSessions[lang]!.speaking = { transcript, seconds, prompt };
            });
            navigate(`/diagnostic/${lang}`);
          }}
        />
      </Card>
    </div>
  );
}

export function DiagnosticResultView({ lang }: { lang: Lang }) {
  const s = useAppState();
  const r = s.diagnostics[lang].at(-1);
  if (!r) {
    return (
      <div>
        <PageHeader title="Результат диагностики" back="/" />
        <Notice tone="warn">Диагностика ещё не завершена.</Notice>
      </div>
    );
  }
  const order = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
  const tested = Object.entries(r.skills).filter(([, v]) => v?.tested && v.level);
  const max = tested.length ? Math.max(...tested.map(([, v]) => order.indexOf(v!.level!))) : -1;
  const min = tested.length ? Math.min(...tested.map(([, v]) => order.indexOf(v!.level!))) : -1;
  const strong = tested.filter(([, v]) => order.indexOf(v!.level!) === max && max > min).map(([k]) => SKILL_NAMES[k]);
  const weak = tested.filter(([, v]) => order.indexOf(v!.level!) === min && max > min).map(([k]) => SKILL_NAMES[k]);
  const untested = Object.entries(r.skills).filter(([, v]) => !v?.tested).map(([k]) => SKILL_NAMES[k]);
  const day = Math.max(1, courseDay(s.settings, today()));
  let studyDays = 0;
  for (let d = day; d <= s.settings.courseDays; d++) if (!isRestDay(s.settings, addDays(s.settings.startDate, d - 1))) studyDays++;
  const split = minutesSplit(s.settings);
  const feas = lang === 'en' ? ieltsFeasibility(r.overall, s.settings.ieltsMin, split.en, studyDays) : kazFeasibility(r.overall, s.settings.kazTargetLevel, split.kk, studyDays);
  const feas55 = lang === 'en' ? ieltsFeasibility(r.overall, s.settings.ieltsTarget, split.en, studyDays) : null;
  const tone = feas.verdict === 'realistic' ? 'good' : feas.verdict === 'possible' ? 'warn' : feas.verdict === 'unlikely' ? 'bad' : 'info';

  return (
    <div className="space-y-4">
      <PageHeader title={`Результат: ${lang === 'en' ? 'английский' : 'казахский'}`} back="/" subtitle={new Date(r.completedAt).toLocaleDateString('ru-RU')} />
      <Card tone={lang === 'kk' ? 'kk' : 'en'}>
        <div className="text-sm text-ink-soft">Предполагаемый (ориентировочный) уровень</div>
        <div className="text-3xl font-semibold">{r.overall ?? '—'}</div>
        <p className="mt-1 text-sm text-ink-soft">Это учебная оценка по короткому тесту, а не официально подтверждённый уровень.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(r.skills).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-surface px-3 py-2">
              <div className="text-xs text-ink-soft">{SKILL_NAMES[k]}</div>
              {v?.tested ? (
                <>
                  <div className="font-semibold">{v.level ?? '—'}</div>
                  <div className="text-xs text-ink-faint">
                    {v.correct}/{v.total} верно{v.confidence === 'low' ? ' · мало данных' : ''}
                  </div>
                </>
              ) : (
                <div className="font-medium text-warn">не проверено</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {untested.length > 0 && (
        <Notice tone="warn" title="Не проверены автоматически">
          {untested.join(', ')}. {r.writing || r.speaking ? 'Образцы сохранены; ' : ''}Для оценки письма и говорения нужен AI-преподаватель или проверка преподавателем. Прогноз общего результата по этим навыкам не выдаётся.
        </Notice>
      )}

      <Card>
        <h2 className="font-semibold">Сильные и слабые стороны</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <div className="text-ink-soft">Сильные навыки</div>
            <div className="font-medium">{strong.length ? strong.join(', ') : 'уровни навыков примерно одинаковы'}</div>
          </div>
          <div>
            <div className="text-ink-soft">Слабые навыки</div>
            <div className="font-medium">{weak.length ? weak.join(', ') : '—'}</div>
          </div>
        </div>
        <div className="mt-3 text-sm">
          <div className="text-ink-soft">Пробелы (темы с ошибками)</div>
          {r.gaps.length ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {r.gaps.map((g) => (
                <Badge key={g} tone="warn">
                  {topicName(g)}
                </Badge>
              ))}
            </div>
          ) : (
            <div>Явных пробелов в проверенных темах не выявлено.</div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Приоритеты обучения</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {weak.length > 0 && <li>Навыки с самым низким уровнем: {weak.join(', ')} — больше блоков в ежедневном плане.</li>}
          {r.gaps.slice(0, 3).map((g) => (
            <li key={g}>Тема «{topicName(g)}» — назначена в повторение.</li>
          ))}
          <li>{lang === 'en' ? 'Ежедневно: грамматика по программе, аудирование, словарь; с этапа 2 — форматы IELTS.' : 'Ежедневно: грамматика (окончания и падежи), словарь, аудирование; с этапа 3 — форматы КАЗТЕСТ.'}</li>
        </ol>
        <div className="mt-3 text-sm">
          Рекомендуемая нагрузка: <strong>{s.settings.dailyMinutes} мин в день</strong> (английский {split.en} мин, казахский {split.kk} мин)
          {s.settings.autoSplit && ' — распределение пересчитано по результатам диагностики.'}
        </div>
      </Card>

      <Card tone={tone === 'info' ? undefined : tone}>
        <h2 className="font-semibold">Реалистичность цели</h2>
        <p className="mt-1 text-sm">{feas.explanation}</p>
        {feas55 && feas55.verdict !== feas.verdict && <p className="mt-1 text-sm">Для желательного результата {s.settings.ieltsTarget.toFixed(1)}: {feas55.explanation}</p>}
        <p className="mt-2 text-xs text-ink-soft">Оценка основана на опубликованных ориентирах учебных часов CEFR (Cambridge English) и не является гарантией результата.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" href="/settings">
            Изменить нагрузку или срок
          </Button>
          <Button size="sm" href="/today">
            Мой индивидуальный план
          </Button>
        </div>
      </Card>
      {lang === 'kk' && !s.settings.kazTargetLevel && <Notice tone="warn">Выберите целевой уровень КАЗТЕСТ в Настройках (по требованию приёмной комиссии).</Notice>}
      <div className="flex justify-end">
        <Button variant="secondary" href={`/diagnostic/${lang === 'en' ? 'kk' : 'en'}`}>
          Диагностика {lang === 'en' ? 'казахского' : 'английского'}
        </Button>
      </div>
    </div>
  );
}
