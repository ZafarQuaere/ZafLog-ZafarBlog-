# Technical Requirements Document – Blog Platform

This document mirrors the approved implementation plan for the blog platform (Next.js, Firebase, Tailwind, Vercel). The canonical product spec remains [blog-platform-spec.md](../blog-platform-spec.md).

## 1. Architecture

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Email:** Resend or SendGrid via server route (`/api/contact`)
- **Hosting:** Vercel

## 2. Data model (Firestore)

- **posts:** title, slug, content, excerpt, featuredImage, category (id), status, timestamps, author
- **categories:** name, slug, description, createdAt
- **pages:** document id `about` | `contact` – content, updatedAt; contact may include `formEnabled`, `recipientEmail`
- **settings:** document id `site` – site title/description, logo, favicon, author profile, email settings
- **media (optional):** `media` collection for library metadata (path, url, createdAt, dimensions)

## 3. Routes

**Public:** `/`, `/blog/[slug]`, `/category/[slug]`, `/about`, `/contact`, `/search`  
**Admin:** `/admin`, `/admin/login`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/edit/[id]`, `/admin/categories`, `/admin/pages`, `/admin/media`, `/admin/settings`

## 4. Security

- Firestore/Storage rules: public read for published posts, categories, pages, settings; writes only when `request.auth != null`
- Secrets only in server env (`EMAIL_API_KEY`, optional `FIREBASE_SERVICE_ACCOUNT_KEY`)

## 5. SEO

- `generateMetadata` on dynamic pages
- `app/sitemap.ts`, `app/robots.ts`
- JSON-LD Article on post pages (where applicable)

## 6. Phases (reference)

1. Foundation – project, Firebase wiring, auth shell  
2. Admin core – editor, uploads, categories  
3. Admin extended – list/filters, media, pages, settings  
4. Public core – home, post, category, layout, dark mode  
5. Public extended – search, contact, related posts, share  
6. Polish – ISR, images, a11y  
7. Test & deploy  

See [IMPLEMENTATION_CHECKLIST.md](../IMPLEMENTATION_CHECKLIST.md) for checkbox tracking.
