"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setEntryPaid } from "@/actions/commissioner";
import { parseFeeAmount, venmoPayUrl, smsDraftUrl } from "@/lib/venmo";
import { formatRelativeTime } from "@/lib/utils";

interface RosterEntry {
  id: string;
  name: string;
  fullName: string;
  image: string | null;
  paidAt: string | null;
  joinedAt: string;
}

interface RosterClientProps {
  poolName: string;
  entryFeeDisplay: string | null;
  venmoHandle: string | null;
  inviteUrl: string;
  entries: RosterEntry[];
  notEntered: string[];
}

export function RosterClient({
  poolName,
  entryFeeDisplay,
  venmoHandle,
  inviteUrl,
  entries,
  notEntered,
}: RosterClientProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const amount = parseFeeAmount(entryFeeDisplay);
  const paid = entries.filter((e) => e.paidAt);
  const unpaid = entries.filter((e) => !e.paidAt);

  const togglePaid = (entry: RosterEntry) => {
    setPending(entry.id);
    startTransition(async () => {
      try {
        await setEntryPaid(entry.id, !entry.paidAt);
        router.refresh();
      } finally {
        setPending(null);
      }
    });
  };

  const reminderMessage = [
    `Reminder for ${poolName}:`,
    entryFeeDisplay ? `entry is ${entryFeeDisplay}.` : "get your entry in.",
    venmoHandle
      ? `Pay here → ${venmoPayUrl(venmoHandle, amount, poolName)}`
      : "",
    `Pool: ${inviteUrl}`,
  ]
    .filter(Boolean)
    .join(" ");

  const copyReminder = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="space-y-6">
      {/* Collection summary */}
      {entryFeeDisplay && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Collected", value: amount ? `$${amount * paid.length}` : `${paid.length}`, color: "var(--color-green)" },
            { label: "Outstanding", value: amount ? `$${amount * unpaid.length}` : `${unpaid.length}`, color: unpaid.length ? "var(--color-red)" : "var(--color-text-dim)" },
            { label: "Paid up", value: `${paid.length}/${entries.length}`, color: "var(--color-gold)" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-black tabular" style={{ color: s.color }}>{s.value}</div>
              <div className="text-label mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Nudge tools */}
      {unpaid.length > 0 && (
        <div
          className="rounded-xl border px-4 py-4 space-y-3"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-label">
            Nudge the {unpaid.length} unpaid member{unpaid.length !== 1 ? "s" : ""}
          </p>
          <p
            className="text-xs px-3 py-2.5 rounded-lg leading-relaxed"
            style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
          >
            {reminderMessage}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={copyReminder}>
              {copied ? "✓ Copied" : "Copy message"}
            </Button>
            <a href={smsDraftUrl(reminderMessage)}>
              <Button variant="secondary" size="sm">Open in Messages</Button>
            </a>
          </div>
        </div>
      )}

      {/* Roster */}
      <div>
        <p className="text-label mb-3">Entries ({entries.length})</p>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : undefined }}
            >
              <Avatar src={entry.image} name={entry.fullName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {entry.fullName}
                </p>
                <p className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>
                  Joined {formatRelativeTime(new Date(entry.joinedAt))}
                  {entry.paidAt && ` · paid ${formatRelativeTime(new Date(entry.paidAt))}`}
                </p>
              </div>
              {entry.paidAt ? (
                <Badge variant="win">Paid</Badge>
              ) : entryFeeDisplay ? (
                <Badge variant="pending">Unpaid</Badge>
              ) : null}
              {entryFeeDisplay && (
                <Button
                  variant={entry.paidAt ? "ghost" : "secondary"}
                  size="sm"
                  loading={pending === entry.id}
                  onClick={() => togglePaid(entry)}
                >
                  {entry.paidAt ? "Undo" : "Mark paid"}
                </Button>
              )}
            </div>
          ))}
          {entries.length === 0 && (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
              No entries yet — share the invite link.
            </p>
          )}
        </div>
      </div>

      {/* In the group but not entered */}
      {notEntered.length > 0 && (
        <div>
          <p className="text-label mb-2">In the group, not entered ({notEntered.length})</p>
          <div className="flex flex-wrap gap-2">
            {notEntered.map((name) => (
              <span
                key={name}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
