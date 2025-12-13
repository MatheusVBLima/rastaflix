# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rastaflix is a Next.js 15 application built with TypeScript, Clerk authentication, and Supabase database. The app is a content management platform featuring stories, music, "esculachos" (roasts), enemies list, a bingo game, a wordle-like game ("Ovelhera DLE"), and Rasta Awards voting system. It uses React 19 with the App Router architecture.

## Development Commands

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run lint     # Lint codebase
```

## Architecture Overview

### Authentication & Authorization

- **Clerk** handles authentication with role-based access control
- Admin status stored in Clerk's `privateMetadata.is_admin`
- Server-side admin check: `ensureAdmin()` in [src/actions/commonActions.ts](src/actions/commonActions.ts)
- Client-side admin check: API route at [src/app/api/check-admin/route.ts](src/app/api/check-admin/route.ts)

### Database Integration

- **Supabase** is the primary database
- Supabase client via `getSupabaseClient()` in [src/actions/commonActions.ts](src/actions/commonActions.ts)
- Clerk tokens passed to Supabase for RLS
- All database operations happen through Server Actions

### Data Flow Pattern

1. **Server Actions** (`src/actions/*.ts`) - database logic
2. **Zod schemas** (`src/lib/types.ts`) - form validation
3. **React Hook Form** - form state management
4. **TanStack Query** - client caching (5 min stale, 1 hour GC, no refetch on window focus)

### Data Fetching & Prefetch Patterns

**Server-side prefetch with hydration** (used in pages like [src/app/historias/page.tsx](src/app/historias/page.tsx)):
- Create `QueryClient` in Server Component with `staleTime: Infinity`
- Use `prefetchQuery` to fetch data server-side
- Wrap Client Component with `HydrationBoundary` + `dehydrate(queryClient)`
- Client receives pre-populated cache, no loading flash

**Route prefetch on hover** (used in [src/components/Header.tsx](src/components/Header.tsx)):
- `router.prefetch(href)` called on `onMouseEnter` and `onFocus`
- Navigation links pre-load before click for instant transitions

### Content Types

Five main content types follow the same pattern:
- **Stories** (`historias`) - Video/content links with tags
- **Music** (`musicas`) - Music video links
- **Esculachos** - Text-based roasts
- **Inimigos** (Enemies) - Status tracking (pendente/vingado)
- **Rasta Awards** - Voting system with seasons, categories, and nominees

Pattern for each type:
- Public page: `src/app/[type]/page.tsx`
- Admin page: `src/app/admin/[type]/page.tsx`
- Actions: `src/actions/[type]Actions.ts`
- Types/schemas: `src/lib/types.ts`

### Theme System

- **next-themes** with custom themes: light, dark, system, vercel, cosmic, tangerine, maconha
- Default: "dark"
- Config in [src/components/theme/ThemeSwitcher.tsx](src/components/theme/ThemeSwitcher.tsx)

### UI Stack

- **shadcn/ui** + **Radix UI** for components
- **Tailwind CSS v4**
- **Lucide React** for icons
- **Motion** (Framer Motion) for animations
- **sonner** for toast notifications

### Special Features

- **Bingo Game**: localStorage persistence, Motion animations - [src/components/bingo/Bingo.tsx](src/components/bingo/Bingo.tsx)
- **Ovelhera DLE**: Wordle-like emoji game - `src/components/dle/`

## Important Conventions

### Server Actions

- Mark with `"use server"`
- Use `ensureAdmin()` for admin operations
- Return `ActionResponse` or feature-specific response interface
- Validate with Zod before database operations

### Form Patterns

1. Zod schema in `src/lib/types.ts`
2. `react-hook-form` with `@hookform/resolvers/zod`
3. Submit to Server Action
4. Toast notifications via sonner
5. Invalidate TanStack Query on success

### Component Patterns

- Server Components by default
- `"use client"` only when needed (hooks, interactivity)

## Analytics & PostHog Integration

- **Vercel Analytics** in root layout
- **PostHog** for analytics with proxy rewrites in [next.config.ts](next.config.ts)

### PostHog Rules

- Never hallucinate API keys - use values from `.env`
- Feature flags: Use in as few places as possible. Store flag names in an enum (TypeScript) or const object with `UPPERCASE_WITH_UNDERSCORE` naming
- Custom properties: If referenced in 2+ places, store names in enum/const object
- Before creating event/property names, check for existing naming conventions

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

## Path Aliases

`@/*` maps to `src/*`
