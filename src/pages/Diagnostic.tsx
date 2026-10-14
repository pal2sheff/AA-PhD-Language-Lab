import { useMemo, useState } from 'react';
import type { DiagItem, Lang, Skill } from '../data/types';
import { DIAG_SPEAKING_PROMPTS, DIAG_WRITING_PROMPTS, EN_DIAG, KK_DIAG } from '../data/diagnostic';
import { answerItem, estimateLevel, gapTopics, ITEMS_PER_SKILL, newSkillSession, OBJECTIVE_SKILLS, overallLevel, pickNextItem, type ObjectiveSkill } from '../lib/diagnostic';
import { useAppState, update, getState } from '../lib/store';
import type { DiagnosticResult, DiagnosticSession } from '../lib/state';
import { navigate } from '../lib/router';
import { ActionBar, Badge, Button, Card, CEFR, Eyebrow, LangTag, LevelScale, Notice, OptionButton, PageHeader, Progress, cx } from '../components/ui';
import { Icon } from '../components/icons';
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

  const tone = lang === 'kk' ? 'kk' : 'primary';
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow={<LangTag lang={lang} long />}
        title={`Диагностика ${LANG_NAME[lang]}`}
        back="/"
        subtitle="Адаптивный тест: сложность меняется по вашим ответам. Можно проходить частями — прогресс сохраняется."
      />
      {state.diagnostics[lang].length > 0 && (
        <Notice tone="info">
          Диагностика уже пройдена ({state.diagnostics[lang].length} раз). Повторное прохождение обновит текущий ориентировочный уровень; исходный уровень сохранится.{' '}
          <button className="font-medium underline underline-offset-2" onClick={() => navigate(`/diagnostic/${lang}/result`)}>
            Открыть последний результат
          </button>
        </Notice>
      )}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold tabular-nums">Выполнено частей: {doneCount} из 6</span>
          <span className="text-sm text-ink-soft">≈ 25–35 минут всего</span>
        </div>
        <Progress value={(doneCount / 6) * 100} tone={lang === 'kk' ? 'kk' : 'brand'} className="mt-3" label="Выполнено частей" />
        <ul className="mt-4 divide-y divide-line">
          {all.map((k, idx) => {
            const st = status(k);
            return (
              <li key={k} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                <span
                  className={cx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    st === 'done' ? 'bg-good text-white' : st === 'skipped' ? 'bg-warn-soft text-warn' : lang === 'kk' ? 'bg-kk-soft text-kk' : 'bg-brand-soft text-brand',
                  )}
                  aria-hidden="true"
                >
                  {st === 'done' ? <Icon name="check" size={18} strokeWidth={2.5} /> : idx + 1}
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{SKILL_NAMES[k]}</span>
                    {st === 'done' && <Badge tone="good">готово</Badge>}
                    {st === 'skipped' && <Badge tone="warn">пропущено</Badge>}
                    {st === 'progress' && <Badge tone={lang === 'kk' ? 'kk' : 'brand'}>в процессе</Badge>}
                  </div>
                  <div className="mt-0.5 text-sm text-ink-soft">
                    {k === 'writing' ? 'Короткий текст; без AI проверяются объём и структура' : k === 'speaking' ? 'Запись ответа ≈ 1 минута; без AI — только беглость' : `${ITEMS_PER_SKILL} адаптивных заданий`}
                  </div>
                </div>
                <div className="ml-14 flex items-center gap-2 sm:ml-0">
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
                  {st !== 'done' && (
                    <Button
                      size="sm"
                      variant={st === 'skipped' ? 'secondary' : tone}
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
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <p className="text-ink-soft">
          Результат — <strong className="text-ink">ориентировочный учебный уровень</strong>, а не официально подтверждённый. Он нужен для составления плана. Непроверенные навыки будут явно отмечены.
        </p>
        <div className="mt-4 flex justify-end">
          <Button size="lg" variant={tone} disabled={objectiveDone < 1} onClick={() => finishDiagnostic(lang)} className="w-full sm:w-auto">
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
      <div className="mx-auto max-w-2xl space-y-5">
        <PageHeader eyebrow={<LangTag lang={lang} long />} title={`${SKILL_NAMES[skill]}: готово`} back={`/diagnostic/${lang}`} />
        <Card tone="good">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-good text-white">
              <Icon name="check" size={20} strokeWidth={2.5} />
            </span>
            <p className="pt-1.5">Часть «{SKILL_NAMES[skill]}» завершена. Ответы сохранены — результат будет показан после завершения диагностики.</p>
          </div>
        </Card>
        <ActionBar>
          <Button size="lg" variant={lang === 'kk' ? 'kk' : 'primary'} onClick={() => navigate(`/diagnostic/${lang}`)}>
            К списку частей
          </Button>
        </ActionBar>
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

  const n = ss.answers.length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate(`/diagnostic/${lang}`)} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-ink-soft hover:bg-surface hover:text-ink">
          <Icon name="x" size={18} />
          Прервать
        </button>
        <span className="text-sm text-ink-soft">прогресс сохраняется</span>
      </div>
      <div className="mt-3">
        <Eyebrow tone={lang === 'kk' ? 'kk' : 'en'}>Диагностика {LANG_NAME[lang]}</Eyebrow>
        <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight sm:text-[30px]">{SKILL_NAMES[skill]}</h1>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          Задание {n + 1} из {ITEMS_PER_SKILL}
        </span>
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: ITEMS_PER_SKILL }, (_, k) => (
            <span key={k} className={cx('h-1.5 flex-1 rounded-full', k < n ? (lang === 'kk' ? 'bg-kk/45' : 'bg-brand/45') : k === n ? (lang === 'kk' ? 'bg-kk' : 'bg-brand') : 'bg-line')} />
          ))}
        </div>
      </div>
      <Card className="mt-5">
        {item.passage && (
          <div className="mb-5 rounded-2xl bg-subtle p-4 text-[17px] leading-relaxed whitespace-pre-line" lang={lang}>
            {item.passage}
          </div>
        )}
        {item.say && (
          <div className="mb-5">
            <SpeakButton key={item.id} text={item.say} lang={lang} onPlayed={() => setPlayed(true)} />
            <p className="mt-1.5 text-sm text-ink-soft">Озвучка синтезатором устройства. Можно прослушать повторно.</p>
          </div>
        )}
        <p className="text-xl leading-snug font-medium sm:text-[22px]">{item.prompt}</p>
        <div className="mt-6 grid gap-2.5">
          {order.map((k, pos) => (
            <OptionButton key={k} letter={String.fromCharCode(65 + pos)} selected={picked === k} onClick={() => setPicked(k)} disabled={!!item.say && !played} lang={lang}>
              {item.options[k]}
            </OptionButton>
          ))}
        </div>
        {item.say && !played && <p className="mt-3 text-sm text-ink-soft">Сначала прослушайте фрагмент.</p>}
      </Card>
      <p className="mt-4 text-sm text-ink-soft">Правильные ответы не показываются во время диагностики, чтобы не влиять на следующие вопросы. Разбор — в результатах.</p>
      <ActionBar>
        <Button size="lg" variant={lang === 'kk' ? 'kk' : 'primary'} onClick={submit} disabled={picked === null}>
          Ответить
        </Button>
      </ActionBar>
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
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader eyebrow={<LangTag lang={lang} long />} title="Диагностика: письмо" back={`/diagnostic/${lang}`} />
      <Card>
        <p className="text-[17px] font-medium" lang={lang}>
          {prompt}
        </p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} className="mt-4 w-full rounded-xl border border-line-strong p-3.5 leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" lang={lang} spellCheck={false} placeholder="Ваш текст…" />
        <div className="mt-1.5 mb-4 text-sm text-ink-soft tabular-nums">Слов: {n}</div>
        <Notice tone="info">Без AI-проверки уровень письма не определяется — текст сохранится, а навык будет отмечен как «не проверено». Его можно проверить позже в разделе Writing / Жазылым.</Notice>
        <div className="mt-4 flex justify-end">
          <Button size="lg" onClick={save} disabled={n < 10}>
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
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader eyebrow={<LangTag lang={lang} long />} title="Диагностика: говорение" back={`/diagnostic/${lang}`} />
      <Card>
        <p className="mb-4 text-[17px] font-medium" lang={lang}>
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={<LangTag lang={lang} long />} title="Результат диагностики" back="/" subtitle={new Date(r.completedAt).toLocaleDateString('ru-RU')} />
      <Card tone={lang === 'kk' ? 'kk' : 'en'}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-ink-soft">Предполагаемый (ориентировочный) уровень</div>
            <div className="mt-1 text-5xl leading-none font-semibold tracking-tight">{r.overall ?? '—'}</div>
          </div>
          <Badge tone="warm">учебная оценка</Badge>
        </div>
        <p className="mt-3 text-sm text-ink-soft">Это учебная оценка по короткому тесту, а не официально подтверждённый уровень.</p>
        <div className="mt-6 space-y-4">
          <div className="hidden grid-cols-[minmax(0,10rem)_1fr_4.5rem] gap-4 text-xs text-ink-soft sm:grid">
            <span />
            <span className="flex justify-between">
              {CEFR.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </span>
            <span />
          </div>
          {Object.entries(r.skills).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,10rem)_1fr_4.5rem]">
              <div className="min-w-0">
                <div className="font-medium">{SKILL_NAMES[k]}</div>
                {v?.tested && (
                  <div className="text-sm text-ink-soft">
                    {v.correct}/{v.total} верно{v.confidence === 'low' ? ' · мало данных' : ''}
                  </div>
                )}
              </div>
              <div className="order-last col-span-2 sm:order-none sm:col-span-1">
                <LevelScale level={v?.tested ? (v.level ?? null) : null} tone={lang === 'kk' ? 'kk' : 'brand'} />
              </div>
              <div className={cx('text-right font-semibold', !v?.tested && 'text-sm font-medium text-warn')}>{v?.tested ? (v.level ?? '—') : 'не проверено'}</div>
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
        <h2 className="text-xl font-semibold">Сильные и слабые стороны</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-ink-soft">Сильные навыки</div>
            <div className="font-medium">{strong.length ? strong.join(', ') : 'уровни навыков примерно одинаковы'}</div>
          </div>
          <div>
            <div className="text-ink-soft">Слабые навыки</div>
            <div className="font-medium">{weak.length ? weak.join(', ') : '—'}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-ink-soft">Пробелы (темы с ошибками)</div>
          {r.gaps.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
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
        <h2 className="text-xl font-semibold">Приоритеты обучения</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          {weak.length > 0 && <li>Навыки с самым низким уровнем: {weak.join(', ')} — больше блоков в ежедневном плане.</li>}
          {r.gaps.slice(0, 3).map((g) => (
            <li key={g}>Тема «{topicName(g)}» — назначена в повторение.</li>
          ))}
          <li>{lang === 'en' ? 'Ежедневно: грамматика по программе, аудирование, словарь; с этапа 2 — форматы IELTS.' : 'Ежедневно: грамматика (окончания и падежи), словарь, аудирование; с этапа 3 — форматы КАЗТЕСТ.'}</li>
        </ol>
        <div className="mt-4 border-t border-line pt-4">
          Рекомендуемая нагрузка: <strong>{s.settings.dailyMinutes} мин в день</strong> (английский {split.en} мин, казахский {split.kk} мин)
          {s.settings.autoSplit && ' — распределение пересчитано по результатам диагностики.'}
        </div>
      </Card>

      <Card tone={tone === 'info' ? undefined : tone}>
        <h2 className="text-xl font-semibold">Реалистичность цели</h2>
        <p className="mt-2">{feas.explanation}</p>
        {feas55 && feas55.verdict !== feas.verdict && <p className="mt-2">Для желательного результата {s.settings.ieltsTarget.toFixed(1)}: {feas55.explanation}</p>}
        <p className="mt-3 text-sm text-ink-soft">Оценка основана на опубликованных ориентирах учебных часов CEFR (Cambridge English) и не является гарантией результата.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" href="/settings">
            Изменить нагрузку или срок
          </Button>
          <Button href="/today">
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
