# Project Overview — `blogwebsite`

This repo is a Next.js (App Router) blog platform with a Firebase backend (Auth, Firestore, Storage) and a built-in admin CMS. It supports SEO-friendly public pages (server-rendered where possible) and a client-side admin panel for content management.

Related docs:
- `README.md` (setup + env vars)
- `docs/FIREBASE_SETUP.md` (Firebase console + rules/indexes + service account)
- `docs/BLOG_PLATFORM_TRD.md` (technical requirements summary)
- `blog-platform-spec.md` (product spec)

---

## 1) Tech Stack

- **Framework:** Next.js `16.2.3` (App Router), React `19`
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS v4 + `@tailwindcss/typography` (see `src/app/globals.css`)
- **Firebase (client):** `firebase` Web SDK (Auth, Firestore, Storage)
- **Firebase (server):** `firebase-admin` (Firestore) when `FIREBASE_SERVICE_ACCOUNT_KEY` is configured
- **Forms/Validation:** `react-hook-form` + `zod`
- **Markdown:** `react-markdown` + `remark-gfm`, code highlighting via `react-syntax-highlighter`
- **Email:** Resend via `fetch()` from `src/app/api/contact/route.ts`
- **Deploy:** Vercel (`vercel.json`) and/or Firebase App Hosting (`apphosting.yaml`, `firebase.json`)

---

## 2) High-Level Architecture

### Runtime split (important)

- **Public site pages** are mostly **Server Components** that read Firestore via the **Admin SDK** (`src/lib/posts-server.ts`).  
  - If `FIREBASE_SERVICE_ACCOUNT_KEY` is **missing**, these server reads become no-ops and return empty results (the UI shows a helpful message on `/`).
- **Admin pages** are **Client Components** that read/write Firestore and Storage directly via the **Firebase Web SDK** (`src/lib/firebase.ts`).

### Data flow diagram (simplified)

```mermaid
flowchart LR
  subgraph Browser
    A[Public pages] -->|navigate| N[Next.js App Router]
    ADM[Admin UI (/admin/*)] -->|Firebase Web SDK| FS[(Firestore)]
    ADM -->|Firebase Web SDK| ST[(Storage)]
  end

  subgraph Server
    N -->|Server Components| PS[src/lib/posts-server.ts]
    PS -->|firebase-admin| FS
    API[/api/contact/] -->|Resend API| R[Resend]
    API -->|optional: admin SDK| FS
  end
```

---

## 3) Repository Layout

Top-level:

- `src/app/` — Next.js routes (public + admin + API)
- `src/components/` — UI components (admin, blog, layout, common)
- `src/lib/` — Firebase wiring, server data access, helpers
- `src/hooks/` — `useAuth`, `useTheme` providers/hooks
- `src/types/` — shared TypeScript types for Firestore documents
- `src/utils/` — formatting, read time, slugify, truncate
- `docs/` — additional documentation
- `firestore.rules`, `storage.rules`, `firestore.indexes.json` — Firebase security/rules/indexes (currently placeholder/unsafe; see “Security”)
- `apphosting.yaml`, `firebase.json` — Firebase App Hosting and Firebase project config
- `vercel.json` — Vercel build settings

---

## 4) Routes and Features

### Public (site) routes (`src/app/(site)/*`)

- `/` — Home page; paginated published posts + category list (`src/app/(site)/page.tsx`)
- `/blog/[slug]` — Post detail + JSON-LD + related posts (`src/app/(site)/blog/[slug]/page.tsx`)
- `/category/[slug]` — Category listing with pagination (`src/app/(site)/category/[slug]/page.tsx`)
- `/search` — Server-side search (loads up to 200 latest published posts, filters in memory) (`src/app/(site)/search/page.tsx`)
- `/about` — Markdown page from Firestore `pages/about` (`src/app/(site)/about/page.tsx`)
- `/contact` — Markdown page from Firestore `pages/contact` + optional form (`src/app/(site)/contact/page.tsx`)

