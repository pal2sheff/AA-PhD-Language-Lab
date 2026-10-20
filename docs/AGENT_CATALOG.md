# Каталог агентов Диссертационного штаба

Определения: `.claude/agents/*.md`. Общие правила: `docs/HQ_RULES.md`. Маршруты: `docs/WORKFLOWS.md`.
Главная беседа Claude Code — начальник штаба. Отдельного агента-начальника нет. Агентам не выдан инструмент `Agent`, поэтому вложенные вызовы исключены и всю координацию ведёт главная беседа.

## 1. Состав

| № | Агент | Роль | Инструменты | Зона записи |
|---|---|---|---|---|
| 1 | `phd-secretary` | Научный секретарь, координатор | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | `project/PhD_Control.md`, `project/sessions/`, `literature/READING_SCHEDULE.*`, `publications/CALENDAR.md`, `defense/PACKAGE_CHECKLIST.md` |
| 2 | `scientific-director` | Научный руководитель, методолог | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | `protocol/` (концепция и сводная версия; кроме `clinical/`, `lab/`, `sap/`), `project/Research_Profile.md` (после решения пользователя) |
| 3 | `research-librarian` | Поисковик, библиотекарь | Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch | реестр в `literature/` (кроме `READING_SCHEDULE.*`), `literature/search_log/`, `sources/` |
| 4 | `evidence-analyst` | Аналитик статей и обзора | Read, Grep, Glob, Write, Edit, Bash, WebFetch | `literature/analyses/`, `literature/evidence/` |
| 5 | `clinical-expert` | Клиника диабетической стопы (5 режимов) | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | `protocol/clinical/` |
| 6 | `biomarker-expert` | Митохондрии, иммунология, старение, лаборатория | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | `protocol/lab/` |
| 7 | `data-statistician` | Данные, биостатистика, R/Python | Read, Grep, Glob, Write, Edit, Bash, NotebookEdit | `analysis/` (кроме `review_runs/` и `environment/`), `data/processed/`, `data/synthetic/`, `protocol/sap/` |
| 8 | `ethics-compliance` | Этика, защита данных, официальные требования | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | `ethics/`, в т. ч. `ethics/REQUIREMENTS.md` |
| 9 | `scientific-writer` | Автор, редактор, переводчик, публикации | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | `manuscript/` (кроме `formatted/`), `publications/` (кроме `CALENDAR.md`) |
| 10 | `defense-presenter` | Документы, презентации, защита | Read, Grep, Glob, Write, Edit, Bash | `defense/` (кроме чек-листа пакета), `manuscript/formatted/` |
| 11 | `independent-reviewer` | Независимый проверяющий, оппонент (6 режимов) | Read, Grep, Glob, Bash (хук: только чтение и запуск скриптов из `review_runs/`), Write (хук: только 2 каталога), WebSearch, WebFetch; Edit и NotebookEdit запрещены | `reports/reviews/`, `analysis/review_runs/` |
| 12 | `research-engineer` | Среда, подключения, воспроизводимость | Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch | `docs/INTEGRATIONS.md`, `analysis/environment/`, `.claude/` (агенты, хуки, настройки — только после согласия пользователя), `.mcp.json` (после согласия), `.gitignore` |

Во всех определениях указано `model: inherit`. Поле `permissionMode` не задано, обхода разрешений нет.

**Ограничение проверяющего.** Хук `.claude/hooks/reviewer_guard.py` подключён в проектном `.claude/settings.json` (`onFailure: "block"`) и ограничивает только вызовы с `agent_type = independent-reviewer`. Хук во frontmatter агента не используется: Claude Code пропускает такие хуки, пока папке не выдано доверие, и в проверке 2026-10-20 он не сработал. Хук работает по списку разрешённого. Write допускается только в `reports/reviews/` и `analysis/review_runs/`. Bash ограничен программами, которые не пишут в файлы и не запускают других программ, и читающими командами `git` без опций записи и глобальных опций. `cp` и `mkdir` разрешены только в эти два каталога, без ссылок. R/Python-скрипты запускаются только из `analysis/review_runs/` и без кода из строки. Программы запускаются только по имени или из системных каталогов. Подстановки, многострочные команды и операторы вроде `<>` запрещены. При ошибке разбора действие блокируется. Тесты (92 случая): `python3 .claude/hooks/tests/test_reviewer_guard.py`. Живая проба в субагенте 2026-10-20: `reports/reviews/2026-10-20_hook_live_probe.md`.

