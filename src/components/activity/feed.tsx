"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  type: string;
  userId: string | null;
  payloadJson: string;
  createdAt: Date;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  users: Record<string, { name: string | null; image: string | null }>;
}

const REACTION_EMOJIS = ["🔥", "💀", "😂", "🤡", "🐐"] as const;
type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

interface ReactionState {
  counts: Record<string, number>;
  toggled: Set<ReactionEmoji>;
}

function str(v: unknown): string {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function parsePayload(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function ItemContent({ item, userName }: { item: ActivityItem; userName: string }) {
  const p = parsePayload(item.payloadJson);

  switch (item.type) {
    case "ELIMINATED":
      return (
        <span>
          <span className="font-bold text-[var(--color-red)]">{userName}</span>
          <span className="text-[var(--color-text-muted)]"> was </span>
          <span className="font-black text-[var(--color-red)] uppercase tracking-wide">ELIMINATED</span>
          {!!p.week && (
            <span className="text-[var(--color-text-muted)]"> — {str(p.week)}</span>
          )}
          {!!p.team && (
            <span className="text-[var(--color-text-muted)]">
              , picked the{" "}
              <span className="font-semibold text-[var(--color-text)]">{str(p.team)}</span>
            </span>
          )}
        </span>
      );

    case "GOLF_OUT":
      return (
        <span>
          <span className="font-bold text-[var(--color-text)]">{userName}</span>
          <span className="text-[var(--color-text-muted)]">&apos;s entry </span>
          {!!p.entryName && (
            <span className="font-semibold text-[var(--color-text)]">{str(p.entryName)} </span>
          )}
          <span className="text-[var(--color-text-muted)]">is </span>
          <Badge variant="out">OUT</Badge>
          {!!p.golfer && (
            <span className="text-[var(--color-text-muted)]">
              {" — "}
              <span className="font-semibold text-[var(--color-text)]">{str(p.golfer)}</span>
            </span>
          )}
          {!!p.reason && (
            <span className="text-[var(--color-text-muted)]"> {str(p.reason)}</span>
          )}
        </span>
      );

    case "WEEK_RESULT":
      return (
        <span>
          {!!p.week && (
            <span className="font-bold text-[var(--color-gold)]">Week {str(p.week)} results</span>
          )}
          {!!p.leaderName && (
            <span className="text-[var(--color-text-muted)]">
              {" — "}
              <span className="font-semibold text-[var(--color-text)]">{str(p.leaderName)}</span>
              {" leads"}
            </span>
          )}
          {!!p.leaderPoints && (
            <span className="text-[var(--color-text-muted)]">
              {" with "}
              <span className="font-black tabular text-[var(--color-gold)]">{str(p.leaderPoints)} pts</span>
            </span>
          )}
        </span>
      );

    case "PICK_SUBMITTED":
      return (
        <span>
          <span className="font-bold text-[var(--color-text)]">{userName}</span>
          <span className="text-[var(--color-text-muted)]"> locked in their picks</span>
          {!!p.week && (
            <span className="text-[var(--color-text-muted)]">
              {" for "}
              <span className="font-semibold text-[var(--color-text)]">Week {str(p.week)}</span>
            </span>
          )}
        </span>
      );

    case "JOINED":
      return (
        <span>
          <span className="font-bold text-[var(--color-text)]">{userName}</span>
          <span className="text-[var(--color-text-muted)]"> joined the group</span>
        </span>
      );

    default:
      return <span className="text-[var(--color-text-muted)]">{item.type}</span>;
  }
}

const TYPE_EMOJI: Record<string, string> = {
  ELIMINATED: "💀",
  GOLF_OUT: "🏌️",
  WEEK_RESULT: "🏆",
  PICK_SUBMITTED: "🔒",
  JOINED: "👋",
};

const TYPE_BORDER: Record<string, string> = {
  ELIMINATED: "border-[var(--color-red)]/30",
  GOLF_OUT: "border-[var(--color-red)]/20",
  WEEK_RESULT: "border-[var(--color-gold)]/30",
  PICK_SUBMITTED: "border-[var(--color-green)]/20",
  JOINED: "border-[var(--color-blue)]/20",
};

export function ActivityFeed({ items, users }: ActivityFeedProps) {
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});

  const getState = (id: string): ReactionState =>
    reactions[id] ?? { counts: {}, toggled: new Set<ReactionEmoji>() };

  const toggle = (itemId: string, emoji: ReactionEmoji) => {
    setReactions((prev) => {
      const current = prev[itemId] ?? { counts: {}, toggled: new Set<ReactionEmoji>() };
      const toggled = new Set(current.toggled);
      const counts = { ...current.counts };
      if (toggled.has(emoji)) {
        toggled.delete(emoji);
        counts[emoji] = Math.max(0, (counts[emoji] ?? 1) - 1);
      } else {
        toggled.add(emoji);
        counts[emoji] = (counts[emoji] ?? 0) + 1;
      }
      return { ...prev, [itemId]: { counts, toggled } };
    });
  };

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border)]">
      {items.map((item) => {
        const user = item.userId ? users[item.userId] : null;
        const userName = user?.name ?? "Someone";
        const { counts, toggled } = getState(item.id);
        const borderColor = TYPE_BORDER[item.type] ?? "border-[var(--color-border)]";

        return (
          <div
            key={item.id}
            className={cn(
              "flex gap-3 px-4 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors border-l-2",
              borderColor
            )}
          >
            <div className="relative shrink-0 mt-0.5">
              <Avatar src={user?.image} name={user?.name} size="md" />
              <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
                {TYPE_EMOJI[item.type] ?? "📌"}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <ItemContent item={item} userName={userName} />
              </p>
              <p className="text-[10px] text-[var(--color-text-dim)] mt-0.5 uppercase tracking-wide">
                {formatRelativeTime(new Date(item.createdAt))}
              </p>

              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {REACTION_EMOJIS.map((emoji) => {
                  const count = counts[emoji] ?? 0;
                  const active = toggled.has(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggle(item.id, emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all duration-100 border",
                        active
                          ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/30 text-[var(--color-text)]"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-muted)] hover:text-[var(--color-text-muted)]"
                      )}
                    >
                      <span>{emoji}</span>
                      {count > 0 && (
                        <span className="tabular font-semibold">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
