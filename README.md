# Blog website

Next.js blog platform with Firebase (Firestore, Auth, Storage), Tailwind CSS, and admin CMS. See [blog-platform-spec.md](./blog-platform-spec.md) for the product spec.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in Firebase + Resend values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## Docs

- [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md) — Firebase console, rules, indexes, service account
- [docs/BLOG_PLATFORM_TRD.md](./docs/BLOG_PLATFORM_TRD.md) — technical requirements summary
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) — delivery checklist

## Environment

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | Web app config from Firebase Console |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (SEO, sitemap, share links) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON string — optional but recommended for public ISR/SSG data |
| `EMAIL_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender in Resend |
| `CONTACT_EMAIL` | Fallback inbox if Firestore recipient not set |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — ESLint
- `npm run repair:published-at` — dry-run repair for published posts missing `publishedAt`

Run `npm run repair:published-at -- --write` to apply the one-time backfill using `FIREBASE_SERVICE_ACCOUNT_KEY` from `.env.local`.

## Deploy (Vercel)

1. Import repo, set the same env vars as `.env.example`.
2. Deploy; add `FIREBASE_SERVICE_ACCOUNT_KEY` for best SEO (static paths for posts).

## Firestore rules

Deploy [firestore.rules](./firestore.rules) and [storage.rules](./storage.rules) from the Firebase Console or Firebase CLI.
