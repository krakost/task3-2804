# Незакоммиченные изменения (обзор)

Документ описывает текущее состояние рабочей копии относительно последнего коммита в `main`: новые файлы, правки и назначение изменений.

---

## Зависимости и окружение

- **`package.json` / `package-lock.json`**: добавлена зависимость **`@supabase/supabase-js`** для клиентской аутентификации и запросов к Supabase.
- **`.env.example`**: переменные **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_ANON_KEY`**; комментарии про Google OAuth (настройка в Supabase Dashboard и redirect URI вида `https://<project-ref>.supabase.co/auth/v1/callback`).

---

## Клиент Supabase

- **`src/lib/supabase-client.ts`** (новый): создание `SupabaseClient` при наличии env; при отсутствии URL/ключа экспортируется **`supabase = null`**. Auth: PKCE, `detectSessionInUrl`, персистентная сессия, автообновление токена. Экспорт **`isSupabaseConfigured()`**.

---

## Аутентификация (состояние и загрузка)

- **`src/features/auth/store.ts`** (новый): Zustand **`useAuthStore`** — `session`, `user`, флаг **`hydrated`**, экшены **`setSession`**, **`setHydrated`**.
- **`src/app/AuthBootstrap.tsx`** (новый): при монтировании читает сессию из Supabase, подписывается на **`onAuthStateChange`**, синхронизирует store; если Supabase не настроен — помечает `hydrated` и не подписывается.
- **`src/app/providers.tsx`**: обёртка приложения дополнена **`AuthBootstrap`** внутри **`QueryClientProvider`** (порядок: Query → Auth → children).

---

## Раскладка и навигация

- **`src/components/shared/AppLayout.tsx`**:
  - Шапка: email пользователя, **Sign out** (через `supabase.auth.signOut`), либо **Sign in** / **Sign up** до гидрации авторизации.
  - Учёт **`hydrated`**: кнопки входа и контент не «мигают» до загрузки сессии.
  - Для **`hydrated && user`**: справа от основного контента на больших экранах (**`lg:`**) показывается **`BoardsRightSidebar`** в колонке `aside`; основной контент — **`Outlet`**.

---

## Диалоги входа и регистрации

- **`src/components/shared/AuthDialogs.tsx`**:
  - Режимы: **`closed` | `signin` | `signup`**; управляются из `AppLayout`.
  - Если Supabase не настроен — показ подсказки с текстом про **`VITE_SUPABASE_*`**.
  - **Вход / регистрация по email и паролю** (`signInWithPassword`, `signUp`), валидация паролей на signup.
  - **Continue with Google** — `signInWithOAuth` с провайдером Google и `redirectTo` на текущий origin.
  - Переключение между sign-in и sign-up, сброс полей при закрытии.

---

## Типы

- **`src/types/index.ts`**: **`BoardSummary`** дополнен полем **`user_id`** (владелец доски). Добавлен тип **`BoardMember`** (`userId`, `email`, `name`).
- **`src/features/boards/types.ts`**: реэкспорт **`BoardMember`** и **`BoardSummary`** из `@/types`.

---

## API досок и участников (`src/features/boards/api.ts`)

Переход с заглушек на реальные вызовы Supabase (при отсутствии клиента / сессии — осмысленные возвраты или ошибки):

| Функция | Назначение |
|--------|------------|
| `fetchBoards` | Список досок, доступных пользователю по RLS (`id`, `title`, `user_id`). |
| `fetchBoard` | Одна доска по `id`. |
| `createBoard` | Создание с `title` и `user_id` текущего пользователя. |
| `deleteBoard` | Удаление доски по `id` (на сервере ограничено RLS владельцем). |
| `searchProfiles` | Поиск профилей по email/имени (для приглашений), экранирование символов `LIKE`. |
| `fetchBoardMembers` | Участники доски через `board_members` + join к `profiles`. |
| `addBoardMember` | Добавление участника; дружелюбная ошибка при дубликате (`23505`). |
| `removeBoardMember` | Удаление участника из доски. |