### Admin routes (`src/app/admin/*`)

All admin routes (except `/admin/login`) require a signed-in Firebase Auth user:

- `/admin/login` — Email/password sign-in + password reset (`src/app/admin/login/page.tsx`)
- `/admin` — Dashboard stats + recent posts (`src/app/admin/page.tsx`)
- `/admin/posts` — List/filter/bulk-delete posts (`src/app/admin/posts/page.tsx`)
- `/admin/posts/new` — Create post (`src/app/admin/posts/new/page.tsx`)
- `/admin/posts/edit/[id]` — Edit post (`src/app/admin/posts/edit/[id]/page.tsx`)
- `/admin/categories` — CRUD categories with “cannot delete if used” check (`src/app/admin/categories/page.tsx`)
- `/admin/pages` — Edit About/Contact markdown + contact settings (`src/app/admin/pages/page.tsx`)
- `/admin/media` — Upload media to Storage + store metadata in Firestore `media` (`src/app/admin/media/page.tsx`)
- `/admin/settings` — Site identity + author profile + email defaults (`src/app/admin/settings/page.tsx`)

### API routes (`src/app/api/*`)

- `POST /api/contact` — Validates body with Zod; resolves recipient from Firestore or env; sends via Resend (`src/app/api/contact/route.ts`)
- `GET /api/debug/posts` — Debug endpoint showing Admin SDK initialization and basic query stats (`src/app/api/debug/posts/route.ts`)

### SEO / metadata routes (`src/app/*`)

- `sitemap.xml` — Includes published posts + categories + static pages (requires Admin SDK for dynamic entries) (`src/app/sitemap.ts`)
- `robots.txt` — Disallows `/admin/` and `/api/` (`src/app/robots.ts`)
- `not-found` — Global and `(site)` scoped (`src/app/not-found.tsx`, `src/app/(site)/not-found.tsx`)

---

## 5) Firebase Setup and Environment Variables

Reference: `README.md`, `docs/FIREBASE_SETUP.md`, `.env.example`.

### Required (typical local dev)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_SITE_URL` (canonical base URL; used in metadata + share links + sitemap)

### Server-only (recommended for SEO/features)

