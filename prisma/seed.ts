// Seed script — creates a fully demo-able state
// Run: npx tsx prisma/seed.ts

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding Clubhouse demo data...");

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = await Promise.all([
    upsertUser("will@demo.com",   "Will Jones",   "https://i.pravatar.cc/150?img=1"),
    upsertUser("kyle@demo.com",   "Kyle Adams",   "https://i.pravatar.cc/150?img=2"),
    upsertUser("adam@demo.com",   "Adam Smith",   "https://i.pravatar.cc/150?img=3"),
    upsertUser("sarah@demo.com",  "Sarah Chen",   "https://i.pravatar.cc/150?img=4"),
    upsertUser("mike@demo.com",   "Mike Torres",  "https://i.pravatar.cc/150?img=5"),
    upsertUser("jake@demo.com",   "Jake Rivera",  "https://i.pravatar.cc/150?img=6"),
    upsertUser("emma@demo.com",   "Emma White",   "https://i.pravatar.cc/150?img=7"),
    upsertUser("liam@demo.com",   "Liam Scott",   "https://i.pravatar.cc/150?img=8"),
  ]);

  const [will, kyle, adam, sarah, mike, jake, emma, liam] = users;

  // ── Group ─────────────────────────────────────────────────────────────────
  const group = await prisma.group.upsert({
    where: { slug: "the-boys" },
    update: {},
    create: {
      name: "The Boys",
      slug: "the-boys",
      emoji: "🏈",
      createdById: will.id,
    },
  });

  // Group members: Will is commissioner, rest are players
  for (const u of users) {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: u.id } },
      update: {},
      create: {
        groupId: group.id,
        userId: u.id,
        role: u.id === will.id ? "COMMISSIONER" : "PLAYER",
      },
    });
  }

  console.log("✓ Group and 8 users created");

  // ── NFL Schedule (Weeks 1-8, 2025) ────────────────────────────────────────
  const week1Games = await seedNFLWeek(1, 2025, new Date("2025-09-07"));
  const week2Games = await seedNFLWeek(2, 2025, new Date("2025-09-14"));
  const week3Games = await seedNFLWeek(3, 2025, new Date("2025-09-21"));
  const week4Games = await seedNFLWeek(4, 2025, new Date("2025-09-28"));
  const week5Games = await seedNFLWeek(5, 2025, new Date("2025-10-05"));
  const week6Games = await seedNFLWeek(6, 2025, new Date("2025-10-12"));
  const week7Games = await seedNFLWeek(7, 2025, new Date("2025-10-19"));

  console.log("✓ NFL schedule seeded (weeks 1-7)");

  // ── NFL Survivor Pool ──────────────────────────────────────────────────────
  const survivorPool = await prisma.pool.upsert({
    where: { id: "pool-survivor-2025" },
    update: { status: "LIVE" },
    create: {
      id: "pool-survivor-2025",
      groupId: group.id,
      gameType: "NFL_SURVIVOR",
      name: "2025 Survivor",
      season: 2025,
      status: "LIVE",
      settingsJson: JSON.stringify({
        mulligan: false,
        allEliminated: "end", // "end" | "continue"
      }),
      entryFeeDisplay: "$25",
      createdById: will.id,
      lockAt: new Date("2025-10-19T13:00:00Z"),
    },
  });

  // Entries with Week 6 state: Will, Kyle, Sarah alive; Adam, Mike, Jake, Emma, Liam eliminated
  const survivorEntries = [
    { user: will,  name: "Will",  status: "ALIVE",      picks: ["kc","sf","dal","gb","buf"] },
    { user: kyle,  name: "Kyle",  status: "ALIVE",      picks: ["phi","bal","min","sea","no"] },
    { user: sarah, name: "Sarah", status: "ALIVE",      picks: ["sf","det","kc","phi","mia"] },
    { user: adam,  name: "Adam",  status: "ELIMINATED", picks: ["cin","buf","ne","lar","cin"], eliminatedWeek: "week-5", eliminatedTeam: "cin" },
    { user: mike,  name: "Mike",  status: "ELIMINATED", picks: ["dal","atl","mia","nyj"],      eliminatedWeek: "week-4", eliminatedTeam: "nyj" },
    { user: jake,  name: "Jake",  status: "ELIMINATED", picks: ["gb","kc","hou"],               eliminatedWeek: "week-3", eliminatedTeam: "hou" },
    { user: emma,  name: "Emma",  status: "ELIMINATED", picks: ["buf","chi"],                   eliminatedWeek: "week-2", eliminatedTeam: "chi" },
    { user: liam,  name: "Liam",  status: "ELIMINATED", picks: ["nyg"],                         eliminatedWeek: "week-1", eliminatedTeam: "nyg" },
  ];

  for (const e of survivorEntries) {
    const entry = await prisma.entry.upsert({
      where: { id: `entry-survivor-${e.user.id}` },
      update: { status: e.status, eliminatedWeek: (e as any).eliminatedWeek, eliminatedTeam: (e as any).eliminatedTeam },
      create: {
        id: `entry-survivor-${e.user.id}`,
        poolId: survivorPool.id,
        userId: e.user.id,
        entryName: e.name,
        status: e.status,
        eliminatedWeek: (e as any).eliminatedWeek ?? null,
        eliminatedTeam: (e as any).eliminatedTeam ?? null,
      },
    });

    for (let i = 0; i < e.picks.length; i++) {
      const weekKey = `week-${i + 1}`;
      await prisma.pick.upsert({
        where: { entryId_periodKey: { entryId: entry.id, periodKey: weekKey } },
        update: {},
        create: {
          entryId: entry.id,
          periodKey: weekKey,
          payloadJson: JSON.stringify({ teamSlug: e.picks[i] }),
          lockedAt: new Date(),
          result: i < e.picks.length - 1 ? "WIN" : (e.status === "ELIMINATED" ? "LOSS" : "WIN"),
          points: 1,
        },
      });
    }
  }

  console.log("✓ Survivor pool seeded (Week 6, 3 alive)");

  // ── NFL Pick'em Pool ───────────────────────────────────────────────────────
  const pickemPool = await prisma.pool.upsert({
    where: { id: "pool-pickem-2025" },
    update: { status: "LIVE" },
    create: {
      id: "pool-pickem-2025",
      groupId: group.id,
      gameType: "NFL_PICKEM",
      name: "2025 NFL Pick'em",
      season: 2025,
      status: "LIVE",
      settingsJson: JSON.stringify({ ats: false, bestBet: true }),
      entryFeeDisplay: "$20",
      createdById: will.id,
      lockAt: new Date("2025-10-19T13:00:00Z"),
    },
  });

  // Add all NFL games to pick'em pool slate
  const allPickemGames = [...week1Games, ...week2Games, ...week3Games, ...week4Games, ...week5Games, ...week6Games];
  for (const game of allPickemGames) {
    await prisma.poolSlateGame.upsert({
      where: { poolId_sportEventId: { poolId: pickemPool.id, sportEventId: game.id } },
      update: {},
      create: { poolId: pickemPool.id, sportEventId: game.id, sortOrder: 0 },
    });
  }

  // Seed 5 weeks of pick'em picks for all users
  const pickemStandings = [
    { user: will,  weeklyPoints: [10,11,9,12,10] },
    { user: kyle,  weeklyPoints: [12,10,11,9,12] },
    { user: adam,  weeklyPoints: [9,10,10,11,9] },
    { user: sarah, weeklyPoints: [11,12,8,10,11] },
    { user: mike,  weeklyPoints: [8,9,12,11,8] },
    { user: jake,  weeklyPoints: [10,8,9,10,10] },
    { user: emma,  weeklyPoints: [11,11,10,9,9] },
    { user: liam,  weeklyPoints: [9,10,11,8,11] },
  ];

  for (const s of pickemStandings) {
    const entry = await prisma.entry.upsert({
      where: { id: `entry-pickem-${s.user.id}` },
      update: {},
      create: {
        id: `entry-pickem-${s.user.id}`,
        poolId: pickemPool.id,
        userId: s.user.id,
        entryName: s.user.name ?? s.user.email,
        status: "ACTIVE",
      },
    });

    for (let w = 0; w < s.weeklyPoints.length; w++) {
      await prisma.pick.upsert({
        where: { entryId_periodKey: { entryId: entry.id, periodKey: `week-${w + 1}` } },
        update: {},
        create: {
          entryId: entry.id,
          periodKey: `week-${w + 1}`,
          payloadJson: JSON.stringify({ picks: [], tiebreakerTotal: 40 }),
          lockedAt: new Date(),
          result: "WIN",
          points: s.weeklyPoints[w],
        },
      });
    }
  }

  console.log("✓ NFL Pick'em pool seeded (5 weeks of history)");

  // ── Golf Tournament ────────────────────────────────────────────────────────
  const golfPool = await prisma.pool.upsert({
    where: { id: "pool-golf-2025" },
    update: { status: "LIVE" },
    create: {
      id: "pool-golf-2025",
      groupId: group.id,
      gameType: "GOLF_MAJOR",
      name: "2025 Masters Pool",
      season: 2025,
      status: "LIVE",
      settingsJson: JSON.stringify({ bonusLabels: ["R1 Leader", "R2 Leader", "R3 Leader"] }),
      entryFeeDisplay: "$50",
      createdById: will.id,
      lockAt: new Date("2025-04-10T10:00:00Z"),
    },
  });

  const tournament = await prisma.golfTournament.upsert({
    where: { id: "tournament-masters-2025" },
    update: {},
    create: {
      id: "tournament-masters-2025",
      name: "2025 Masters Tournament",
      season: 2025,
      startsAt: new Date("2025-04-10T10:00:00Z"),
      poolId: golfPool.id,
      status: "LIVE",
    },
  });

  const golferData = [
    { name: "Scottie Scheffler",  country: "USA", owgr: 1 },
    { name: "Rory McIlroy",       country: "NIR", owgr: 2 },
    { name: "Xander Schauffele",  country: "USA", owgr: 3 },
    { name: "Jon Rahm",           country: "ESP", owgr: 4 },
    { name: "Collin Morikawa",    country: "USA", owgr: 5 },
    { name: "Viktor Hovland",     country: "NOR", owgr: 6 },
    { name: "Brooks Koepka",      country: "USA", owgr: 7 },
    { name: "Patrick Cantlay",    country: "USA", owgr: 8 },
    { name: "Tony Finau",         country: "USA", owgr: 9 },
    { name: "Max Homa",           country: "USA", owgr: 10 },
    { name: "Jordan Spieth",      country: "USA", owgr: 11 },
    { name: "Justin Thomas",      country: "USA", owgr: 12 },
    { name: "Shane Lowry",        country: "IRL", owgr: 13 },
    { name: "Tommy Fleetwood",    country: "ENG", owgr: 14 },
    { name: "Hideki Matsuyama",   country: "JPN", owgr: 15 },
    { name: "Brian Harman",       country: "USA", owgr: 16 },
    { name: "Matt Fitzpatrick",   country: "ENG", owgr: 17 },
    { name: "Russell Henley",     country: "USA", owgr: 18 },
    { name: "Tyrrell Hatton",     country: "ENG", owgr: 19 },
    { name: "Cameron Young",      country: "USA", owgr: 20 },
    { name: "Tom Kim",            country: "KOR", owgr: 21 },
    { name: "Kurt Kitayama",      country: "USA", owgr: 22 },
    { name: "Chris Kirk",         country: "USA", owgr: 23 },
    { name: "Adam Scott",         country: "AUS", owgr: 24 },
    { name: "Si Woo Kim",         country: "KOR", owgr: 25 },
    { name: "Lucas Glover",       country: "USA", owgr: 26 },
    { name: "Sungjae Im",         country: "KOR", owgr: 27 },
    { name: "Jason Day",          country: "AUS", owgr: 28 },
    { name: "Ryan Fox",           country: "NZL", owgr: 29 },
    { name: "Seamus Power",       country: "IRL", owgr: 30 },
    { name: "Harris English",     country: "USA", owgr: 31 },
    { name: "Min Woo Lee",        country: "AUS", owgr: 32 },
    { name: "Corey Conners",      country: "CAN", owgr: 33 },
    { name: "Alex Noren",         country: "SWE", owgr: 34 },
    { name: "Adam Hadwin",        country: "CAN", owgr: 35 },
    { name: "Billy Horschel",     country: "USA", owgr: 36 },
    { name: "Keegan Bradley",     country: "USA", owgr: 37 },
    { name: "Cameron Davis",      country: "AUS", owgr: 38 },
    { name: "Dustin Johnson",     country: "USA", owgr: 39 },
    { name: "Phil Mickelson",     country: "USA", owgr: 50 },
    { name: "Rickie Fowler",      country: "USA", owgr: 42 },
    { name: "Gary Woodland",      country: "USA", owgr: 55 },
    { name: "Webb Simpson",       country: "USA", owgr: 60 },
    { name: "Bubba Watson",       country: "USA", owgr: 65 },
    { name: "Zach Johnson",       country: "USA", owgr: 70 },
    { name: "Fred Couples",       country: "USA", owgr: 99 },
    { name: "Nick Taylor",        country: "CAN", owgr: 43 },
    { name: "Chez Reavie",        country: "USA", owgr: 47 },
    { name: "Mark Hubbard",       country: "USA", owgr: 52 },
    { name: "Sahith Theegala",    country: "USA", owgr: 22 },
    { name: "Wyndham Clark",      country: "USA", owgr: 25 },
    { name: "Taylor Moore",       country: "USA", owgr: 68 },
    { name: "Chandler Phillips",  country: "USA", owgr: 72 },
    { name: "Seonghyeon Kim",     country: "KOR", owgr: 77 },
    { name: "Davis Thompson",     country: "USA", owgr: 80 },
    { name: "Neal Shipley",       country: "USA", owgr: 90 },
    { name: "Luke Clanton",       country: "USA", owgr: 93 },
    { name: "Denny McCarthy",     country: "USA", owgr: 40 },
    { name: "Eric Cole",          country: "USA", owgr: 45 },
    { name: "Taylor Pendrith",    country: "CAN", owgr: 48 },
    { name: "Ben Griffin",        country: "USA", owgr: 51 },
    { name: "Akshay Bhatia",      country: "USA", owgr: 35 },
    { name: "Patrick Reed",       country: "USA", owgr: 53 },
    { name: "Sam Burns",          country: "USA", owgr: 30 },
    { name: "Brendan Steele",     country: "USA", owgr: 85 },
    { name: "Stewart Cink",       country: "USA", owgr: 88 },
    { name: "Retief Goosen",      country: "RSA", owgr: 99 },
    { name: "Mike Weir",          country: "CAN", owgr: 99 },
    { name: "Larry Mize",         country: "USA", owgr: 99 },
    { name: "Jose Maria Olazabal",country: "ESP", owgr: 99 },
    { name: "Vijay Singh",        country: "FIJ", owgr: 99 },
    { name: "Mark O'Meara",       country: "USA", owgr: 99 },
  ];

  const golfers: { id: string; name: string }[] = [];
  for (const g of golferData) {
    const golfer = await prisma.golfer.upsert({
      where: { id: `golfer-${g.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` },
      update: {},
      create: {
        id: `golfer-${g.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
        name: g.name,
        country: g.country,
        owgr: g.owgr,
      },
    });
    golfers.push({ id: golfer.id, name: golfer.name });

    await prisma.golfTournamentField.upsert({
      where: { tournamentId_golferId: { tournamentId: tournament.id, golferId: golfer.id } },
      update: {},
      create: { tournamentId: tournament.id, golferId: golfer.id },
    });
  }

  // Seed golf scores (mid-round-3 state)
  const scoreData: [string, number | null, number | null, number | null, number | null, string][] = [
    ["Scottie Scheffler",  -8, -4, -6, null, "ACTIVE"],
    ["Rory McIlroy",       -7, -3, -5, null, "ACTIVE"],
    ["Xander Schauffele",  -5, -6, -3, null, "ACTIVE"],
    ["Jon Rahm",           -4, -5, -4, null, "ACTIVE"],
    ["Collin Morikawa",    -3, -4, -2, null, "ACTIVE"],
    ["Viktor Hovland",     -2, -3, -3, null, "ACTIVE"],
    ["Brooks Koepka",      -2, -2, -1, null, "ACTIVE"],
    ["Patrick Cantlay",    -1, -3, -2, null, "ACTIVE"],
    ["Tony Finau",         -1, -1, -2, null, "ACTIVE"],
    ["Max Homa",            0, -2, -1, null, "ACTIVE"],
    ["Jordan Spieth",       1, -1,  0, null, "CUT"],
    ["Justin Thomas",       0,  1, null, null, "CUT"],
    ["Shane Lowry",        -3, -2, -2, null, "ACTIVE"],
    ["Tommy Fleetwood",    -2, -2, -1, null, "ACTIVE"],
    ["Hideki Matsuyama",   -1, -3, -3, null, "ACTIVE"],
    ["Brian Harman",        0, -1,  0, null, "ACTIVE"],
    ["Matt Fitzpatrick",    1,  0, -1, null, "ACTIVE"],
    ["Russell Henley",     -2, -1, -2, null, "ACTIVE"],
    ["Tyrrell Hatton",      2, -1,  1, null, "ACTIVE"],
    ["Cameron Young",       0,  2, -1, null, "ACTIVE"],
    ["Tom Kim",             1,  0,  0, null, "ACTIVE"],
    ["Kurt Kitayama",       3,  1,  2, null, "ACTIVE"],
    ["Chris Kirk",          2,  2,  1, null, "ACTIVE"],
    ["Adam Scott",          1,  1,  0, null, "ACTIVE"],
    ["Si Woo Kim",          2,  3,  2, null, "ACTIVE"],
    ["Lucas Glover",        3,  2,  1, null, "ACTIVE"],
    ["Sungjae Im",          2,  1,  3, null, "ACTIVE"],
    ["Jason Day",           0, -2, -1, null, "ACTIVE"],
    ["Ryan Fox",            1,  2,  2, null, "ACTIVE"],
    ["Seamus Power",        4,  3,  3, null, "ACTIVE"],
    ["Harris English",      3,  1, null, null, "CUT"],
    ["Min Woo Lee",         2,  3,  2, null, "ACTIVE"],
    ["Dustin Johnson",      5,  2,  4, null, "ACTIVE"],
    ["Phil Mickelson",      4,  5, null, null, "CUT"],
    ["Sam Burns",           1,  2,  1, null, "ACTIVE"],
    ["Akshay Bhatia",      -1,  0, -2, null, "ACTIVE"],
    ["Sahith Theegala",     0, -1, -1, null, "ACTIVE"],
    ["Wyndham Clark",       2,  1,  0, null, "ACTIVE"],
    ["Denny McCarthy",      3,  2,  3, null, "ACTIVE"],
    ["Patrick Reed",        1,  3, null, null, "CUT"],
    ["Rickie Fowler",       6,  5, null, null, "CUT"],
    ["Zach Johnson",        7,  6, null, null, "CUT"],
    ["Fred Couples",        5,  4, null, null, "WD"],
    ["Jose Maria Olazabal", 8,  7, null, null, "CUT"],
  ];

  for (const [name, r1, r2, r3, r4, status] of scoreData) {
    const golfer = golfers.find((g) => g.name === name);
    if (!golfer) continue;

    const rounds = [r1, r2, r3, r4].filter((r): r is number => r !== null);
    const total = rounds.length > 0 ? rounds.reduce((a, b) => a + b, 0) : null;

    await prisma.golfScore.upsert({
      where: { tournamentId_golferId: { tournamentId: tournament.id, golferId: golfer.id } },
      update: { round1: r1, round2: r2, round3: r3, round4: r4, total, status, currentRound: r3 !== null ? 3 : 2 },
      create: {
        tournamentId: tournament.id,
        golferId: golfer.id,
        round1: r1, round2: r2, round3: r3, round4: r4,
        total,
        status,
        currentRound: r3 !== null ? 3 : 2,
      },
    });
  }

  // Golf pool entries
  const scheffler = golfers.find(g => g.name === "Scottie Scheffler")!;
  const mcilroy   = golfers.find(g => g.name === "Rory McIlroy")!;
  const xander    = golfers.find(g => g.name === "Xander Schauffele")!;
  const rahm      = golfers.find(g => g.name === "Jon Rahm")!;
  const morikawa  = golfers.find(g => g.name === "Collin Morikawa")!;
  const hovland   = golfers.find(g => g.name === "Viktor Hovland")!;
  const koepka    = golfers.find(g => g.name === "Brooks Koepka")!;
  const cantlay   = golfers.find(g => g.name === "Patrick Cantlay")!;
  const spieth    = golfers.find(g => g.name === "Jordan Spieth")!;
  const jthomas   = golfers.find(g => g.name === "Justin Thomas")!;
  const lowry     = golfers.find(g => g.name === "Shane Lowry")!;
  const harman    = golfers.find(g => g.name === "Brian Harman")!;

  // Will: Scheffler #1, McIlroy #2, Rahm #3, Hovland #4 — leading
  await seedGolfEntry("golf-will", golfPool.id, will.id, "Will", "ACTIVE", [
    { rank: 1, golferId: scheffler.id },
    { rank: 2, golferId: mcilroy.id },
    { rank: 3, golferId: rahm.id },
    { rank: 4, golferId: hovland.id },
  ]);

  // Kyle: Scheffler #1, Xander #2, Morikawa #3, Cantlay #4
  await seedGolfEntry("golf-kyle", golfPool.id, kyle.id, "Kyle", "ACTIVE", [
    { rank: 1, golferId: scheffler.id },
    { rank: 2, golferId: xander.id },
    { rank: 3, golferId: morikawa.id },
    { rank: 4, golferId: cantlay.id },
  ]);

  // Adam: McIlroy #1, Spieth #2, Harman #3, Koepka #4 — OUT (Spieth MC)
  await seedGolfEntry("golf-adam", golfPool.id, adam.id, "Adam", "OUT", [
    { rank: 1, golferId: mcilroy.id },
    { rank: 2, golferId: spieth.id },
    { rank: 3, golferId: harman.id },
    { rank: 4, golferId: koepka.id },
  ], "Spieth MC");

  // Sarah: Xander #1, Lowry #2, Hovland #3, Morikawa #4
  await seedGolfEntry("golf-sarah", golfPool.id, sarah.id, "Sarah", "ACTIVE", [
    { rank: 1, golferId: xander.id },
    { rank: 2, golferId: lowry.id },
    { rank: 3, golferId: hovland.id },
    { rank: 4, golferId: morikawa.id },
  ]);

  // Mike: Rahm #1, Koepka #2, McIlroy #3, Scheffler #4
  await seedGolfEntry("golf-mike", golfPool.id, mike.id, "Mike", "ACTIVE", [
    { rank: 1, golferId: rahm.id },
    { rank: 2, golferId: koepka.id },
    { rank: 3, golferId: mcilroy.id },
    { rank: 4, golferId: scheffler.id },
  ]);

  // Adam #2 entry (multiple entries allowed)
  await seedGolfEntry("golf-adam-2", golfPool.id, adam.id, "Adam #2", "OUT", [
    { rank: 1, golferId: jthomas.id },
    { rank: 2, golferId: rahm.id },
    { rank: 3, golferId: xander.id },
    { rank: 4, golferId: scheffler.id },
  ], "Justin Thomas MC");

  console.log("✓ Golf pool seeded (mid-Round 3, 1 OUT entry)");

  // ── Activity feed ──────────────────────────────────────────────────────────
  const activities = [
    { type: "ELIMINATED",  userId: liam.id,  payload: { team: "nyg", week: "week-1", message: "trusted the Giants" } },
    { type: "ELIMINATED",  userId: emma.id,  payload: { team: "chi", week: "week-2", message: "trusted the Bears" } },
    { type: "ELIMINATED",  userId: jake.id,  payload: { team: "hou", week: "week-3", message: "trusted the Texans" } },
    { type: "ELIMINATED",  userId: mike.id,  payload: { team: "nyj", week: "week-4", message: "trusted the Jets" } },
    { type: "GOLF_OUT",    userId: adam.id,  payload: { golfer: "Jordan Spieth", reason: "MC", entryName: "Adam" } },
    { type: "WEEK_RESULT", userId: kyle.id,  payload: { week: "week-5", points: 12, rank: 1 } },
    { type: "PICK_SUBMITTED", userId: will.id, payload: { week: "week-6", message: "locked in 🔒" } },
  ];

  for (const a of activities) {
    await prisma.activityItem.create({
      data: {
        groupId: group.id,
        poolId: survivorPool.id,
        userId: a.userId,
        type: a.type,
        payloadJson: JSON.stringify(a.payload),
        createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
      },
    });
  }

  // ── Invite ─────────────────────────────────────────────────────────────────
  await prisma.invite.upsert({
    where: { code: "demo-invite" },
    update: {},
    create: {
      groupId: group.id,
      code: "demo-invite",
      createdById: will.id,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      maxUses: 50,
      uses: 9,
      opens: 14,
    },
  });

  console.log("✓ Activity feed and invite seeded");
  console.log("\n✅ Seed complete! Log in as will@demo.com to explore.\n");
}

async function upsertUser(email: string, name: string, image: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, image, emailVerified: new Date() },
  });
}

async function seedNFLWeek(week: number, season: number, baseDate: Date) {
  const matchups = [
    ["kc",  "bal"],  ["buf",  "nyj"], ["phi",  "dal"], ["sf",   "lar"],
    ["det", "gb"],   ["min",  "sea"], ["mia",  "ne"],  ["cin",  "pit"],
    ["hou", "ind"],  ["atl",  "no"],  ["tb",   "car"], ["jax",  "ten"],
    ["lv",  "den"],  ["wsh",  "nyg"], ["ari",  "lac"], ["chi",  "cle"],
  ];

  const isFinished = week < 6;
  const events = [];

  for (let i = 0; i < matchups.length; i++) {
    const [home, away] = matchups[i];
    const startsAt = new Date(baseDate.getTime() + (i < 11 ? 0 : i < 15 ? 3600000 * 3 : 3600000 * 6));
    const homeScore = isFinished ? Math.floor(Math.random() * 21) + 14 : null;
    const awayScore = isFinished ? Math.floor(Math.random() * 21) + 10 : null;

    const event = await prisma.sportEvent.upsert({
      where: { id: `nfl-${season}-wk${week}-${i}` },
      update: { homeScore, awayScore, status: isFinished ? "FINAL" : "SCHEDULED" },
      create: {
        id: `nfl-${season}-wk${week}-${i}`,
        sport: "NFL",
        season,
        week,
        startsAt,
        homeTeam: home,
        awayTeam: away,
        homeScore,
        awayScore,
        spread: -(Math.random() * 10 - 5),
        status: isFinished ? "FINAL" : "SCHEDULED",
        gameNumber: i,
      },
    });
    events.push(event);
  }

  return events;
}

async function seedGolfEntry(
  id: string,
  poolId: string,
  userId: string,
  entryName: string,
  status: string,
  golfers: { rank: number; golferId: string }[],
  outReason?: string
) {
  const entry = await prisma.entry.upsert({
    where: { id },
    update: { status, outReason: outReason ?? null },
    create: { id, poolId, userId, entryName, status, outReason: outReason ?? null },
  });

  await prisma.pick.upsert({
    where: { entryId_periodKey: { entryId: entry.id, periodKey: "tournament" } },
    update: {},
    create: {
      entryId: entry.id,
      periodKey: "tournament",
      payloadJson: JSON.stringify({ golfers }),
      lockedAt: new Date("2025-04-10T10:00:00Z"),
      result: status === "OUT" ? "LOSS" : "PENDING",
    },
  });

  return entry;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
