# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rastaflix is a Next.js 15 application built with TypeScript, Clerk authentication, and Supabase database. The app is a content management platform featuring stories, music, "esculachos" (roasts), enemies list, a bingo game, and a wordle-like game ("Ovelhera DLE"). It uses React 19 with the App Router architecture.

## Development Commands

```bash
# Run development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint the codebase
npm run lint
```

## Architecture Overview

### Authentication & Authorization

- **Clerk** handles authentication with role-based access control
- Admin status is stored in Clerk's `privateMetadata.is_admin`
- Admin verification happens in two ways:
  1. Server-side: `verificarAdmin()` and `ensureAdmin()` in [src/actions/commonActions.ts](src/actions/commonActions.ts)
  2. Client-side: API route at [src/app/api/check-admin/route.ts](src/app/api/check-admin/route.ts)
- Admin-only pages redirect unauthorized users to home

### Database Integration

- **Supabase** is the primary database
- Supabase client creation happens in [src/actions/commonActions.ts](src/actions/commonActions.ts) via `getSupabaseClient()`
- Authentication tokens from Clerk are passed to Supabase for RLS (Row Level Security)
- Server Actions handle all database operations (no client-side database calls)

### Data Flow Pattern

1. **Server Actions** (`src/actions/*.ts`) contain all database logic
2. **Zod schemas** (`src/lib/types.ts`) validate form data
3. **React Hook Form** handles form state
4. **TanStack Query** manages client-side data fetching and caching (5 min stale time, 1 hour GC)
5. **Server Components** fetch data directly in pages when needed

### Content Types

The app manages four main content types with similar patterns:

1. **Stories** (`historias`) - Video/content links with tags
2. **Music** (`musicas`) - Music video links
3. **Esculachos** - Text-based roasts/rants
4. **Inimigos** (Enemies) - List with status tracking (pendente/vingado)

Each type follows the pattern:
- Public view page in `src/app/[type]/page.tsx`
- Admin management page in `src/app/admin/[type]/page.tsx`
- Server actions in `src/actions/[type]Actions.ts`
- Components in `src/components/[type]/` and `src/components/admin/`
- Type definitions and schemas in `src/lib/types.ts`

### Theme System

- **next-themes** provides theme switching with custom themes
- Available themes: light, dark, system, vercel, cosmic, tangerine, maconha
- Default theme is "dark"
- Theme switcher in [src/components/theme/ThemeSwitcher.tsx](src/components/theme/ThemeSwitcher.tsx)
- Global styles in [src/app/globals.css](src/app/globals.css)

### UI Components

- **shadcn/ui** components in `src/components/ui/`
- **Radix UI** primitives for accessibility
- **Tailwind CSS v4** for styling with custom configuration
- **Lucide React** for icons
- **Motion** (Framer Motion) for animations

### Special Features

#### Bingo Game
- Client-side state persistence using localStorage
- Card flip animations with Motion
- Located in [src/components/bingo/Bingo.tsx](src/components/bingo/Bingo.tsx)
- Data in [src/data/bingo.ts](src/data/bingo.ts)

#### Ovelhera DLE
- Wordle-like emoji guessing game
- Game data in [src/data/dle.ts](src/data/dle.ts)
- Components in `src/components/dle/`

### Image Handling

- Next.js Image component with remote patterns enabled
- Allows all HTTPS origins (security consideration for production)
- Unoptimized images in production (see [next.config.ts](next.config.ts))
- Common sources: YouTube thumbnails, GitHub avatars

### File Structure

```
src/
├── actions/          # Server Actions for database operations
├── app/              # Next.js App Router pages
│   ├── admin/        # Admin-only pages
│   ├── api/          # API routes
│   └── [feature]/    # Public feature pages
├── components/       # React components
│   ├── admin/        # Admin-specific components
│   ├── provider/     # Context providers
│   ├── theme/        # Theme components
│   ├── ui/           # shadcn/ui components
│   └── [feature]/    # Feature-specific components
├── data/             # Static data files
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities and types
└── utils/            # Utility functions
```

## Important Conventions

### Server Actions

- All actions are marked with `"use server"`
- Return type is typically `ActionResponse` or feature-specific response interface
- Always use `ensureAdmin()` for admin-only operations
- Validation happens with Zod schemas before database operations

### Form Patterns

1. Define Zod schema in `src/lib/types.ts`
2. Use `react-hook-form` with `@hookform/resolvers/zod`
3. Submit to Server Action
4. Handle response with toast notifications (sonner)
5. Invalidate TanStack Query cache on success

### Component Patterns

- Server Components by default
- Add `"use client"` only when needed (hooks, interactivity, browser APIs)
- Client components are in: Header, providers, forms, interactive features
- Use `Suspense` boundaries for async components when appropriate

## Environment Variables

Required variables (see [.env.local](.env.local)):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
```

## Path Aliases

TypeScript is configured with `@/*` alias mapping to `src/*`

## Analytics

Vercel Analytics is integrated in the root layout
