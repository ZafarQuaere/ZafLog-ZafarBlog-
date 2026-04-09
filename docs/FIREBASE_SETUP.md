# Firebase Implementation Guide

Follow these steps to run the blog platform with Firebase.

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Enable **Google Analytics** (optional).

## 2. Register a web app

1. Project settings → **Your apps** → Web (`</>`).
2. Copy the config values into `.env.local` as `NEXT_PUBLIC_FIREBASE_*`.

## 3. Authentication

1. **Build → Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. **Users** → Add user (your admin email/password), or create the user via **Add user** with the exact email you will use to sign in.
4. **Settings → Authorized domains** — add every hostname where users sign in:
   - `localhost` is included by default for development.
   - For **Firebase App Hosting**, add your live host (for example `blogwebsite-backend--blogwebsite-53f01.us-central1.hosted.app`). Without this, sign-in fails with `auth/unauthorized-domain`.
   - Add your custom domain here when you connect one.

If sign-in always shows “Invalid email or password” but the password is correct, check authorized domains first, then confirm the user exists under **Authentication → Users** for this project (not a different Firebase project).

## 4. Firestore

1. **Build → Firestore Database** → Create database (production mode).
2. **Rules** – deploy rules that match the spec (see `firestore.rules` in repo root).
3. **Indexes** → Composite indexes:
   - Collection `posts`: `status` Ascending, `publishedAt` Descending  
   - Collection `posts`: `category` Ascending, `publishedAt` Descending  
   - Collection `posts`: `slug` Ascending (single-field index often auto-created)

## 5. Storage

1. **Build → Storage** → Get started.
2. Deploy `storage.rules` from repo root.

## 6. Service account (server-side reads & contact)

For **ISR/SSG** and optional **Admin SDK** usage:

1. Project settings → **Service accounts** → **Generate new private key**.
2. Store the JSON **only** on the server:
   - **Vercel:** add env `FIREBASE_SERVICE_ACCOUNT_KEY` = full JSON string (single line).
   - **Local:** same in `.env.local` (never commit).

If `FIREBASE_SERVICE_ACCOUNT_KEY` is omitted, public pages fall back to client-side data loading where implemented.

## 7. Environment variables

Copy `.env.example` to `.env.local` and fill:

- All `NEXT_PUBLIC_FIREBASE_*`
- `NEXT_PUBLIC_SITE_URL`
- `EMAIL_API_KEY`, `CONTACT_EMAIL` (Resend: use `CONTACT_EMAIL` as verified sender/from per your provider docs)
- Optional: `FIREBASE_SERVICE_ACCOUNT_KEY`

## 8. CLI deployment of rules (optional)

```bash
npm i -g firebase-tools
firebase login
firebase init  # select Firestore + Storage, use existing project
firebase deploy --only firestore:rules,storage
```

---

**Single admin model:** Only one Firebase Auth user is expected; all `/admin/*` routes (except `/admin/login`) require a signed-in user.
