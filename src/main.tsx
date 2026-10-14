import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/wght.css';
import './index.css';
import App from './App';
import { initStore } from './lib/store';
import { loadVoices } from './lib/speech';

const root = createRoot(document.getElementById('root')!);
root.render(
  <div style={{ padding: 24, fontFamily: 'system-ui', color: '#526273', background: '#f5f7fa', minHeight: '100vh' }}>Загрузка AA PhD Language Lab…</div>,
);

initStore()
  .catch((e) => console.error('Ошибка загрузки данных', e))
  .finally(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    void loadVoices();
  });

// PWA: офлайн-кэш (только в собранной версии)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
