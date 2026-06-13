# Sports Pools Platform — Build Specification

> Source of truth for the game-roster expansion. Each game is a modular "pool
> type" sharing common infrastructure. Every pool has a Commissioner who
> configures rules at creation, and Members who join via invite link. Defaults
> match the most traditional version of each game; customization lives behind
> an "Advanced Settings" panel.

## Status board

| # | Pool type | Status |
|---|-----------|--------|
| 1 | NFL Survivor | ✅ Live (core rules; advanced settings pending) |
| 2 | Pick'em (NFL / CFB / Combo) | ✅ Live (SU, games-per-week cap; ATS + confidence pending) |
| 5 | Golf Major Lineup | ✅ Live (4-golfer weighted; tiers pending) |
| 6 | Golf One & Done | ✅ Live (strokes scoring; earnings scoring pending) |
| 3 | Super Bowl Squares | 🔜 Next up (build order #1 of new engines) |
| 7 | NFL Margin Pool | 🔜 Cheap variant of survivor engine |
| 4 | March Madness Bracket | 🔜 Seasonal — target Selection Sunday |
| 9 | NFL/NBA/NHL Playoff Brackets | 🔜 Variant of bracket engine |
| 8 | Calcutta Auction | ⏳ Phase 3 (real-time auction room; legal review) |
| 10 | Stat-accumulation pools (HR Derby, Country Draft, etc.) | ⏳ Phase 3 (one generic engine) |

---

## 1. NFL Survivor Pool

### Core rules
- Each week, every member picks ONE NFL team to WIN straight up.
- Win → survive. Lose → eliminated. A team can only be used once per season.
- Last member standing wins. Missed pick = automatic elimination (configurable).

### Commissioner customization
| Setting | Options | Default |
|---|---|---|
| Ties count as | Win / Loss / Survive | Loss |
| Strikes before elimination | 1 / 2 / 3 | 1 |
| Picks per week | 1 all season / 2 after Week X | 1 |
| Missed pick | Auto-eliminate / Auto-assign best unused favorite / Random unused | Auto-eliminate |
| Re-buys | Until Week X at $Y / No | No |
| Pick deadline | Picked team's kickoff / First game of week / Sunday 1pm ET | Picked team's kickoff |
| Pick visibility | Hidden until deadline / Always hidden / Always public | Hidden until deadline |
| Playoff continuation | End Week 18 / Continue (teams reusable) | End Week 18 |
| Anti-survivor mode | Pick teams to LOSE | Off |
| Tiebreaker | Split pot / Total margin / Continue into playoffs | Split pot |

### UI notes
- Pick screen: matchups with opponent, location, spread. Used teams grayed with burn week. ✅ built
- Graveyard view with drama. ✅ built
- % of pool on each team after deadline. 🔜

## 2. Pick'em Pool (NFL / CFB / Combo)

### Core rules
- Pick the winner of every game on the slate (or a configured subset).
- ATS or straight up. Weekly + cumulative standings. MNF total tiebreaker.

### Commissioner customization
| Setting | Options | Default |
|---|---|---|
| Spread vs straight up | ATS / SU | ATS |
| Spread lock timing | Locked Tuesday / Live at pick time | Locked Tuesday |
| Confidence points | On / Off | Off |
| Games included | All / Prime time / Best 5 / Custom | All |
| League | NFL / College / Both | NFL |
| Push handling | Half point / No points / Full point | No points |
| Weekly prizes | Weekly % + season / Season only | Season only |
| Drop weeks | Best N of 18 / Count all | Count all |

> NOTE: best-bet (2× pick) was removed by product decision 2026-06.
> Locked spreads must be snapshotted at publish time — never recomputed.

## 3. Super Bowl Squares
- 10×10 grid, random digit assignment after sellout, last digit of each
  quarter's score wins. Options: 5×5, reverse squares, payout per score,
  per-quarter re-randomization, max squares per member.
- UI: the grid is the product — live winning-square highlight, animated digit
  draw, one-tap claiming.

## 4. March Madness Bracket
- Full 63-game bracket, escalating round scoring 1-2-4-8-16-32 (configurable:
  flat, Fibonacci, custom, upset bonus by seed differential, seed-weighted).
- Auto-fill helpers; "points possible remaining" after round 1; championship
  total tiebreaker; optional second-chance bracket and women's bracket.

## 5. Golf Majors Pool (Major Lineup)
- Roster of 5–10 golfers picked from tiers (auto from rankings or
  commissioner-assigned). Scoring methods (commissioner choice): total strokes
  / money / position points / best-N of M / Stableford. Missed-cut handling
  configurable (cut + penalty default). Alternates optional.

## 6. Golf One & Done — ✅ live
- One golfer per event, no reuse all season. Current scoring: strokes to par,
  missed cut = field's worst finish +2. Spec adds: earnings-based scoring,
  custom schedules, segment prizes, reuse-after-N-weeks.

## 7. NFL Margin Pool
- Pick one team weekly; score = margin of victory (negative on loss).
  Cumulative, nobody eliminated. Options: reuse rules, loss floors, margin
  caps, missed-pick penalty.

## 8. Calcutta Auction
- Teams auctioned to highest bidder; owners earn % of pot by advancement.
  Needs real-time auction room (WebSockets), airtight pot math, and legal
  review before any money display. Phase 3.

## 9. Playoff Bracket Pools (NFL/NBA/NHL/MLB)
- Predict every series winner (+ series length bonus for NBA/NHL). Escalating
  rounds; lock upfront or re-pick per round.

## 10. Stat-accumulation quick pools
- Generic engine: draft N entities, accumulate a stat, highest total wins.
  Variants: HR Derby, QB passing TDs, Olympics/World Cup country draft
  (medal weights), Kentucky Derby horse draw, tennis Grand Slam short bracket.

---

## Shared infrastructure

### Pool lifecycle
create → configure (defaults pre-filled) → invite link → join → lock per
game rules → live scoring → final standings → archive. Clone pool for next
season with same settings + members.

### Commissioner tools
- Edit rules before lock (members notified); frozen after lock.
- Manual score/pick override with member-visible audit log.
- Remove members, announcements, deadline extensions.
- ✅ Roster & dues tracking (paid/unpaid, Venmo deep links, reminder drafts).

### Money: track, don't touch
Display fees/pot/payouts and a settlement ledger with Venmo/PayPal deep
links. Do NOT process payments pending state-by-state legal review.
✅ Implemented: entry-fee display, paid tracking, commissioner Venmo handle,
one-tap pay links, copy/SMS reminder drafts.

### Data layer (adapter pattern — partially built)
All game logic reads through `src/lib/sports-data/` — never call providers
directly. Current: ESPN adapter (espn.ts) + sync into Prisma (sync.ts), daily
cron at /api/cron/sync. Planned adapters: the-odds-api (spreads), slash-golf
or DataGolf (golf), SportsDataIO (production scores + licensed images).

**Critical rule:** store locked spreads/odds at pick time in our DB; same for
golf tier snapshots.

#### Provider phases
- Phase 1 ($0): ESPN unofficial endpoints (current) + The Odds API free tier.
- Phase 2 (~$50–60/mo): The Odds API Professional ($29/mo) + Slash Golf
  (~$10–25/mo) or DataGolf (~$30/mo).
- Phase 3 ($200–500+/mo): SportsDataIO (single provider, licensed images) or
  MySportsFeeds + golf feed; Sportradar later at enterprise scale.

### Images
- NFL logos via ESPN CDN = prototyping only (trademark risk in production).
  Production: licensed via SportsDataIO/Sportradar, or designed fallbacks
  (colored monograms — already built as the CFB fallback).

### Real-time + notifications
- Live scores: polling 30–60s during games (WebSocket later).
- Highest-value notification: pick deadline reminders (24h, 1h). Then
  eliminations, weekly wins, square hits, auction outbids.

### Tech expectations
- Mobile-first; picks completable in under 30 seconds on a phone.
- Rules stored as JSON settings per pool, validated per game type (current
  pattern: `settingsJson` + zod in server actions).
- Common pool-type interface: configure → join → pick → score → standings.

### Build order
1. ✅ Shared infrastructure (done) → **Squares** (exercises live scoring + social moments)
2. ✅ Survivor + Pick'em (live)
3. March Madness bracket (huge seasonal acquisition moment)
4. ✅ Golf Majors + One & Done (live) → add tiers + earnings scoring
5. Margin pool, playoff brackets (cheap variants)
6. Calcutta (own project; highest legal sensitivity)
7. Stat-accumulation engine (HR Derby, Olympics, etc.)
