# TAKE REST (Bidda) — Complete System Architecture & AI Handover Guide

> **Important Note for AI Assistants**: This document serves as the single source of truth for the **Take Rest** web application. Reading this file provides complete, unambiguous context on the domain, data flow, database schema, folder layout, state management, and strict coding conventions.

---

## 1. Project Overview & Vision

**Take Rest** is an all-in-one personal productivity and life operating system (Life OS) tailored for Muslims and focused individuals. It integrates continuous time-tracking across a full 24-hour cycle with holistic personal management tools:

1. **Continuous 24-Hour Time Tracker**:
   - Categorized time logging (e.g., Deen, Academic, Work, Sleep, Rest, Others).
   - Real-time stopwatch / live timer surviving browser reload and network drops.
   - 24-Hour visual time-wheel and continuous timeline tracking with productive vs. wasted time distinction (`is_wasted`).
2. **Money Tracker (Takar Hisab / Finance)**:
   - Daily income and expense logs with custom categories (Food, Commute, Groceries, Tea, Utilities, Charity, etc.).
   - Visual breakdown charts, payment methods (Cash, bKash, Nagad, Bank), date filtering (Day, Week, Month, All-Time).
3. **Notes & Interactive Checklists (My Notes)**:
   - Quick capture of personal notes, ideas, study points, and interactive to-do checklists.
   - Interactive checkbox toggle directly on note cards, progress bar (% complete), card color theming, category tagging, pin-to-top, and search.
4. **Statistics & Analytics**:
   - Productive vs. wasted hours distribution, category-wise breakdowns, daily completion metrics.
5. **Authentication & User Profile**:
   - Supabase Authentication (Email/Password, Session recovery, Profile details).

---

## 2. Technology Stack

- **Frontend Core**: React 19 + TypeScript + Vite.
- **Routing**: React Router DOM v7 (`BrowserRouter`, lazy loading with route config).
- **Styling**: Tailwind CSS v4 + Vanilla CSS + Lucide React icons.
- **State & Server Cache**: TanStack React Query v5.
- **Database & Auth**: Supabase PostgreSQL + Supabase JS Client (`@supabase/supabase-js`).
- **Resilient Fallback**: LocalStorage-first fallback layer (if Supabase table is not yet migrated, the application works offline / locally seamlessly).
- **Form Handling & Notifications**: Sonner (toasts), Lucide-react (icons).

---

## 3. Directory & File Organization

Frontend/
├── public/ # Static public assets (icons, images)
├── sql_code_folder/ # SQL migrations to run in Supabase SQL editor
│ ├── 01_extensions_types.sql
│ ├── 02_tables.sql
│ ├── ...
│ ├── 08_finance.sql # Finance transactions schema & RLS
│ ├── 09_notes.sql # Notes & scratchpad schema & RLS
│ └── db_setup_master.sql # Complete master SQL combining all tables
├── src/
│ ├── app/ # Feature pages & route views
│ │ ├── activities/ # Category & activity management
│ │ ├── auth/ # Login & Register views
│ │ │ ├── login/
│ │ │ └── register/
│ │ ├── finance/ # Money / Expense tracker
│ │ │ ├── components/ # Overview cards, modals, timeline, charts
│ │ │ └── page.tsx
│ │ ├── home/ # 24h continuous tracker dashboard & timer
│ │ │ └── components/ # Circular timeline, timer controls, log list
│ │ ├── notes/ # Notes & scratchpad workspace
│ │ │ ├── components/ # NoteCard, NoteModal
│ │ │ └── page.tsx
│ │ ├── settings/ # User settings, profile, and preferences
│ │ ├── shared/ # Loading skeletons, 404 page
│ │ └── statistics/ # Analytics and visual charts
│ ├── config/
│ │ └── supabase.ts # Supabase client initialization & getActiveUserId()
│ ├── constants/
│ │ ├── index.ts
│ │ └── queryKeys.ts # TanStack Query keys registry (single source of truth)
│ ├── hooks/ # Custom React Query hooks (plural exported with as const)
│ │ ├── useAuth.ts
│ │ ├── useFinance.ts
│ │ ├── useNotes.ts
│ │ └── useTracker.ts
│ ├── layout/ # Layout wrappers
│ │ ├── MainContent.tsx # Animated route switch and suspense wrapper
│ │ ├── MobileTopNavbar.tsx # Mobile top navbar (Menu, Home, Finance, Notes, Settings)
│ │ └── Sidebar.tsx # Desktop sidebar & mobile drawer (Full navigation menu)
│ ├── routes/
│ │ ├── ProtectedRoute.tsx # Authentication gate
│ │ └── routeConfig.ts # Centralized routes array
│ ├── services/
│ │ └── supabase/ # Direct Supabase API services + fallback handling
│ │ ├── activities.supabase.ts
│ │ ├── auth.supabase.ts
│ │ ├── categories.supabase.ts
│ │ ├── finance.supabase.ts
│ │ ├── logs.supabase.ts
│ │ ├── notes.supabase.ts
│ │ └── timer.supabase.ts
│ ├── types/ # TypeScript interface definitions
│ │ ├── common.types.ts # ApiResponse, Pagination, ApiError
│ │ ├── finance.types.ts
│ │ ├── note.types.ts
│ │ ├── tracker.types.ts
│ │ ├── user.types.ts
│ │ └── index.ts
│ ├── App.tsx # Root layout, auth state listener, drawer state
│ └── main.tsx # React entry point with QueryClientProvider & BrowserRouter

