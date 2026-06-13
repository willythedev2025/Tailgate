"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitOneAndDonePick } from "@/actions/picks";
import { formatCountdown } from "@/lib/utils";

interface OneDonePicksClientProps {
  entryId: string;
  tournament: { id: string; name: string; startsAt: string } | null;
  field: { golferId: string; name: string; country: string }[];
  usedGolfers: { golferId: string; name: string; tournament: string }[];
  existingGolferId: string | null;
}

export function OneDonePicksClient({
  entryId,
  tournament,
  field,
  usedGolfers,
  existingGolferId,
}: OneDonePicksClientProps) {
  const [selected, setSelected] = useState<string | null>(existingGolferId);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!existingGolferId);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const usedIds = useMemo(() => new Set(usedGolfers.map((u) => u.golferId)), [usedGolfers]);

  const visibleField = useMemo(() => {
    const q = search.trim().toLowerCase();
    return field.filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [field, search]);

  if (!tournament) {
    return (
      <div
        className="rounded-xl border px-6 py-10 text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="text-4xl mb-3">⛳</div>
        <p className="font-black text-base mb-1" style={{ color: "var(--color-text)" }}>
          No upcoming major
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          The season&apos;s majors are done — check the standings for final results.
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selected) {
      setError("Pick a golfer first");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitOneAndDonePick(entryId, tournament.id, selected);
        setSaved(true);
        setTimeout(() => router.push(".."), 1000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Lock countdown */}
      <div
        className="rounded-lg border px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
          Locks at tee-off · {new Date(tournament.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span className="text-xs font-black tabular" style={{ color: "var(--color-accent)" }}>
          {formatCountdown(new Date(tournament.startsAt))}
        </span>
      </div>

      {/* Already used */}
      {usedGolfers.length > 0 && (
        <div>
          <p className="text-label mb-2">Already used</p>
          <div className="flex flex-wrap gap-2">
            {usedGolfers.map((u) => (
              <span
                key={u.golferId}
                className="text-xs px-2.5 py-1 rounded-full line-through"
                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-dim)" }}
              >
                {u.name} · {u.tournament}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Field */}
      {field.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-10 text-center"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="text-4xl mb-3">🕐</div>
          <p className="font-black text-base mb-1" style={{ color: "var(--color-text)" }}>
            Field not announced yet
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            The {tournament.name} field publishes tournament week and will sync in
            automatically. Check back then to lock your pick.
          </p>
        </div>
      ) : (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search the ${tournament.name} field…`}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />

          <div
            className="rounded-xl border overflow-hidden max-h-[420px] overflow-y-auto"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {visibleField.map((g) => {
              const used = usedIds.has(g.golferId);
              const isSelected = selected === g.golferId;
              return (
                <button
                  key={g.golferId}
                  type="button"
                  disabled={used}
                  onClick={() => {
                    setSelected((prev) => (prev === g.golferId ? null : g.golferId));
                    setSaved(false);
                    setError(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b last:border-0 transition-colors disabled:opacity-40"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: isSelected ? "rgba(30,58,110,0.08)" : "transparent",
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full border-2 shrink-0"
                    style={{
                      borderColor: isSelected ? "var(--color-accent)" : "var(--color-muted)",
                      backgroundColor: isSelected ? "var(--color-accent)" : "transparent",
                    }}
                  />
                  <span
                    className={used ? "line-through" : ""}
                    style={{ color: "var(--color-text)", fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    {g.name}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: "var(--color-text-dim)" }}>
                    {g.country}
                  </span>
                </button>
              );
            })}
            {visibleField.length === 0 && (
              <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
                No golfers match “{search}”
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm font-semibold" style={{ color: "var(--color-red)" }}>
              {error}
            </p>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={isPending}
            disabled={!selected || saved}
            onClick={handleSubmit}
          >
            {saved ? "✓ Locked in" : "Lock in pick"}
          </Button>
        </>
      )}
    </div>
  );
}