Остаточный риск: скрипт из `analysis/review_runs/` технически может открыть любой файл. Поэтому главная беседа сравнивает отпечатки `.claude/hooks/repo_snapshot.sh` до и после проверки, а защиту на уровне ОС даёт только песочница (вопрос Q11). Проверяющий первым действием выполняет пробу `uname`, которая должна быть заблокирована.

**Общая защита данных** (`.claude/settings.json`, для всех): запрещено изменять `data/raw/**` и читать `.env`, `.env.*`, `*.key`. По документации Claude Code эти запреты распространяются на встроенные файловые инструменты и распознаваемые команды Bash, но не на произвольные скрипты. Для защиты на уровне ОС нужна песочница.

## 2. Каноническое соответствие ролей

**Прежних определений штаба в проекте не обнаружено** (проверено 2026-10-20: `.claude/agents/`, `.claude/skills/`, `.claude/commands/` в репозитории и ветке `main`, пользовательские `~/.claude/agents`, `~/.claude/skills` в этой среде). Исходного перечня 41 роли тоже нет. Поэтому таблица ниже — **реконструкция по описанию функций в поручении от 20.10.2026, а не по проверенным файлам**. Полнота оценена по перечню функций, а точное соответствие 41 прежней роли проверить невозможно. Если пользователь предоставит прежний перечень, таблицу нужно сверить (см. `project/OPEN_QUESTIONS.md`).

| Код | Функция | Основной ответственный | Проверка / передача |
|---|---|---|---|
| F01 | Приём поручения, выбор исполнителей, сведение результатов | главная беседа | — |
| F02 | Журнал решений и открытые вопросы | главная беседа | предложения от всех агентов |
| F03 | Прогресс, задачи, сроки | phd-secretary | — |
| F04 | Подготовка следующей сессии и встреч | phd-secretary | — |
| F05 | Организация поступления (Астана, КазНМУ, зарубежные) | phd-secretary | требования от ethics-compliance |
| F06 | Поиск финансирования | phd-secretary | требования от ethics-compliance |
| F07 | Языковая подготовка (организация) | phd-secretary | — |
| F08 | Публикационный календарь | phd-secretary | журналы от scientific-writer |
| F09 | Комплектность пакета к защите | phd-secretary | требования от ethics-compliance |
| F10 | Научная концепция, пробел, новизна | scientific-director | independent-reviewer (методология) |
| F11 | Цель, задачи, гипотезы | scientific-director | independent-reviewer |
| F12 | Дизайн, критерии включения, исходы, смешивающие факторы | scientific-director | clinical, biomarker, statistician; independent-reviewer |
| F13 | Выбор типа обзора | scientific-director | — |
| F14 | Согласование протокола | scientific-director | independent-reviewer |
| F15 | Поисковые стратегии и поиск | research-librarian | independent-reviewer (источники) |
| F16 | Библиография, метаданные, DOI/PMID | research-librarian | independent-reviewer (источники) |
| F17 | Полные тексты и доступность | research-librarian | — |
| F18 | Реестр, канонические номера, дубли, потоки А/Б | research-librarian | — |
| F19 | Разбор статей | evidence-analyst | independent-reviewer (источники) |
| F20 | Оценка качества и риска систематической ошибки | evidence-analyst | independent-reviewer (методология) |
| F21 | Матрицы доказательств, тематический синтез | evidence-analyst | → scientific-writer |
| F22 | Хирургия диабетической стопы | clinical-expert (режим «хирургия») | — |
| F23 | Эндокринология | clinical-expert (режим «эндокринология») | — |
| F24 | Сосудистая патология | clinical-expert (режим «сосуды») | — |
| F25 | Инфекция и раневой процесс | clinical-expert (режим «раны») | — |
| F26 | Реабилитация и организация сопровождения | clinical-expert (режим «реабилитация») | — |
| F27 | Митохондриальная биология, механизмы | biomarker-expert | — |
| F28 | Иммунология и воспаление | biomarker-expert | — |
| F29 | Старение, биологический возраст, AGE | biomarker-expert | — |
| F30 | Лабораторная документация, преаналитика, единицы | biomarker-expert | — |
| F31 | Карта участника, словарь переменных, структура базы | data-statistician | independent-reviewer (статистика) |
| F32 | Обоснование выборки, план анализа | data-statistician | independent-reviewer (статистика) |
| F33 | Расчёты в R/Python, журнал, версии | data-statistician | independent-reviewer (повторение) |
| F34 | Прогностическое моделирование | data-statistician | independent-reviewer (статистика, стандарт TRIPOD) |
| F35 | Контроль качества данных | data-statistician | — |
| F36 | ЛЭК, согласия, поправки к протоколу | ethics-compliance | independent-reviewer (добросовестность) |
| F37 | Обезличивание, доступ к данным | ethics-compliance | research-engineer (техническая часть) |
| F38 | Официальные требования РК, вузов, аттестации и защиты | ethics-compliance | → phd-secretary (отслеживание) |
| F39 | Написание глав и статей | scientific-writer | independent-reviewer |
| F40 | Редактура, корректура, терминология | scientific-writer | — |
| F41 | Медицинский перевод EN/KZ | scientific-writer | — |
| F42 | Подбор журналов, подача, ответы рецензентам | scientific-writer | independent-reviewer |
| F43 | Оформление DOCX, таблиц, рисунков, приложений | defense-presenter | — |
| F44 | Презентации | defense-presenter | — |
| F45 | Доклад, версии выступления, банк ответов, репетиции | defense-presenter | вопросы от independent-reviewer |
| F46 | Проверка источников, цитат, DOI, чисел | independent-reviewer | — |
| F47 | Методологическая экспертиза | independent-reviewer | — |
| F48 | Независимая статистическая проверка | independent-reviewer | техническая помощь research-engineer |
| F49 | Соответствие стандартам описания | independent-reviewer | — |
| F50 | Научная добросовестность | independent-reviewer | — |
| F51 | Оппонирование перед защитой | independent-reviewer | → defense-presenter |
| F52 | Конфигурация Claude Code, MCP, API, плагины | research-engineer | — |
| F53 | Чтение файлов, OCR, вычислительная среда | research-engineer | — |
| F54 | Техническая воспроизводимость | research-engineer | — |
| F55 | Git и резервное копирование | research-engineer | — |
| F56 | График чтения (состав и сроки в одном файле) | phd-secretary | состав предлагает research-librarian |
| F57 | Ведение регламента, каталога, маршрутов, `CLAUDE.md`, `README.md`, отчётов штаба | главная беседа | изменения — после согласия пользователя |
| F58 | Клиническая интерпретация результатов анализа | clinical-expert | independent-reviewer |
| F59 | Биологическая и лабораторная интерпретация результатов анализа | biomarker-expert | independent-reviewer |
| F60 | Учёт выполнения официальных требований | phd-secretary (в `PhD_Control.md` со ссылкой на номер требования) | требования — ethics-compliance |

