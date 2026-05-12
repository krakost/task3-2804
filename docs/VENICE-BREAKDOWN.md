# Venice task breakdown API

Клиент отправляет задачу внешнему Worker’у и создаёт карточки в выбранной колонке Supabase через существующий **`createBoardTask`**.

## Endpoint

- **Метод:** `POST`
- **Тело:** `{ "task": "<текст задачи пользователя>" }`
- **Заголовки:** `Content-Type: application/json`
- **Ожидаемый ответ (JSON):** `{ "items": [ { "title": "...", "description": "...", "color": "#RRGGBB" }, ... ] }`

Цвет каждого элемента проверяется на формат `#RGB` / `#RRGGBB`; при невалидном значении подставляется `#71717a`.

## Конфигурация фронта

Переменная окружения **`VITE_VENICE_BREAKDOWN_URL`** (см. [`.env.example`](../.env.example)):

- Если задана и не пустая — всегда используется она (dev и prod).
- Если не задана:
  - **`npm run dev`** — используется относительный путь **`/api/venice/breakdown`**, проброшенный Vite на upstream (один источник с dev-сервером, браузеру CORS до внешнего домена не нужен).
  - **production-сборка** — прямой URL по умолчанию в коде: `https://taskboard.krakost1980.workers.dev/api/venice/breakdown`.

После изменения `.env` перезапустите `npm run dev`.

## CORS «для всех» Origin

Из браузера нельзя «включить CORS» только на клиенте. Варианты:

1. **Локально:** прокси Vite в [`vite.config.ts`](../vite.config.ts); при отсутствии `VITE_VENICE_BREAKDOWN_URL` в dev URL уже берётся прокси (см. выше).

2. **Прод без правок апстрим-воркера:** задеплойте наш шлюз **[`workers/venice-cors-proxy`](../workers/venice-cors-proxy/README.md)** — он добавляет **`Access-Control-Allow-Origin: *`** и проксирует POST на `VENICE_UPSTREAM_URL`. После деплоя пропишите URL своего Worker’а в **`VITE_VENICE_BREAKDOWN_URL`**.

3. **Прямой вызов апстрим-URL:** на стороне `taskboard.krakost1980.workers.dev` должны быть настроены CORS (в т.ч. `*` при необходимости).

Подробнее по шлюзу: [`workers/venice-cors-proxy/README.md`](../workers/venice-cors-proxy/README.md).

### Ручная настройка `.env` (dev)

При желании указать только прокси явно:

`VITE_VENICE_BREAKDOWN_URL=/api/venice/breakdown`

и запуск **`npm run dev`** с тем же `server.proxy`, что уже в **`vite.config.ts`**.

## UI

Панель **«AI task breakdown»** / **«Разбор задачи (AI)»** на странице доски ([`BoardAiBreakdownPanel`](../src/components/kanban/BoardAiBreakdownPanel.tsx)): выбор колонки, текст задачи, кнопка отправки; после успеха список созданных заголовков. Локализация: ключи **`kanban.aiBreakdown.*`** в `src/locales/en.json` и `ru.json`.

## Ошибки

- Пустой ответ по элементам с валидным `title` — сообщение пользователю про пустой ответ (**`NO_ITEMS`**).
- Частичный сбой при вставке в БД не откатывает уже созданные карточки: цикл прерывается, ошибка показывается через React Query mutation state.

---

## Структура кода и файлов репозитория

| Назначение | Путь |
|------------|------|
| HTTP-клиент, разбор ответа, **`getVeniceBreakdownUrl`** (dev без env → `/api/venice/breakdown`) | [`src/features/ai/api.ts`](../src/features/ai/api.ts) |
| Мутация: Venice → последовательно **`createBoardTask`** → инвалидация **`tasks`** | [`src/hooks/useVeniceBreakdownImport.ts`](../src/hooks/useVeniceBreakdownImport.ts) |
| Панель UI на доске | [`src/components/kanban/BoardAiBreakdownPanel.tsx`](../src/components/kanban/BoardAiBreakdownPanel.tsx) |
| Подключение панели | [`src/components/kanban/Board.tsx`](../src/components/kanban/Board.tsx) |
| Запись в **`board_tasks`** | [`src/features/tasks/api.ts`](../src/features/tasks/api.ts) — **`createBoardTask`** |
| Тип env | [`src/vite-env.d.ts`](../src/vite-env.d.ts) |
| Dev proxy **`/api/venice`** | [`vite.config.ts`](../vite.config.ts) (`server.proxy`) |
| Worker с **`Access-Control-Allow-Origin: *`** | [`workers/venice-cors-proxy/`](../workers/venice-cors-proxy/README.md) |
| Ключи **`kanban.aiBreakdown.*`** | [`src/locales/en.json`](../src/locales/en.json), [`ru.json`](../src/locales/ru.json) |
| Пример env | [`.env.example`](../.env.example) |

Сводный указатель см. **[docs/README.md](./README.md)**.
