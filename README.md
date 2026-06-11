# Clubhouse — Sports Pools Platform

Social sports games platform where friend groups play recurring pools together all year. Pick'em, Survivor, Golf Majors, and more — with a polished ESPN-grade UX.

## Tech Stack

- **Next.js 16+ (App Router)** — TypeScript, server components by default
- **Tailwind CSS v4** — custom design token system, ESPN-inspired dark theme
- **SQLite (dev) / PostgreSQL (prod)** via Prisma ORM v7 + better-sqlite3
- **Auth.js v5** — Google OAuth + Resend email magic links
- **@vercel/og** — dynamic share card image generation

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Edit `.env` with real values:

```bash
# Auth
AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>
RESEND_API_KEY=<from resend.com>
EMAIL_FROM="Clubhouse <noreply@yourdomain.com>"

# App URL
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (SQLite for local)
DATABASE_URL=file:./dev.db
```

### 3. Set up the database

```bash
npx prisma migrate dev   # creates dev.db + runs migrations
npm run db:seed          # seeds demo data (8 users, 3 pools, golf mid-round)
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Script

After seeding, the app is fully playable without any external APIs:

1. **Sign in** — go to `/login`. Enter `will@demo.com` and submit. In dev without a real Resend key, the magic link logs to the terminal — copy the URL and open it.

2. **Home** — `/home` shows your groups (The Boys) and action items.

3. **Group hub** — `/g/the-boys` shows 8 members, 3 active pools, and the activity feed.

4. **Survivor pool** — `/p/pool-survivor-2025` — Week 6 state: Will, Kyle, Sarah are alive; 5 players are in the graveyard with savage copy. Make a Week 6 pick.

5. **Pick'em pool** — `/p/pool-pickem-2025` — 5 weeks of history. Standings table with rank movement and dot history.

6. **Golf pool** — `/p/pool-golf-2025` — Mid-Round 3 of the Masters. Adam's entry is OUT (Spieth MC). Weighted math shown inline.

7. **Commissioner tools** — `/p/pool-survivor-2025/admin` — Enter scores, click "Simulate Week" (dev only) to randomize results and grade all picks.

8. **Invite flow** — `/join/demo-invite` — Works logged out. Shows group preview. After joining, auto-redirects to the picks screen.

9. **Share cards** — visit `/api/share/survivor-status?alive=3&total=8&week=7` to see a generated OG image.

---

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/auth/             # Auth.js route handler
    api/share/[type]/     # OG share card image generation
    api/invite/qr/        # QR code generation
    g/[slug]/             # Group hub
    p/[id]/               # Pool pages (home, picks, standings, admin)
    join/[code]/          # Invite join flow
    home/                 # Authenticated home
    login/                # Auth pages
    profile/              # User profile
  actions/                # Server actions
    picks.ts              # submitSurvivorPick, submitPickemPicks, joinGroupViaInvite, createGroup
    admin.ts              # updatePoolSettings, updateGameScore, simulateWeek, updateGolfScores
  components/
    ui/                   # Button, Badge, Avatar, Card, Skeleton, Toast
    layout/               # Nav (bottom tab / sidebar), AppShell
    pools/                # PoolTicker, TeamPickGrid, StandingsTable, GolfLeaderboard
    activity/             # ActivityFeed with emoji reactions
  lib/
    auth.ts               # Auth.js config (Google + Resend magic links)
    db.ts                 # Prisma client with better-sqlite3 adapter
    utils.ts              # cn(), formatRelativeTime, formatCountdown, scoreToDisplay
    constants/teams.ts    # Full NFL + 40 CFB teams with hex color map
    scoring/golf.ts       # Golf weighted scoring, tiebreaker, payout calc (pure fns)
    scoring/pickem.ts     # Pick'em and survivor scoring (pure fns)
    sports-data/          # Provider abstraction (ManualProvider default, ApiProvider stub)
  generated/prisma/       # Prisma-generated TypeScript client
prisma/
  schema.prisma           # Full domain schema (Postgres-first, SQLite for dev)
  seed.ts                 # Demo data seed
  dev.db                  # SQLite DB (git-ignored)
```

---

## Game Rules

### NFL / CFB Pick'em
Pick every game winner each week (straight-up or ATS). Games lock at kickoff. 1 pt per correct pick; "best bet" = 2 pts. Tiebreaker: Monday night total.

### NFL Survivor
Pick ONE team per week. Each team can only be used once per season. Last entry alive wins.

### Golf Majors Pool
Pick 4 golfers ranked 1–4. Score = G1×4 + G2×3 + G3×2 + G4×1 (relative to par). Lowest total wins. Any golfer missing cut/WD/DQ/DNS/MDF = entry is OUT. Playoff winner gets −1 bonus.

---

## Wiring Live Sports Data

The `ManualProvider` (commissioner-entered scores) is the default and makes the app 100% functional. To add live ESPN data, implement the stubs in `src/lib/sports-data/api-provider.ts` and add a cron route at `src/app/api/cron/refresh-scores/route.ts`.

---

## Renaming from "Clubhouse"

The brand name appears only in:
- `metadata.title` in `src/app/layout.tsx`
- Logo text in `src/components/layout/nav.tsx` and `src/app/login/page.tsx`
- This README

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Add all env vars
4. Set `DATABASE_URL` to a Postgres connection string (Neon, Supabase, PlanetScale)
5. Run `npx prisma migrate deploy` as part of the build or post-deploy hook
