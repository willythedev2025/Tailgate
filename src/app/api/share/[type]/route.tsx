import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTeam } from "@/lib/constants/teams";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const { searchParams } = req.nextUrl;

  const bg = "#0B0D10";
  const surface = "#14171C";
  const accent = "#E8112D";
  const gold = "#FFB52E";
  const green = "#2ECC71";
  const red = "#FF4D4D";
  const text = "#F1F3F5";
  const muted = "#8B95A4";

  const baseStyle = {
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    height: "100%",
    backgroundColor: bg,
    padding: "48px",
    fontFamily: "system-ui, sans-serif",
  };

  if (type === "week-results") {
    const poolId = searchParams.get("poolId");
    const week = searchParams.get("week") ?? "1";

    const entries = poolId
      ? await prisma.entry.findMany({
          where: { poolId },
          include: {
            user: true,
            picks: { where: { periodKey: `week-${week}` } },
          },
          orderBy: { picks: { _count: "desc" } },
        })
      : [];

    const sorted = entries
      .map((e) => ({ name: e.entryName, pts: e.picks[0]?.points ?? 0 }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5);

    const medals = ["🥇", "🥈", "🥉", "4th", "5th"];

    return new ImageResponse(
      <div style={baseStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <span style={{ color: accent, fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            CLUBHOUSE
          </span>
          <span style={{ color: muted, fontSize: "16px" }}>·</span>
          <span style={{ color: muted, fontSize: "20px", fontWeight: 700 }}>WEEK {week} RESULTS</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sorted.map((e, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              backgroundColor: surface,
              borderRadius: "12px",
              padding: "16px 24px",
              border: i === 0 ? `2px solid ${gold}` : `1px solid #252A33`,
            }}>
              <span style={{ fontSize: i < 3 ? "28px" : "18px", minWidth: "36px" }}>{medals[i]}</span>
              <span style={{ color: text, fontWeight: 700, fontSize: "22px", flex: 1 }}>{e.name}</span>
              <span style={{ color: gold, fontWeight: 900, fontSize: "28px", fontVariantNumeric: "tabular-nums" }}>
                {e.pts} pts
              </span>
            </div>
          ))}
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  if (type === "survivor-elimination") {
    const name = searchParams.get("name") ?? "Player";
    const teamSlug = searchParams.get("team") ?? "";
    const week = searchParams.get("week") ?? "1";
    const team = getTeam(teamSlug);

    return new ImageResponse(
      <div style={{ ...baseStyle, justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: "80px", marginBottom: "24px" }}>💀</div>
        <div style={{
          color: red,
          fontWeight: 900,
          fontSize: "48px",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          textAlign: "center",
          marginBottom: "16px",
        }}>
          ELIMINATED
        </div>
        <div style={{ color: text, fontSize: "32px", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>
          {name}
        </div>
        <div style={{ color: muted, fontSize: "20px", textAlign: "center" }}>
          Week {week} · Picked the {team?.name ?? teamSlug}
        </div>
        {team && (
          <div style={{
            marginTop: "32px",
            padding: "8px 24px",
            borderRadius: "8px",
            backgroundColor: team.color,
            color: "#fff",
            fontWeight: 800,
            fontSize: "20px",
            textTransform: "uppercase",
          }}>
            {team.abbr}
          </div>
        )}
        <div style={{ position: "absolute", bottom: "32px", color: muted, fontSize: "16px" }}>
          CLUBHOUSE · Survivor Pool
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  if (type === "survivor-status") {
    const alive = parseInt(searchParams.get("alive") ?? "1");
    const total = parseInt(searchParams.get("total") ?? "1");
    const week = searchParams.get("week") ?? "1";

    return new ImageResponse(
      <div style={{ ...baseStyle, justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: muted, fontSize: "20px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
          HEADING INTO WEEK {week}
        </div>
        <div style={{ color: text, fontWeight: 900, fontSize: "80px", letterSpacing: "-0.04em", lineHeight: "1" }}>
          <span style={{ color: green }}>{alive}</span>
          <span style={{ color: muted }}> of </span>
          <span>{total}</span>
        </div>
        <div style={{ color: muted, fontSize: "28px", marginTop: "16px" }}>still alive 🏈</div>
        <div style={{ position: "absolute", bottom: "32px", color: muted, fontSize: "16px" }}>
          CLUBHOUSE · Survivor Pool
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  if (type === "picks-locked") {
    const name = searchParams.get("name") ?? "Player";
    const week = searchParams.get("week") ?? "1";

    return new ImageResponse(
      <div style={{ ...baseStyle, justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: "80px", marginBottom: "24px" }}>🔒</div>
        <div style={{ color: text, fontWeight: 900, fontSize: "48px", textTransform: "uppercase", letterSpacing: "-0.02em", textAlign: "center" }}>
          I&apos;M LOCKED IN
        </div>
        <div style={{ color: muted, fontSize: "24px", marginTop: "16px" }}>{name} · Week {week}</div>
        <div style={{ position: "absolute", bottom: "32px", color: accent, fontSize: "16px", fontWeight: 700 }}>
          CLUBHOUSE
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    <div style={{ ...baseStyle, justifyContent: "center", alignItems: "center" }}>
      <span style={{ color: accent, fontWeight: 900, fontSize: "64px", textTransform: "uppercase" }}>CLUBHOUSE</span>
      <span style={{ color: muted, fontSize: "24px", marginTop: "16px" }}>Sports Pools</span>
    </div>,
    { width: 1200, height: 630 }
  );
}