Тип **`ProfileSearchHit`** экспортируется для UI поиска.

---

## React Query: доски

- **`src/hooks/useBoards.ts`**:
  - **`useBoards`** — список досок, ключ `['boards', userId]`, включён при наличии Supabase и пользователя.
  - **`useCreateBoard`** — создание; оптимистичное обновление кэша списка.
  - **`useBoard(boardId)`** — метаданные одной доски, ключ с `boardId` и `user.id`.
  - **`useDeleteBoard`** — удаление; после успеха: инвалидация списка досок, сброс кэша `board` и `tasks` для удалённой доски.

---

## React Query: участники и поиск

- **`src/hooks/useBoardMembers.ts`** (новый):
  - **`useBoardMembers(boardId, dialogOpen)`** — загрузка участников только при открытом диалоге.
  - **`useSearchProfiles(query)`** — поиск при длине запроса ≥ 2, `staleTime` 30s.
  - **`useAddBoardMember`** / **`useRemoveBoardMember`** — мутации с инвалидацией `board-members` и `boards`.

---

## Правый сайдбар досок

- **`src/components/shared/BoardsRightSidebar.tsx`** (новый):
  - Список досок с **`NavLink`** на `/board/:id`, скелетон при загрузке.
  - **Создать Board** — диалог с полем названия, **`useCreateBoard`**, после успеха переход на новую доску.
  - Для досок, где **`user.id === board.user_id`**: кнопка настроек (шестерёнка) открывает **`BoardSettingsDialog`**; кнопка **удаления** (иконка корзины) открывает диалог подтверждения.
  - **Удаление**: **`useDeleteBoard`**; при успехе, если текущий маршрут совпадает с удалённой доской (`/board/:id`), выполняется **`navigate('/boards')`**.

---

## Диалог настроек доски

- **`src/components/shared/BoardSettingsDialog.tsx`** (новый): только для переданного `boardId` / владельца; список участников, поле поиска пользователей с debounce, добавление и удаление участников через хуки выше; фильтрация hits (исключение владельца, текущего пользователя и уже добавленных).

---

## Страницы

- **`src/pages/boards/BoardsPage.tsx`**: статус зависит от `hydrated`, наличия пользователя, загрузки списка и числа досок; подсказка создать доску в сайдбаре.
- **`src/pages/board/BoardPage.tsx`**: заголовок с **`useBoard`** для отображения **`board.title`**; канбан через **`Board`**; задачи через **`useTasks`** (без кнопки удаления доски на странице — удаление в сайдбаре).

---

## База данных (Supabase)

В репозитории миграций под эти изменения нет; ожидаются объекты в проекте Supabase, согласованные с кодом: таблицы вроде **`boards`** (в т.ч. **`user_id`**), **`board_members`**, **`profiles`**; политики RLS, в том числе **удаление доски только владельцем** (`auth.uid() = user_id` или эквивалент). Каскадное удаление строк **`board_members`** при удалении доски настраивается на стороне БД.

---

## Сводка файлов

| Статус | Путь |
|--------|------|
| Изменены | `.env.example`, `package.json`, `package-lock.json` |
| Изменены | `src/app/providers.tsx`, `src/components/shared/AppLayout.tsx`, `src/components/shared/AuthDialogs.tsx` |
| Изменены | `src/features/boards/api.ts`, `src/features/boards/types.ts`, `src/hooks/useBoards.ts` |
| Изменены | `src/pages/board/BoardPage.tsx`, `src/pages/boards/BoardsPage.tsx`, `src/types/index.ts` |
| Новые | `src/app/AuthBootstrap.tsx`, `src/components/shared/BoardSettingsDialog.tsx`, `src/components/shared/BoardsRightSidebar.tsx` |
| Новые | `src/features/auth/store.ts`, `src/hooks/useBoardMembers.ts`, `src/lib/supabase-client.ts` |

---

## Локализация интерфейса (RU / EN)

Подробное описание: **`docs/I18N.md`**.

### Зависимости