Итог проверки: 60 функций, у каждой ровно один основной ответственный. Зоны записи агентов в разделе 1 не пересекаются: вложенные каталоги исключены из зон соседних агентов. Повторы встречаются только в столбце «Проверка / передача». Ни одна функция проверки не назначена автору проверяемого материала.

## 3. Команды

| Команда | Исполнители | Назначение |
|---|---|---|
| `/phd-status` | главная беседа или phd-secretary | Состояние проекта |
| `/phd-plan` | phd-secretary (+ scientific-director) | План на период |
| `/phd-search` | research-librarian | Поиск литературы |
| `/phd-article` | research-librarian → evidence-analyst → independent-reviewer (обязательно, если тезисы идут в текст или статья ключевая) | Разбор статьи |
| `/phd-review` | scientific-director → librarian + analyst → writer → reviewer | Обзор |
| `/phd-protocol` | scientific-director + предметные блоки → reviewer | Протокол |
| `/phd-stats` | data-statistician → reviewer → предметный эксперт | Анализ |
| `/phd-write` | scientific-writer → reviewer → исправления → presenter (при необходимости оформления) | Текст |
| `/phd-check` | independent-reviewer | Проверка |
| `/phd-defense` | reviewer → presenter → secretary | Защита |
| `/phd-tools` | research-engineer | Инструменты |

Прежние `/progress` и `/article` в проекте и в пользовательских навыках этой среды не найдены. Совместимость сохранять не с чем. Если эти команды существуют на другом компьютере, их нужно предоставить, и тогда будут созданы псевдонимы к `/phd-status` и `/phd-article` без изменения смысла.
