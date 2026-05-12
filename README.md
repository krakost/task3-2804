# Task 3 — Frontend skeleton

Stack: React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui, Supabase JS, Lucide.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when you connect a Supabase project.

Optional **`VITE_VENICE_BREAKDOWN_URL`**: splits a written task into board cards via a Worker (**[docs/VENICE-BREAKDOWN.md](./docs/VENICE-BREAKDOWN.md)**).

## Documentation

Overview of Markdown guides: **[docs/README.md](./docs/README.md)** (i18n, Venice / CORS, `.env`, optional Worker gateway).

## Internationalization (RU / EN)

The UI is localized with **i18next** and **react-i18next**. Translation files: `src/locales/en.json` and `src/locales/ru.json`. Language is chosen from `localStorage` (`preferred-locale`) or from the browser (`ru*` → Russian, else English). A language selector lives in the app header (**`AppLayout`**).

See **[docs/I18N.md](./docs/I18N.md)** for architecture, key namespaces, pluralization, and how to add new strings.

## Structure

See `.cursor/rules/PROJECT-RULE.mdc` — `src/` includes `app/` (router, providers), `pages/`, `components/` (ui, shared, kanban), `features/`, `hooks/`, `lib/`, `store/`, and `types/`. Human-written guides live under **`docs/`** (**[docs/README.md](./docs/README.md)**); optional **`workers/`** hosts the Venice CORS proxy Worker.
