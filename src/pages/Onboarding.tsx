import { useState } from 'react';
import { useAppState, update } from '../lib/store';
import type { CourseDays, DailyMinutes } from '../lib/state';
import { today } from '../lib/dates';
import { navigate } from '../lib/router';
import { Button, Card, Field, Segmented, inputCls } from '../components/ui';
import { requestPersistence } from '../lib/storage';
import { regenerateTodayPlan } from '../lib/learning';

export function Onboarding() {
  const s = useAppState();
  const [days, setDays] = useState<CourseDays>(s.settings.courseDays);
  const [mins, setMins] = useState<DailyMinutes>(s.settings.dailyMinutes);
  const [start, setStart] = useState(s.onboarded ? s.settings.startDate : today());

  const finish = (to: string) => {
    update((d) => {
      d.settings.courseDays = days;
      d.settings.dailyMinutes = mins;
      d.settings.startDate = start;
      d.onboarded = true;
    });
    regenerateTodayPlan();
    void requestPersistence();
    navigate(to);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 pt-2">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">AA PhD Language Lab</h1>
        <p className="text-ink-soft">90 дней до IELTS и КАЗТЕСТ</p>
      </header>
      <Card>
        <p>
          Персональная платформа для интенсивной подготовки к <strong>IELTS Academic</strong> (цель 5.0–5.5) и <strong>КАЗТЕСТ</strong>. Каждый урок: объяснение на русском, примеры, разбор типичных ошибок,
          упражнения с проверкой и контроль усвоения. Ошибки сохраняются, и план подстраивается под них.
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">1. Продолжительность программы</h2>
        <div className="mt-2">
          <Segmented<CourseDays>
            value={days}
            onChange={setDays}
            options={[
              { value: 90, label: 'Интенсив · 90 дней' },
              { value: 180, label: 'Стандарт · 6 мес.' },
              { value: 270, label: 'Комфорт · 9 мес.' },
            ]}
          />
        </div>
        <p className="mt-2 text-sm text-ink-soft">Срок можно изменить позже в Настройках — история обучения сохранится. Реалистичность цели будет оценена после диагностики.</p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">2. Сколько времени в день вы готовы заниматься?</h2>
        <div className="mt-2">
          <Segmented<DailyMinutes> value={mins} onChange={setMins} options={[30, 45, 60, 90, 120].map((m) => ({ value: m as DailyMinutes, label: `${m} мин${m === 90 ? ' (рекомендуется)' : ''}` }))} />
        </div>
        <p className="mt-2 text-sm text-ink-soft">По умолчанию 2/3 времени — английский, 1/3 — казахский. После диагностики распределение уточнится. Заниматься можно блоками по 5–15 минут в течение дня.</p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">3. Дата начала</h2>
        <Field label="День 1 программы">
          <input type="date" className={inputCls} value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
        </Field>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">4. Диагностика</h2>
        <p className="text-sm text-ink-soft">
          Адаптивные тесты по грамматике, лексике, чтению и аудированию, плюс образцы письма и речи. Около 25–35 минут на язык, можно проходить частями. Результат — ориентировочный учебный уровень, не официальный сертификат.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => finish('/diagnostic/en')}>Начать с диагностики английского</Button>
          <Button variant="kk" onClick={() => finish('/diagnostic/kk')}>
            Начать с казахского
          </Button>
          <Button variant="ghost" onClick={() => finish('/')}>
            Позже
          </Button>
        </div>
      </Card>
    </div>
  );
}
