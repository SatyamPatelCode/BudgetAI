# Developer Guide — BudgetAI

This document is intended to help new contributors understand how to run, debug, and extend the BudgetAI codebase.

## 1. Prerequisites

- Node.js (LTS) and npm
- Expo CLI (optional): `npm install -g expo-cli`
- An Expo account (for builds / EAS) if you plan to publish

## 2. Environment variables

Do NOT commit secrets into git. Use a local `.env` (ignored by .gitignore) or Expo `app.config.js` extras.
Required env vars for local development:

- EXPO_PUBLIC_SUPABASE_URL - your Supabase project URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY - Supabase anon public key
- EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY - Clerk publishable key

Optional (do not store client-only secret keys in the repo):
- Clerk secret keys and Supabase service_role should only live in secure server-side storage.

Recommendation: Create a `.env` from `.env.example` and fill values locally:
```
cp .env.example .env
# edit .env with your values
```

## 3. Installing dependencies

Some packages require ignoring peer dependency resolution in Expo-managed projects. If you see peer dependency errors, install with:

```
npm install --legacy-peer-deps
```

Install regular deps:
```
npm install
```

Then install native chart dependencies (if missing):
```
npm install react-native-chart-kit react-native-gifted-charts react-native-svg expo-linear-gradient --legacy-peer-deps
```

## 4. Supabase schema (SQL)

Run this in the Supabase SQL editor to create the `transactions` table and RLS policies:

```sql
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc', now()) not null,
  user_id text not null,
  name text not null,
  category text,
  amount numeric not null
);

alter table public.transactions enable row level security;

create policy "Users can select own transactions"
  on public.transactions for select
  using ( user_id = (select auth.jwt() ->> 'sub') );

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check ( user_id = (select auth.jwt() ->> 'sub') );

create policy "Users can delete own transactions"
  on public.transactions for delete
  using ( user_id = (select auth.jwt() ->> 'sub') );
```

Make sure the Clerk JWT template signs the token with the Supabase JWT secret and includes `sub` claim set to the Clerk user id.

## 5. Clerk JWT Template for Supabase

- Open Clerk Dashboard → Your app → JWT Templates → New Template → select Supabase.
- Name the template exactly `supabase` (used by getToken({ template: 'supabase' })).
- Paste the Supabase JWT secret (Project Settings → API → JWT Settings → Reveal) into the Signing Key.
- Save.

After this, in the client code we call `getToken({ template: 'supabase' })`, and the token will be acceptable to Supabase when passed as `Authorization: Bearer <token>`.

## 6. Running the app

Start Metro / Expo:
```
npx expo start --clear
```
Open on device or simulator with Expo Go or a dev build.

If you see `supabaseUrl is required`, check your `.env` values or Expo config extras and restart Metro.

## 7. Common runtime errors & fixes

- "JWT expired": sign out and sign back in. Ensure Clerk JWT template token lifetime matches expectations. Rotate keys if needed.
- "No JWT template exists with name: supabase": create a Clerk JWT template named `supabase` (see section 5).
- "Gradient package was not found": install `expo-linear-gradient`.
- "Cannot find module '@supabase/supabase-js'": run `npm install @supabase/supabase-js --legacy-peer-deps`.
- Missing asset require like `../../assets/plus.png`: either add the image to `assets/` or replace with an icon component.

## 8. Debugging tips

- Use console logs to track async flow of tokens and Supabase responses.
- When working with Supabase RLS, test queries in the SQL editor using `auth.jwt()` to mimic incoming tokens.
- If the app behaves strangely after rotating secrets, clear cache and restart the app: `npx expo start --clear`.

## 9. Code style & tests

- The project uses TypeScript. Keep types precise for components and API responses.
- Add unit tests for utility functions and consider integration tests for screen flows.

## 10. Removing leaked secrets from git (if needed)

If secrets were pushed accidentally, rotate them immediately. To remove history refer to tools such as BFG or `git filter-repo`. This is destructive and requires force-pushing and coordination with collaborators.

## 11. Contact / next steps

If you need help with CI secrets, Clerk JWT settings, or Supabase policies, add an issue describing the symptom and include relevant logs (no secret values).