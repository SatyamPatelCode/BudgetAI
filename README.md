# BudgetAI

BudgetAI is a minimalist mobile budgeting app focused on fast, private, and intentional expense tracking. It provides quick transaction entry, persistent per-user storage, simple filtering and sorting, and clear visualizations to help users understand and control their spending without the noise of full bank feeds.

---

## Quick overview

- Purpose: let users record and analyze the spending that matters with minimal friction.
- Platforms: Expo / React Native (iOS + Android during development with Expo Go).
- Persistence: Supabase (Postgres) with per-user Row-Level Security.
- Auth: Clerk for user sign-in and JWT templates integrated with Supabase.

---

## Key features

- Quick add/delete transactions (name, amount, category)
- Recent transactions preview (most recent 4) and full history view
- Sorting and filtering in history (by amount, date, name, minimum amount)
- Swipeable trend chart and category pie chart for analytics
- Sidebar navigation and simple app settings
- Optional AI-assisted category suggestions (planned/partial)

---

## Codebase structure (high level)

- `App.tsx` - entry point and simple screen switching logic used in development
- `src/screens/` - screen components (Home, AddTransaction, Transactions/History, Settings)
- `src/components/` - reusable UI components (charts, headers, list items)
- `src/lib/supabase.ts` - Supabase client helper and authenticated client creator
- `src/constants/` - theme and style constants
- `assets/` - static images and icons used in the UI

---

## Tech stack (short)

- Frontend: Expo + React Native (TypeScript)
- Auth: Clerk (clerk-expo)
- Database: Supabase (Postgres) with RLS
- Charts: react-native-chart-kit (line charts) and react-native-gifted-charts (pie charts)
- Storage: Expo SecureStore adapter for session persistence

---

## Setup (local development)

1. Install dependencies:

   npm install

2. Copy `.env.example` (or create a `.env`) and set your keys locally (do not commit your `.env`):

   - EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   - EXPO_PUBLIC_SUPABASE_ANON_KEY=pk.your_anon_key
   - EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key

3. Start Expo:

   npx expo start --clear

4. Run on device/simulator using Expo Go or a development build.

---

## Environment & security notes

- Never commit secret keys (service_role, JWT secret, Clerk secret) to the repository. Use `.env` locally and secret storage for CI/CD.
- Supabase RLS policies are required so each user only sees their own transactions.
- Clerk JWT template for Supabase must be named exactly `supabase` if the app requests `getToken({ template: 'supabase' })`.

---

## Running and testing

- Use the app to sign in (Clerk), add a few transactions, then view the History and Charts to validate persistence and visualization.
- If you run into `JWT expired` or auth issues after rotating keys, sign out and sign back in.

---

## Contributing

- Keep changes small and focused.
- Don’t commit any `.env` files or secrets.
- Open PRs for UI, feature, or bug fixes and include a short description of the change.

---

## Contact

- Repository: (add your GitHub repo link)
- Author: (your name / email)

---

(Use this README as a short guide for running and understanding the BudgetAI codebase.)