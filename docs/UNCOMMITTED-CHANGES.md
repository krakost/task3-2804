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