- `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON string (single line) used by `firebase-admin`
  - Enables server-side post listing/search/sitemap generation.
  - Must never be committed. Note: the repo currently contains a `*-firebase-adminsdk-*.json` file in the root; `.gitignore` would ignore new ones, but an already-committed key is still a secret exposure risk.

### Contact/email

- `EMAIL_API_KEY` — Resend API key (used in `/api/contact`)
- `RESEND_FROM_EMAIL` — verified sender
- `CONTACT_EMAIL` — fallback recipient if Firestore settings aren’t configured

### Firebase App Hosting

- `apphosting.yaml` wires env vars and defines `FIREBASE_SERVICE_ACCOUNT_KEY` as a secret for build/runtime.

---

## 6) Firestore Data Model (as implemented)

Firestore collections used by the app:

### `posts` (document id = generated UUID)

Used by both admin UI (client) and public pages (server).

Common fields (see `src/types/post.ts` and `src/components/admin/PostEditor.tsx`):
- `title: string`
- `slug: string` (unique; enforced by app-level query check)
- `content: string` (Markdown)
- `excerpt: string` (computed from content)
- `featuredImage: { url: string; alt: string; storagePath: string }`
- `category: string` (category document id)
- `status: "draft" | "published"`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `publishedAt?: Timestamp` (set on first publish)
- `author: { name: string; email: string }`

Queries:
- Home: `where(status=="published")` + `orderBy(publishedAt desc)` + pagination via `offset/limit`
- Category: `where(status=="published")` + `where(category==<id>)` + `orderBy(publishedAt desc)` + pagination
- Post page: `where(slug==<slug>)` then filter `status=="published"`

### `categories`

Fields (see `src/types/category.ts`, `src/app/admin/categories/page.tsx`):
- `name: string`
- `slug: string` (derived from name)
- `description: string`
- `createdAt: Timestamp`

### `pages` (document ids: `about`, `contact`)

Fields (see `src/types/page-doc.ts`, `src/app/admin/pages/page.tsx`):
- `pages/about`: `content`, `updatedAt`
- `pages/contact`: `content`, `formEnabled`, `recipientEmail`, `updatedAt`

### `settings` (document id: `site`)

Fields (see `src/types/settings.ts`, `src/app/admin/settings/page.tsx`):
- `title`, `description`
- `logo`, `favicon` (public URLs)
- `author: { name, email, bio, profilePicture }`
- `contactRecipientEmail`
- `updatedAt`

### `media` (optional library)

Fields (see `src/types/media.ts`, `src/app/admin/media/page.tsx`):
- `url`, `storagePath`, `filename`, `contentType`, `size`, `createdAt`

---

## 7) Storage Conventions

Storage paths used by the admin UI:

- Featured images: `images/featured/<postId>/featured.<ext>` (`src/components/admin/FeaturedImageField.tsx`)
- Inline images in Markdown: `images/inline/<postId>/<timestamp>-<filename>` (`src/components/admin/PostEditor.tsx`)
- Media library:
  - Images: `images/library/<timestamp>-<filename>`
  - Videos: `videos/library/<timestamp>-<filename>` (`src/app/admin/media/page.tsx`)
- Site assets:
  - `images/site/logo.<ext>`
  - `images/site/favicon.<ext>`
  - `images/site/author-profile.<ext>` (`src/app/admin/settings/page.tsx`)

`next.config.ts` allows `next/image` to load from Firebase Storage hosts via `images.remotePatterns`.

---

## 8) Key Modules and Patterns

### Firebase client initialization (browser-only)

`src/lib/firebase.ts`:
- Explicitly throws on the server (`typeof window === "undefined"`)
- Admin UI and other client components call:
  - `getFirebaseAuth()`
  - `getFirebaseDb()`
  - `getFirebaseStorage()`

### Firebase Admin SDK (server-only)

`src/lib/firebase-admin.ts`:
- Parses `process.env.FIREBASE_SERVICE_ACCOUNT_KEY` as JSON
- Caches the initialized Admin app in-module
- Exposes `getAdminDb()` which returns `Firestore | null`

### Server data layer for public pages

`src/lib/posts-server.ts` (`import "server-only"`):
- Maps Firestore docs into typed objects (`Post`, `Category`) and converts timestamps to ISO strings (`src/lib/serialize.ts`)
- Primary helpers:
  - `getPublishedPostsPage()`
  - `getPostBySlugPublic()`
  - `getRelatedPosts()`, `getRecentPublishedPosts()`
  - `getPostsByCategorySlug()`, `getAllCategories()`
  - `getSiteSettingsServer()`, `getPageDocServer()`
  - `getAllPublishedSlugs()` (used for `generateStaticParams`)
  - `searchPublishedPosts()` (simple substring search; loads up to 200 posts)

### Auth gating (admin)

- `src/components/providers/AppProviders.tsx` wraps the app with:
  - `ThemeProvider` (`src/hooks/useTheme.tsx`)
  - `AuthProvider` (`src/hooks/useAuth.tsx`)
- `src/components/admin/AdminGate.tsx`:
  - Allows `/admin/login` without auth
  - Wraps everything else in `RequireAuth`
- `src/components/admin/RequireAuth.tsx` redirects to `/admin/login` if not signed in

### Markdown rendering

- Preview/editor: `src/components/admin/MarkdownEditor.tsx` (write/split/preview)
- Rendering: `src/components/blog/MarkdownBody.tsx`
  - Uses `remark-gfm`
  - Syntax highlighting for fenced code blocks
  - Uses plain `<img>` for markdown images (avoids `next/image` for arbitrary URLs)

### Theme (dark mode)

- `src/hooks/useTheme.tsx` persists `theme` in `localStorage` and toggles `.dark` on `<html>`
- `src/app/layout.tsx` injects an early script to set theme before hydration (reduces flicker)
- Tailwind v4 uses CSS variables via `@theme inline` (`src/app/globals.css`)

---

## 9) Rendering, Caching, and SEO Notes

- Home page explicitly forces dynamic rendering:
  - `export const revalidate = 0` and `export const dynamic = "force-dynamic"` in `src/app/(site)/page.tsx`
- Blog post page:
  - `generateStaticParams()` uses `getAllPublishedSlugs()` for pre-rendering when possible
  - `dynamicParams = true` allows on-demand rendering when slugs aren’t known at build time
- About/Contact pages use `revalidate = 3600` (1 hour) to cache content reads.
- Sitemap:
  - Always emits the base URL
  - Adds post/category URLs only if Admin SDK is configured (`src/app/sitemap.ts`)
- `NEXT_PUBLIC_SITE_URL` is used for canonical URLs and share links; set it in prod.

---

## 10) Security (Current State and Expectations)

### Current repo state

`firestore.rules` and `storage.rules` currently contain the default “open” rules that expire on **May 9, 2026**:
- `allow read, write: if request.time < timestamp.date(2026, 5, 9);`

This is not production-safe. It’s intended as a temporary bootstrap.

### Expected target security model (per TRD)

- Public read:
  - Published posts, categories, pages, settings
- Authenticated write:
  - All admin-managed collections (posts/categories/pages/settings/media)

If you implement secure rules, verify that:
- Admin UI writes still succeed with your chosen Auth model
- Public pages can still read what they need (either via Admin SDK on server, or via client SDK + rules)

---

## 11) Local Development and Scripts

Commands (from `package.json`):

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — ESLint

---

## 12) “Where do I implement X?” (Feature Implementation Pointers)

### Add a new public page (static or Firestore-backed)

- Route file: `src/app/(site)/<route>/page.tsx`
- If you need server data:
  - Add a helper in `src/lib/posts-server.ts` (or a new `*-server.ts` module) that uses `getAdminDb()`
  - Decide caching via `export const revalidate = ...` or dynamic rendering
- UI building blocks: `src/components/layout/*`, `src/components/common/*`, `src/components/blog/*`

### Add a new admin section (CRUD over a new collection)

- Route file: `src/app/admin/<feature>/page.tsx` (client component)
- Use Web SDK helpers from `src/lib/firebase.ts`:
  - Firestore reads/writes (`firebase/firestore`)
  - Storage uploads (`firebase/storage`) if needed
- Add nav link in `src/components/admin/AdminNav.tsx`

### Add a new server API endpoint

- Route handler: `src/app/api/<name>/route.ts`
- Use `zod` for validation (pattern in `/api/contact`)
- If Firestore access is needed server-side, prefer `firebase-admin` via `getAdminDb()`

### Extend the data model

- Add/extend types in `src/types/*`
- Update server mappers in `src/lib/posts-server.ts` (if used in public pages)
- Update admin forms/pages to write the new fields
- Consider required Firestore indexes for new queries (`firestore.indexes.json`)

### SEO changes

- Per-page metadata: `generateMetadata` in the route file
- Global defaults: `src/app/layout.tsx` and `src/app/(site)/layout.tsx`
- Sitemap: update `src/app/sitemap.ts`

---

## 13) Known Limitations / Scaling Considerations

- `searchPublishedPosts()` loads up to 200 posts and filters in memory; not suitable for large datasets or advanced search.
- Pagination on server uses Firestore `offset()`, which can become slow/expensive on deeper pages.
- Current Firestore/Storage rules are placeholder and must be replaced before production use.
- `GET /api/debug/posts` is a helpful dev tool but is not typically desirable in production.