- **`package.json` / `package-lock.json`**: **`i18next`**, **`react-i18next`**.

### Конфигурация и переводы

- **`src/lib/i18n.ts`** (новый): инициализация i18next, ресурсы `en`/`ru`, чтение/запись **`localStorage`** (`preferred-locale`), определение языка из **`navigator.language`**, синхронизация **`document.documentElement.lang`**, экспорт **`changeAppLocale`**.
- **`src/locales/en.json`**, **`src/locales/ru.json`** (новые): все строки UI с согласованной иерархией ключей.
- **`tsconfig.app.json`**: **`resolveJsonModule`: true** (импорт JSON).

### Интеграция в приложение

- **`src/main.tsx`**: **`import '@/lib/i18n'`** до `createRoot`.
- **`src/app/providers.tsx`**: обёртка **`I18nextProvider`** вокруг **`QueryClientProvider`** (внешний уровень — i18n).

### UI

- **`src/components/shared/AppLayout.tsx`**: переключатель языка (**`<select>`** `en` / `ru`), навигация и кнопки auth через **`t(...)`**.

### Компоненты и страницы с `useTranslation`

- **`src/components/shared/AuthDialogs.tsx`**
- **`src/pages/boards/BoardsPage.tsx`**, **`src/pages/board/BoardPage.tsx`**, **`src/pages/settings/SettingsPage.tsx`**
- **`src/components/shared/BoardsRightSidebar.tsx`**, **`src/components/shared/BoardSettingsDialog.tsx`**
- **`src/components/kanban/Board.tsx`** (панель **`BoardAiBreakdownPanel`**), **`Column.tsx`**, **`ColumnFormDialog.tsx`**, **`TaskCard.tsx`**, **`TaskCardFormDialog.tsx`**

### Документация в репозитории

- **`docs/I18N.md`** — полное руководство по локализации (плюралы, новые ключи, исключения).
- **`docs/README.md`** — индекс всей пользовательской документации в `docs/`.
- **`README.md`** — секции **Documentation**, **Internationalization**, Venice; ссылки на **`docs/`**.

### Сводка дополнительных путей (i18n)

| Статус | Путь |
|--------|------|
| Новые | `docs/I18N.md`, **`docs/README.md`** |
| Изменены | `README.md`, `tsconfig.app.json`, `src/main.tsx`, `src/app/providers.tsx`, `package.json`, `package-lock.json` |
| Изменены (строки → `t`) | См. список компонентов выше |

---

## Venice AI breakdown и CORS

Подробно: **`docs/VENICE-BREAKDOWN.md`**, указатель документов: **`docs/README.md`**.

### Поведение

- Панель на доске: **`POST {"task":"..."}`**, ответ **`{ items: [...] }`**, последовательные вставки через **`createBoardTask`** в выбранную колонку (хук **`useVeniceBreakdownImport`**).
- Без **`VITE_VENICE_BREAKDOWN_URL`**: при **`npm run dev`** клиент дергает **`/api/venice/breakdown`** (прокси в **`vite.config.ts`**); при production-сборке — URL по умолчанию из кода или значение из env.
- Каталог **`workers/venice-cors-proxy`**: Worker с **`Access-Control-Allow-Origin: *`**, деплой через **`npx wrangler deploy`** (`wrangler.toml`, **`VENICE_UPSTREAM_URL`**).

### Сводка путей (Venice + прокси + документы)

| Статус | Путь |
|--------|------|
| Новые / расширены | `docs/VENICE-BREAKDOWN.md`, `docs/README.md`, **`workers/venice-cors-proxy/`** |
| Изменены | **`vite.config.ts`**, **`src/features/ai/api.ts`**, **`src/vite-env.d.ts`**, **`src/components/kanban/Board.tsx`**, **`src/locales/en.json`**, **`ru.json`**, **`.env.example`**, **`README.md`**, **`docs/I18N.md`** |
| Новые (UI / логика) | **`src/components/kanban/BoardAiBreakdownPanel.tsx`**, **`src/hooks/useVeniceBreakdownImport.ts`** |

