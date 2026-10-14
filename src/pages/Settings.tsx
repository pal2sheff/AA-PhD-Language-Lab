import { useEffect, useRef, useState } from 'react';
import { useAppState, update, getSaveStatus, flush } from '../lib/store';
import type { CourseDays, DailyMinutes } from '../lib/state';
import { LEVELS, type Level } from '../data/types';
import { WEEKDAY_NAMES, addDays, formatDate, today } from '../lib/dates';
import { courseDay, minutesSplit } from '../lib/planner';
import { regenerateTodayPlan } from '../lib/learning';
import { downloadBackup, importJson, pullFromCloud, pushToCloud, resetAll, syncConfigured, syncStatus } from '../lib/backup';
import { requestPersistence } from '../lib/storage';
import { aiHealth } from '../lib/ai';
import { loadVoices, voicesFor, ttsSupported, recognitionSupported, recordingSupported } from '../lib/speech';
import { KAZTEST_STRUCTURE, type KaztestBlock } from '../lib/scoring';
import { Button, Card, Field, Notice, PageHeader, Segmented, cx, inputCls } from '../components/ui';
import { navigate } from '../lib/router';

export function SettingsPage() {
  const s = useAppState();
  const st = s.settings;
  const set = (fn: (d: typeof st) => void) => update((x) => fn(x.settings));
  const day = courseDay(st, today());
  const split = minutesSplit(st);

  return (
    <div className="space-y-4">
      <PageHeader title="Настройки" />

      <Card>
        <h2 className="font-semibold">Программа подготовки</h2>
        <p className="text-sm text-ink-soft">При смене срока календарь, распределение тем, контрольные точки и даты пробных экзаменов пересчитываются автоматически. История обучения сохраняется полностью.</p>
        <div className="mt-3">
          <Segmented<CourseDays>
            value={st.courseDays}
            onChange={(v) => {
              update((x) => {
                x.settings.courseDays = v;
              });
              regenerateTodayPlan();
            }
            }
            options={[
              { value: 90, label: 'Интенсив · 3 мес.' },
              { value: 180, label: 'Стандарт · 6 мес.' },
              { value: 270, label: 'Комфорт · 9 мес.' },
            ]}
          />
        </div>
        <p className="mt-2 text-sm">
          Сегодня день {day} из {st.courseDays}. Окончание: {formatDate(addDays(st.startDate, st.courseDays - 1))}.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Дата начала программы">
            <input type="date" className={inputCls} value={st.startDate} onChange={(e) => e.target.value && set((d) => void (d.startDate = e.target.value))} />
          </Field>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">Ежедневная нагрузка</div>
          <Segmented<DailyMinutes>
            value={st.dailyMinutes}
            onChange={(v) => {
              update((x) => {
                x.settings.dailyMinutes = v;
              });
              regenerateTodayPlan();
            }
            }
            options={[30, 45, 60, 90, 120].map((m) => ({ value: m as DailyMinutes, label: `${m} мин${m === 90 ? ' ★' : ''}` }))}
          />
        </div>
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">
            Распределение: английский {split.en} мин · казахский {split.kk} мин
          </div>
          <input
            type="range"
            min={50}
            max={85}
            step={5}
            value={Math.round(st.enShare * 100)}
            onChange={(e) => {
              update((x) => {
                x.settings.enShare = Number(e.target.value) / 100;
                x.settings.autoSplit = false;
              });
              regenerateTodayPlan();
            }
            }
            className="w-full"
            aria-label="Доля английского"
          />
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={st.autoSplit} onChange={(e) => set((d) => void (d.autoSplit = e.target.checked))} />
            Пересчитывать распределение автоматически после диагностики (оба языка всегда остаются в плане)
          </label>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">Выходные дни (без обязательного плана)</div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
              <button
                key={wd}
                onClick={() =>
                  update((x) => {
                    const r = x.settings.restWeekdays;
                    x.settings.restWeekdays = r.includes(wd) ? r.filter((y) => y !== wd) : [...r, wd];
                  })
                }
                className={cx('h-10 w-11 rounded-lg border text-sm', st.restWeekdays.includes(wd) ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line')}
              >
                {WEEKDAY_NAMES[wd]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Цели</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="IELTS: минимальный результат">
            <select className={inputCls} value={st.ieltsMin} onChange={(e) => set((d) => void (d.ieltsMin = Number(e.target.value)))}>
              {[4.5, 5, 5.5, 6, 6.5].map((b) => (
                <option key={b} value={b}>
                  {b.toFixed(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="IELTS: желательный результат">
            <select className={inputCls} value={st.ieltsTarget} onChange={(e) => set((d) => void (d.ieltsTarget = Number(e.target.value)))}>
              {[5, 5.5, 6, 6.5, 7].map((b) => (
                <option key={b} value={b}>
                  {b.toFixed(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="КАЗТЕСТ: целевой уровень" hint="Выбирается вами после диагностики и уточнения требований приёмной комиссии.">
            <select className={inputCls} value={st.kazTargetLevel ?? ''} onChange={(e) => set((d) => void (d.kazTargetLevel = (e.target.value || null) as Level | null))}>
              <option value="">не выбран</option>
              {LEVELS.filter((l) => l !== 'A0').map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Официальное требование университета (как указано в документах)">
            <input className={inputCls} value={st.kazRequired} placeholder="например: КАЗТЕСТ не ниже … (приказ / правила приёма)" onChange={(e) => set((d) => void (d.kazRequired = e.target.value))} />
          </Field>
        </div>
        <KazThresholds />
      </Card>

      <VoiceSettings />
      <AiSettings />
      <SyncSettings />
      <DataSettings />

      <Card>
        <h2 className="font-semibold">Диагностика</h2>
        <p className="text-sm text-ink-soft">Повторная диагностика обновит текущий ориентировочный уровень; исходный результат сохранится в истории.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/diagnostic/en')}>
            Диагностика английского
          </Button>
          <Button variant="secondary" onClick={() => navigate('/diagnostic/kk')}>
            Диагностика казахского
          </Button>
          <Button variant="ghost" onClick={() => navigate('/onboarding')}>
            Мастер первого запуска
          </Button>
        </div>
      </Card>
    </div>
  );
}

function KazThresholds() {
  const s = useAppState();
  const t = s.settings.kazThresholds;
  const blocks = Object.keys(KAZTEST_STRUCTURE) as KaztestBlock[];
  return (
    <div className="mt-4 rounded-xl border border-line p-3">
      <div className="text-sm font-medium">Пороговые значения КАЗТЕСТ (официальные)</div>
      <p className="text-xs text-ink-soft">
        Приложение не содержит собственных порогов. Введите значения из актуальных документов Национального центра тестирования (testcenter.kz) — тогда в пробном экзамене будет показано выполнение порогов. Без них
        результат отображается в процентах как предварительная учебная оценка.
      </p>
      {!t ? (
        <Button size="sm" variant="secondary" className="mt-2" onClick={() => update((x) => void (x.settings.kazThresholds = { source: '', level: x.settings.kazTargetLevel ?? '', perBlock: {}, unit: 'percent' }))}>
          Ввести пороги
        </Button>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Источник (документ, ссылка)">
              <input className={inputCls} value={t.source} onChange={(e) => update((x) => void (x.settings.kazThresholds!.source = e.target.value))} />
            </Field>
            <Field label="Уровень">
              <input className={inputCls} value={t.level} onChange={(e) => update((x) => void (x.settings.kazThresholds!.level = e.target.value))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {blocks.map((b) => (
              <Field key={b} label={`${KAZTEST_STRUCTURE[b].kz}, %`}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls}
                  value={t.perBlock[b] ?? ''}
                  onChange={(e) => update((x) => void (x.settings.kazThresholds!.perBlock[b] = e.target.value === '' ? undefined : Number(e.target.value)))}
                />
              </Field>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => update((x) => void (x.settings.kazThresholds = null))}>
            Удалить пороги
          </Button>
        </div>
      )}
    </div>
  );
}

function VoiceSettings() {
  const s = useAppState();
  const [, setN] = useState(0);
  useEffect(() => {
    loadVoices().then((v) => setN(v.length));
  }, []);
  const en = voicesFor('en');
  const kk = voicesFor('kk');
  const tts = s.settings.tts;
  return (
    <Card>
      <h2 className="font-semibold">Озвучка и речь</h2>
      <ul className="mt-1 text-sm text-ink-soft">
        <li>Синтез речи: {ttsSupported() ? 'поддерживается' : 'не поддерживается'}</li>
        <li>Распознавание речи: {recognitionSupported() ? 'поддерживается (сервис браузера)' : 'не поддерживается — доступен текстовый режим'}</li>
        <li>Запись голоса: {recordingSupported() ? 'поддерживается' : 'не поддерживается'}</li>
      </ul>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={`Скорость речи: ${tts.rate.toFixed(2)}`}>
          <input type="range" min={0.5} max={1.2} step={0.05} value={tts.rate} onChange={(e) => update((x) => void (x.settings.tts.rate = Number(e.target.value)))} className="w-full" />
        </Field>
        <Field label="Английский голос">
          <select className={inputCls} value={tts.enVoice} onChange={(e) => update((x) => void (x.settings.tts.enVoice = e.target.value))}>
            <option value="">автоматически (en-GB, если есть)</option>
            {en.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Казахский голос" hint={kk.length ? undefined : 'На этом устройстве казахского голоса нет.'}>
          <select className={inputCls} value={tts.kkVoice} onChange={(e) => update((x) => void (x.settings.tts.kkVoice = e.target.value))}>
            <option value="">автоматически</option>
            {kk.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Если казахского голоса нет" hint="Запасной голос читает казахский текст неточно — это явно помечается в упражнениях.">
          <select className={inputCls} value={tts.kkFallback} onChange={(e) => update((x) => void (x.settings.tts.kkFallback = e.target.value as 'none' | 'tr' | 'ru'))}>
            <option value="none">не озвучивать, показывать текст</option>
            <option value="tr">турецкий голос (неточно)</option>
            <option value="ru">русский голос (неточно)</option>
          </select>
        </Field>
      </div>
    </Card>
  );
}

function AiSettings() {
  const s = useAppState();
  const ai = s.settings.ai;
  const [status, setStatus] = useState<string>('');
  return (
    <Card>
      <h2 className="font-semibold">AI-преподаватель (Claude API)</h2>
      <p className="text-sm text-ink-soft">
        Расширенная проверка письма, анализ речи, диалоги и генерация упражнений работают через ваш сервер (папка <code>server/</code>), где хранится ключ Anthropic API. Ключ не хранится в браузере.
        <strong> Это платный внешний сервис</strong> — оплата по тарифам Anthropic. Без него все базовые функции работают с заранее подготовленными объяснениями.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Адрес сервера" hint="Например https://my-lab.example.com или http://localhost:8787">
          <input className={inputCls} value={ai.endpoint} onChange={(e) => update((x) => void (x.settings.ai.endpoint = e.target.value.trim()))} placeholder="https://…" />
        </Field>
        <Field label="Токен доступа к серверу" hint="Значение APP_ACCESS_TOKEN на сервере (контроль доступа).">
          <input type="password" className={inputCls} value={ai.token} onChange={(e) => update((x) => void (x.settings.ai.token = e.target.value.trim()))} autoComplete="off" />
        </Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ai.enabled} onChange={(e) => update((x) => void (x.settings.ai.enabled = e.target.checked))} /> Включить платные AI-функции
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            setStatus('Проверяю…');
            const r = await aiHealth();
            setStatus(r.message);
          }}
          disabled={!ai.endpoint}
        >
          Проверить подключение
        </Button>
        {status && <span className="text-sm">{status}</span>}
      </div>
      <p className="mt-2 text-xs text-ink-soft">Аудиозаписи на AI-сервер не отправляются: для анализа устной речи передаётся только текстовая транскрипция и только по вашей команде.</p>
    </Card>
  );
}

function SyncSettings() {
  const s = useAppState();
  const sy = s.settings.sync;
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
      setMsg(ok);
    } catch (e) {
      setMsg('Ошибка: ' + (e as Error).message);
    }
    setBusy(false);
  };
  return (
    <Card>
      <h2 className="font-semibold">Облачная синхронизация (компьютер ↔ iPhone)</h2>
      <p className="text-sm text-ink-soft">
        Без настройки данные хранятся <strong>только на этом устройстве</strong> (локально, это не синхронизация). Для работы с нескольких устройств разверните сервер из папки <code>server/</code> и укажите его адрес и
        личный токен синхронизации на каждом устройстве.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Адрес сервера синхронизации">
          <input className={inputCls} value={sy.endpoint} onChange={(e) => update((x) => void (x.settings.sync.endpoint = e.target.value.trim()))} placeholder="https://…" />
        </Field>
        <Field label="Токен синхронизации" hint="Одинаковый на всех ваших устройствах; не передавайте его другим.">
          <input type="password" className={inputCls} value={sy.token} onChange={(e) => update((x) => void (x.settings.sync.token = e.target.value.trim()))} autoComplete="off" />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!syncConfigured() || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const st = await syncStatus();
              setMsg(st.remoteUpdatedAt ? `В облаке: ${new Date(st.remoteUpdatedAt).toLocaleString('ru-RU')}; на устройстве: ${new Date(st.localUpdatedAt).toLocaleString('ru-RU')}` : 'В облаке ещё нет копии.');
            } catch (e) {
              setMsg('Ошибка: ' + (e as Error).message);
            }
            setBusy(false);
          }}
        >
          Сравнить
        </Button>
        <Button size="sm" disabled={!syncConfigured() || busy} onClick={() => run(pushToCloud, 'Данные этого устройства сохранены в облаке.')}>
          Отправить в облако
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!syncConfigured() || busy}
          onClick={() => {
            if (confirm('Заменить данные на этом устройстве копией из облака? Рекомендуется сначала сделать экспорт JSON.')) void run(pullFromCloud, 'Данные загружены из облака.');
          }}
        >
          Загрузить из облака
        </Button>
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
      {sy.lastSync && <p className="mt-1 text-xs text-ink-soft">Последняя синхронизация: {new Date(sy.lastSync).toLocaleString('ru-RU')}</p>}
    </Card>
  );
}

function DataSettings() {
  const s = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [persist, setPersist] = useState<boolean | null>(null);
  const save = getSaveStatus();
  return (
    <Card>
      <h2 className="font-semibold">Данные и резервные копии</h2>
      <ul className="mt-1 text-sm text-ink-soft">
        <li>Хранение: IndexedDB браузера + резервная копия в localStorage{save ? ` · последнее сохранение ${new Date(save.at).toLocaleTimeString('ru-RU')} (${save.idb ? 'IndexedDB' : ''}${save.idb && save.ls ? ' + ' : ''}${save.ls ? 'localStorage' : ''})` : ''}</li>
        <li>Последний экспорт: {s.lastBackupAt ? new Date(s.lastBackupAt).toLocaleString('ru-RU') : 'не выполнялся'}</li>
      </ul>
      <Notice tone="warn">
        На iPhone Safari может удалить данные сайта, если им долго не пользоваться. Установите приложение на экран «Домой» (Поделиться → На экран «Домой») и регулярно делайте экспорт JSON.
      </Notice>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" icon="download" onClick={() => downloadBackup()}>
          Экспорт JSON
        </Button>
        <Button size="sm" variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>
          Импорт JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              if (!confirm('Заменить все текущие данные содержимым файла?')) return;
              importJson(await f.text());
              await flush();
              setMsg('Данные импортированы.');
            } catch (err) {
              setMsg('Не удалось импортировать: ' + (err as Error).message);
            } finally {
              e.target.value = '';
            }
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            const r = await requestPersistence();
            setPersist(r);
          }}
        >
          Запросить постоянное хранение
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon="trash"
          onClick={async () => {
            if (!confirm('Удалить ВСЕ данные обучения на этом устройстве? Действие необратимо. Сначала сделайте экспорт JSON.')) return;
            if (!confirm('Точно удалить?')) return;
            await resetAll();
            window.location.hash = '#/';
            window.location.reload();
          }}
        >
          Удалить все данные
        </Button>
      </div>
      {persist !== null && <p className="mt-2 text-sm">{persist ? 'Браузер разрешил постоянное хранение.' : 'Браузер не подтвердил постоянное хранение — делайте экспорт регулярно.'}</p>}
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