---

## 4. Database Schema Summary (Supabase / PostgreSQL)

All SQL migration scripts live inside `sql_code_folder/`.

| Table Name     | Purpose                                             | Key Columns                                                                                                                                          |
| -------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`        | User profiles linked to `auth.users(id)`            | `id (UUID PK)`, `full_name`, `email`, `user_name`, `avatar`, `created_at`                                                                            |
| `categories`   | Tracking categories (Deen, Academic, etc.)          | `id`, `user_id`, `name`, `color`, `icon`, `is_system_default`, `sort_order`                                                                          |
| `activities`   | Activities under each category                      | `id`, `user_id`, `category_id`, `name`, `color`, `icon`, `sort_order`                                                                                |
| `time_logs`    | Completed time intervals for the 24h wheel          | `id`, `user_id`, `category_id`, `activity_id`, `start_time`, `end_time`, `duration_minutes`, `is_wasted`, `date`                                     |
| `active_timer` | Live timer state surviving page refreshes           | `user_id (PK)`, `activity_id`, `start_time`, `is_running`, `elapsed_seconds`                                                                         |
| `notes`        | Personal notes, scratchpad & interactive checklists | `id`, `user_id`, `title`, `content`, `note_type`, `checklist_items (JSONB)`, `color`, `is_pinned`, `is_archived`, `tags`, `created_at`, `updated_at` |

### Security & Row Level Security (RLS)

- Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- Strict RLS policies restrict operations to `auth.uid() = user_id`.
- Triggers auto-update `updated_at` on modification via `public.set_updated_at()`.

---

## 5. Strict Coding Rules & Patterns (Mandatory for all AIs)

### 1. Service File Convention (`src/services/supabase/*.ts`)

- **Naming**: The export object MUST always be named in **plural** form (e.g. `noteServices`, `financeServices`, `authServices`).
- **No inline definitions**: Do NOT define functions inline in an object. Define individual `const myFunc = async () => ...` arrow functions first.
- **Mandatory `as const`**: Group them into a single object and append `as const`:

  ```ts
  const noteServices = {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
  } as const; // <-- MANDATORY

  export default noteServices;
  ```

- **Offline / Local Fallback**: Catch Supabase errors when tables might not be provisioned yet and persist/read from `localStorage` under a user-keyed prefix (`takerest_notes_store_${userId}`). This ensures the app never shows a broken white screen.

### 2. Hook File Convention (`src/hooks/*.ts`)

- Group all hooks into a single plural-named object (e.g. `noteHooks`, `financeHooks`) with `as const` and default export:

  ```ts
  const noteHooks = {
    useNotes,
    useCreateNote,
    useUpdateNote,
  } as const; // <-- MANDATORY

  export default noteHooks;
  ```

- **Explicit Generics**: Always specify explicit generics to `useQuery` and `useMutation`:

  ```ts
  useQuery<ApiResponse<{ notes: Note[] }>>({ ... });
  useMutation<ApiResponse<{ note: Note }>, Error, CreateNotePayload>({ ... });
  ```

- **Query Keys**: Never hardcode query key strings directly. Always reference `src/constants/queryKeys.ts` (e.g., `NOTE_KEYS.NOTES`).
- **Hook Destructuring in Components**: Always destructure immediately:

  ```tsx
  const { notes, isLoading } = noteHooks.useNotes();
  const { mutate: createNote } = noteHooks.useCreateNote();
  ```

### 3. Absolute Alias Imports

- Inside `src/`, always use `@/` alias imports (e.g. `@/hooks/useNotes`, `@/layout/Sidebar`). Avoid deep relative paths like `../../../`.

### 4. Navigation Rules

- **Desktop**: Left vertical sidebar (`Sidebar.tsx`) with full navigation: Home, Finances, Notes, Statistics, Activities, Settings.
- **Mobile Top Navbar (`MobileTopNavbar.tsx`)**:
  - `Menu` (Hamburger button to toggle drawer containing all routes).
  - `Home` (`/`)
  - `Finance` (`/finance`)
  - `Notes` (`/notes`)
  - `Settings` (`/settings`)
  - Note: `Activities` and `Statistics` are accessible from the burger menu drawer on mobile.

---

## 6. How to Run SQL in Supabase

When deploying or syncing the database with a fresh or existing Supabase project:

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the specific migration (e.g., `sql_code_folder/09_notes.sql` or `08_finance.sql`).
3. Or, for a completely fresh project, run `sql_code_folder/db_setup_master.sql`.

---

## 7. Future Extension Checklist

When adding a new feature (e.g., Habits, Goals, Quran Tracker):

1. **Types**: Add interface definitions in `src/types/<feature>.types.ts` and export from `src/types/index.ts`.
2. **Constants**: Register query keys in `src/constants/queryKeys.ts`.
3. **SQL**: Create `sql_code_folder/10_<feature>.sql` with table, indexes, RLS, trigger, and update `db_setup_master.sql`.
4. **Service**: Create `src/services/supabase/<feature>.supabase.ts` with plural export + `as const` + localStorage fallback.
5. **Hook**: Create `src/hooks/use<Feature>.ts` with plural export + `as const`.
6. **Page & Route**: Create `src/app/<feature>/page.tsx` and register in `src/routes/routeConfig.ts`.
7. **Navigation**: Add link to `Sidebar.tsx` (and `MobileTopNavbar.tsx` if prioritized).
