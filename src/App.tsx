import { useEffect } from 'react';
import { useRoute, navigate } from './lib/router';
import { useAppState, getLoadError } from './lib/store';
import { Layout } from './components/Layout';
import { Notice, PageHeader } from './components/ui';
import { Home } from './pages/Home';
import { TodayPage } from './pages/Today';
import { LessonPage } from './pages/Lesson';
import { DiagnosticPage } from './pages/Diagnostic';
import { LanguageHub } from './pages/LanguageHub';
import { VocabPage, VocabReview, VocabTopicPage } from './pages/Vocab';
import { MistakesPage, MistakesReview, PracticeTopic } from './pages/Mistakes';
import { CalendarPage } from './pages/Calendar';
import { StatsPage } from './pages/Stats';
import { SettingsPage } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';
import { CheckpointPage } from './pages/Checkpoint';
import { PronunciationPage, DictationPage } from './pages/Pronunciation';
import { IeltsHub, IeltsReading, IeltsListening, IeltsWriting, IeltsSpeaking } from './pages/Ielts';
import { KaztestHub, KaztestListening, KaztestReading, KaztestWriting, KaztestSpeaking } from './pages/Kaztest';
import { ExamsPage, ExamRun } from './pages/Exams';
import { TutorPage } from './pages/Tutor';
import { ConversationPage } from './pages/Conversation';
import { MedicalPage } from './pages/Medical';
import { EmergencyPage } from './pages/Emergency';
import type { Lang } from './data/types';

const asLang = (x?: string): Lang => (x === 'kk' ? 'kk' : 'en');

function Routes() {
  const { parts } = useRoute();
  const [a, b, c, d] = parts;
  switch (a) {
    case undefined:
      return <Home />;
    case 'onboarding':
      return <Onboarding />;
    case 'today':
      return <TodayPage />;
    case 'en':
    case 'kk':
      return <LanguageHub lang={a} />;
    case 'lesson':
      return <LessonPage id={b ?? ''} />;
    case 'diagnostic':
      return <DiagnosticPage key={`${b}-${c}`} lang={asLang(b)} part={c} />;
    case 'vocab':
      if (b === 'review') return <VocabReview key={c} lang={asLang(c)} />;
      if (b === 'topic') return <VocabTopicPage lang={asLang(c)} cat={d ?? ''} />;
      return <VocabPage />;
    case 'mistakes':
      if (b === 'review') return <MistakesReview key={c} lang={asLang(c)} />;
      return <MistakesPage />;
    case 'practice':
      return <PracticeTopic key={b} topic={b ?? ''} />;
    case 'checkpoint':
      return <CheckpointPage key={b} lang={asLang(b)} />;
    case 'calendar':
      return <CalendarPage />;
    case 'stats':
      return <StatsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'pronunciation':
      return <PronunciationPage key={b} lang={asLang(b)} />;
    case 'dictation':
      return <DictationPage key={b} lang={asLang(b)} />;
    case 'ielts':
      if (b === 'reading') return <IeltsReading />;
      if (b === 'listening') return <IeltsListening />;
      if (b === 'writing') return <IeltsWriting />;
      if (b === 'speaking') return <IeltsSpeaking />;
      return <IeltsHub />;
    case 'kaztest':
      if (b === 'reading') return <KaztestReading />;
      if (b === 'listening') return <KaztestListening />;
      if (b === 'writing') return <KaztestWriting />;
      if (b === 'speaking') return <KaztestSpeaking />;
      return <KaztestHub />;
    case 'exams':
      return <ExamsPage />;
    case 'exam':
      return <ExamRun key={`${b}-${c}`} testId={b ?? ''} mode={c === 'training' ? 'training' : 'exam'} />;
    case 'tutor':
      return <TutorPage />;
    case 'conversation':
      return <ConversationPage />;
    case 'medical':
      return <MedicalPage />;
    case 'emergency':
      return <EmergencyPage />;
    default:
      return (
        <div>
          <PageHeader title="Страница не найдена" back="/" />
          <Notice tone="warn">Такого раздела нет.</Notice>
        </div>
      );
  }
}

export default function App() {
  const s = useAppState();
  const { parts } = useRoute();
  useEffect(() => {
    if (!s.onboarded && parts[0] !== 'onboarding' && parts[0] !== 'settings') navigate('/onboarding');
  }, [s.onboarded, parts]);
  const err = getLoadError();
  return (
    <Layout>
      {err && (
        <div className="mb-4">
          <Notice tone="bad" title="Сохранённые данные не удалось прочитать">
            {err}. Восстановите данные из резервной копии JSON в Настройках.
          </Notice>
        </div>
      )}
      <Routes />
    </Layout>
  );
}
