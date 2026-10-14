// AA PhD Language Lab — сервер (Node.js ≥ 20, без фреймворков).
// 1) Раздаёт собранное приложение из ../dist
// 2) /api/ai     — безопасный прокси к Claude API (ключ хранится только на сервере)
// 3) /api/sync   — облачная синхронизация (одна копия данных на токен)
// 4) /api/health — проверка состояния
//
// Переменные окружения:
//   PORT                 порт (по умолчанию 8787)
//   ANTHROPIC_API_KEY    ключ Anthropic API (без него AI-функции отключены)
//   ANTHROPIC_MODEL      модель (по умолчанию claude-opus-5-5)
//   APP_ACCESS_TOKEN     токен доступа к /api/ai (обязателен, если сервер доступен из интернета)
//   SYNC_TOKENS          список разрешённых токенов синхронизации через запятую
//   DATA_DIR             папка для данных синхронизации (по умолчанию server/data)
//   ALLOWED_ORIGIN       разрешённый Origin для CORS (если приложение размещено на другом домене)

import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, stat, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPTS, WRITING_SCHEMA, SUMMARY_SCHEMA } from './prompts.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '../dist');
const DATA_DIR = process.env.DATA_DIR || path.join(here, 'data');
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
const ACCESS = process.env.APP_ACCESS_TOKEN || '';
const SYNC_TOKENS = (process.env.SYNC_TOKENS || '').split(',').map((s) => s.trim()).filter(Boolean);
const ORIGIN = process.env.ALLOWED_ORIGIN || '';
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', ...headers });
  res.end(data);
}

function cors(req, res) {
  if (!ORIGIN) return;
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Vary', 'Origin');
}

async function readBody(req, limit = 8 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error('Слишком большой запрос'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Простое ограничение частоты: не более 30 AI-запросов в минуту с одного токена/IP.
const hits = new Map();
function rateLimited(key) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > 30;
}

async function handleAi(req, res) {
  if (!client) return send(res, 503, { error: 'На сервере не задан ANTHROPIC_API_KEY.' });
  if (ACCESS && !safeEqual(bearer(req), ACCESS)) return send(res, 401, { error: 'Неверный токен доступа к серверу.' });
  if (rateLimited(bearer(req) || req.socket.remoteAddress)) return send(res, 429, { error: 'Слишком много запросов. Подождите минуту.' });
  let body;
  try {
    body = JSON.parse(await readBody(req, 512 * 1024));
  } catch (e) {
    return send(res, e.status || 400, { error: 'Некорректный запрос.' });
  }
  const { task, lang, messages, context } = body || {};
  const system = SYSTEM_PROMPTS[task];
  if (!system || !['en', 'kk'].includes(lang) || !Array.isArray(messages) || !messages.length) return send(res, 400, { error: 'Некорректные параметры.' });
  const clean = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));
  if (!clean.length || clean[0].role !== 'user') clean.unshift({ role: 'user', content: '(начало диалога)' });
  const ctx = context ? `\n\nСведения об ученике (из приложения): ${JSON.stringify(context).slice(0, 3000)}` : '';
  const format = task === 'writing' ? WRITING_SCHEMA : task === 'conversation-summary' ? SUMMARY_SCHEMA : null;
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: `${system(lang)}${ctx}`,
      messages: clean,
      output_config: { effort: task === 'writing' ? 'high' : 'medium', ...(format ? { format: { type: 'json_schema', schema: format } } : {}) },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    if (response.stop_reason === 'refusal') return send(res, 422, { error: 'Модель отказалась отвечать на этот запрос.' });
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return send(res, 200, { text, model: response.model });
  } catch (e) {
    const status = e?.status && e.status < 600 ? e.status : 502;
    console.error('AI error', status, e?.message);
    return send(res, status === 401 ? 502 : status, { error: status === 429 ? 'Лимит запросов к Claude API исчерпан, попробуйте позже.' : 'Ошибка обращения к Claude API.' });
  }
}

function syncFile(token) {
  const id = createHash('sha256').update(token).digest('hex').slice(0, 32);
  return path.join(DATA_DIR, `${id}.json`);
}

async function handleSync(req, res, url) {
  const token = bearer(req);
  if (!token || token.length < 16) return send(res, 401, { error: 'Нужен токен синхронизации (не короче 16 символов).' });
  if (SYNC_TOKENS.length && !SYNC_TOKENS.some((t) => safeEqual(t, token))) return send(res, 403, { error: 'Токен синхронизации не разрешён на этом сервере.' });
  if (!SYNC_TOKENS.length) return send(res, 403, { error: 'Синхронизация выключена: задайте SYNC_TOKENS на сервере.' });
  const file = syncFile(token);
  if (req.method === 'GET') {
    if (!existsSync(file)) return send(res, 404, { error: 'В облаке нет данных.' });
    const raw = await readFile(file, 'utf8');
    if (url.searchParams.get('meta')) {
      const st = await stat(file);
      let updatedAt = null;
      try {
        updatedAt = JSON.parse(raw).updatedAt ?? null;
      } catch {
        /* повреждённый файл */
      }
      return send(res, 200, { updatedAt, savedAt: st.mtimeMs, size: st.size });
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(raw);
  }
  if (req.method === 'PUT') {
    const raw = await readBody(req);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return send(res, 400, { error: 'Некорректный JSON.' });
    }
    if (parsed?.version !== 1) return send(res, 400, { error: 'Неизвестный формат данных.' });
    await mkdir(DATA_DIR, { recursive: true });
    // резервная копия предыдущей версии
    if (existsSync(file)) await rename(file, file.replace(/\.json$/, '.prev.json'));
    await writeFile(file, raw, { mode: 0o600 });
    return send(res, 200, { ok: true });
  }
  return send(res, 405, { error: 'Метод не поддерживается.' });
}

async function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(DIST, p));
  if (!file.startsWith(DIST)) return send(res, 403, 'Forbidden');
  try {
    const data = await readFile(file);
    const ext = path.extname(file);
    const immutable = file.includes(`${path.sep}assets${path.sep}`);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'microphone=(self)',
    });
    res.end(data);
  } catch {
    if (!existsSync(DIST)) return send(res, 500, 'Сначала соберите приложение: npm run build');
    const html = await readFile(path.join(DIST, 'index.html'));
    res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
    res.end(html);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      cors(req, res);
      if (req.method === 'OPTIONS') return send(res, 204, '');
      if (url.pathname === '/api/health') {
        if (ACCESS && bearer(req) && !safeEqual(bearer(req), ACCESS)) return send(res, 401, { error: 'Неверный токен доступа.' });
        return send(res, 200, { ok: true, ai: !!client, model: client ? MODEL : null, sync: SYNC_TOKENS.length > 0 });
      }
      if (url.pathname === '/api/ai' && req.method === 'POST') return await handleAi(req, res);
      if (url.pathname === '/api/sync') return await handleSync(req, res, url);
      return send(res, 404, { error: 'Не найдено.' });
    }
    return await serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    return send(res, e.status || 500, { error: e.status ? e.message : 'Внутренняя ошибка сервера.' });
  }
});

server.listen(PORT, () => {
  console.log(`AA PhD Language Lab: http://localhost:${PORT}`);
  console.log(`AI: ${client ? `включён (${MODEL})` : 'выключен (нет ANTHROPIC_API_KEY)'}; синхронизация: ${SYNC_TOKENS.length ? 'включена' : 'выключена'}`);
  if (client && !ACCESS) console.warn('ВНИМАНИЕ: APP_ACCESS_TOKEN не задан — любой, кто знает адрес сервера, может тратить ваш баланс Claude API.');
});
