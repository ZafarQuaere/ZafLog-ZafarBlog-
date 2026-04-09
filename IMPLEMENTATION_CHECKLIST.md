# Blog Platform – Implementation Checklist

Track progress against the TRD and [blog-platform-spec.md](./blog-platform-spec.md).

## Documentation

- [x] `IMPLEMENTATION_CHECKLIST.md` (this file)
- [x] `docs/BLOG_PLATFORM_TRD.md` – technical requirements reference
- [x] `docs/FIREBASE_SETUP.md` – Firebase console & env steps

## Pre-development

- [ ] Create Firebase project (Auth, Firestore, Storage)
- [ ] Add Firestore composite indexes (see FIREBASE_SETUP.md)
- [ ] Deploy security rules (see `firebase/` or FIREBASE_SETUP.md)
- [ ] GitHub repo + Vercel project
- [ ] Email provider API key (Resend/SendGrid)
- [ ] Admin user in Firebase Authentication

## Application

- [x] Next.js (App Router) + TypeScript + Tailwind
- [x] Firebase client (auth, Firestore, Storage) — lazy init in browser only
- [x] Firebase Admin (optional env) for server reads / contact API
- [x] Admin: login, dashboard, posts CRUD, categories, pages, media, settings
- [x] Public: home, blog post, category, about, contact, search
- [x] Dark mode, SEO (metadata, sitemap, robots), contact API

## Verification

- [x] `npm run build` passes locally
- [x] `npm run lint` passes
- [ ] Configure `.env.local` and smoke-test admin + public flows
- [ ] Deploy to Vercel; set production env vars

---

**Last updated:** Initial implementation pass (in-repo).
