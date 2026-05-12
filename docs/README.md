# Документация репозитория

Центральный указатель связанной с проектом документации.

---

## Руководства

| Файл | О чём |
|------|--------|
| [**I18N.md**](./I18N.md) | Переключение **RU / EN**: `i18next`, файлы переводов, `localStorage`, ключи **`kanban.*`** и др., как добавлять строки. |
| [**VENICE-BREAKDOWN.md**](./VENICE-BREAKDOWN.md) | Панель «разбор задачи»: POST к Worker, **`VITE_VENICE_BREAKDOWN_URL`**, Vite proxy в dev, Worker **`workers/venice-cors-proxy`** (**`Access-Control-Allow-Origin: *`**), **`createBoardTask`**. |
| [**PROJECT-RULE.mdc**](../.cursor/rules/PROJECT-RULE.mdc) | Ориентировочная структура фронтенда (правила Cursor). |

---

## Черновой обзор изменений

| Файл | О чём |
|------|--------|
| [**UNCOMMITTED-CHANGES.md**](./UNCOMMITTED-CHANGES.md) | Поэтапно: Supabase, сайдборд, участники, **i18n**, **Venice** и CORS и т.д. |

---

## Рядом с кодом

| Путь | Назначение |
|------|------------|
| [`.env.example`](../.env.example) | Пример: Supabase, Venice breakdown. |
| [`workers/venice-cors-proxy/README.md`](../workers/venice-cors-proxy/README.md) | Деплой шлюза CORS. |

---

## Корневая `README.md`

В [README](../README.md): команды, `.env`/Supabase, Venice (ссылка на `VENICE-BREAKDOWN.md`), блок **Documentation** (ссылка на этот индекс), **Internationalization** → `I18N.md`, структура `src/`.
