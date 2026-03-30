# CLAUDE.md — SoloShot Agent Working Guidelines

> This file governs how Claude agents work on the SoloShot project.
> Read this before touching any file. Follow all rules without exception.

---

## Project Overview

**SoloShot** is a React Native (Expo) mobile app that generates full-body travel photos from selfies using AI image generation.

- **Owner:** Jimmy
- **Stack:** Expo (React Native) + Supabase (Edge Functions + Storage) + Replicate API
- **Phase:** MVP (Phase 1 — Replicate API)
- **PRD:** See `PRD.md` for full requirements

---

## Core Principles

1. **Minimal footprint** — only change files relevant to the current task
2. **No surprises** — never refactor, rename, or restructure unless explicitly asked
3. **Ask before inventing** — if requirements are ambiguous, ask; don't assume
4. **Test before declaring done** — run type checks and linting before marking any task complete
5. **One task at a time** — complete and verify each task fully before moving to the next

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile framework | Expo (React Native) | SDK 52+ |
| Navigation | Expo Router | v4 |
| Language | TypeScript | strict mode |
| Styling | NativeWind (Tailwind for RN) | v4 |
| State management | Zustand | latest |
| Backend / DB | Supabase | latest |
| AI generation | Replicate API | latest |
| Package manager | pnpm | v9+ |

---

## Project Structure

```
soloshot/
├── PRD.md
├── CLAUDE.md                        ← this file
├── README.md
├── app/                             ← Expo Router pages (screens)
│   ├── (tabs)/
│   │   ├── index.tsx                ← Home / camera entry
│   │   ├── gallery.tsx              ← Generated image gallery
│   │   └── settings.tsx             ← Reference image management
│   ├── generate.tsx                 ← Generation flow
│   ├── preview.tsx                  ← Result preview
│   └── _layout.tsx                  ← Root layout
├── components/                      ← Reusable UI components
│   ├── CameraCapture.tsx
│   ├── ReferenceUploader.tsx
│   ├── StyleSelector.tsx
│   ├── ResultCarousel.tsx
│   └── ImageCard.tsx
├── lib/                             ← External service wrappers
│   ├── replicate.ts                 ← Replicate API client
│   ├── supabase.ts                  ← Supabase client
│   └── imageUtils.ts                ← Image compression / base64
├── store/
│   └── useGenerationStore.ts        ← Zustand global state
├── supabase/
│   └── functions/
│       └── generate/
│           └── index.ts             ← Edge Function: calls Replicate
├── constants/
│   └── index.ts                     ← App-wide constants
├── assets/
├── .env.local                       ← Environment variables (never commit)
└── package.json
```

---

## Environment Variables

Store all secrets in `.env.local`. Never hardcode keys in source files.

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Edge Functions only, never expose to client

# Replicate
REPLICATE_API_TOKEN=              # Edge Functions only, never expose to client
```

**Rules:**
- `EXPO_PUBLIC_` prefix = safe for client bundle
- Never expose `REPLICATE_API_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` to the client
- Always call Replicate through the Supabase Edge Function, never directly from the app

---

## Coding Standards

### TypeScript
- Strict mode is always on — no `any`, no `@ts-ignore`
- Define interfaces and types in the same file as their first use, unless shared across 3+ files (then move to `types/`)
- Always type function return values explicitly

### Components
- Functional components only — no class components
- One component per file
- File name = component name (PascalCase)
- Props interface defined directly above the component

```typescript
// ✅ Correct
interface ImageCardProps {
  uri: string
  onPress: () => void
}

export function ImageCard({ uri, onPress }: ImageCardProps) { ... }

// ❌ Wrong
export default function ({ uri, onPress }: any) { ... }
```

### Imports
- Absolute imports using `@/` alias (configured in `tsconfig.json`)
- Order: React → React Native → Expo → third-party → internal (`@/`)
- No default exports except for Expo Router screens

```typescript
import { useState } from 'react'
import { View, Text } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useGenerationStore } from '@/store/useGenerationStore'
```

### State Management
- Zustand for global state (generation status, reference images, results)
- Local `useState` for UI-only state (modal open/close, input values)
- Never store derived data in the store — compute it inline

### Error Handling
- All async functions must have try/catch
- Surface errors to the user via a toast or inline error message — never silent failures
- Log errors with context: `console.error('[ComponentName] action failed:', error)`

---

## API Integration Rules

### Replicate (via Edge Function only)
- The mobile app **never** calls Replicate directly
- All generation requests go through `supabase/functions/generate/`
- Poll for results using Replicate's prediction status endpoint
- Timeout after 120 seconds; surface error to user

### Supabase Edge Function
- Keep functions stateless
- Validate all inputs before calling Replicate
- Return structured JSON: `{ success: boolean, urls?: string[], error?: string }`

### Image Handling
- Compress all images before upload: max 1024px on the long edge, JPEG quality 85
- Never store base64 images in Zustand — store URIs only
- Reference images stored in Supabase Storage bucket: `reference-images/`
- Generated images stored in: `generated-images/`

---

## File Rules

| File / Directory | Rule |
|---|---|
| `PRD.md` | Never modify |
| `CLAUDE.md` | Never modify unless instructed by owner |
| `.env.local` | Never commit, never log contents |
| `supabase/functions/` | No client-side Supabase SDK imports |
| `app/_layout.tsx` | Only modify for root-level providers |
| `lib/replicate.ts` | Only called from Edge Functions |

---

## Git & Commit Rules

- Commit message format: `type(scope): description`
- Types: `feat` / `fix` / `chore` / `refactor` / `docs` / `test`
- Scope = file or feature area, e.g. `feat(generate): add style selector`
- Keep commits atomic — one logical change per commit
- Never commit: `.env.local`, `node_modules/`, generated build files

```bash
# ✅ Good
feat(camera): add front-facing camera capture component
fix(replicate): handle timeout on prediction polling
chore(deps): upgrade expo-image-picker to v15

# ❌ Bad
update stuff
WIP
fix
```

---

## Task Completion Checklist

Before marking any task done, verify:

- [ ] TypeScript compiles without errors: `pnpm tsc --noEmit`
- [ ] No ESLint errors: `pnpm lint`
- [ ] New components have defined prop types
- [ ] No hardcoded API keys or secrets
- [ ] Error states are handled and surfaced to the user
- [ ] New files follow the naming and structure conventions above

---

## MVP Scope Reminder

Only build what is in the MVP column of PRD.md. Do not implement future `(+)` requirements unless explicitly instructed by the owner. When in doubt, do less and confirm.
