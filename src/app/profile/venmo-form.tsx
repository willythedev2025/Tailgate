"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setVenmoHandle } from "@/actions/commissioner";

export function VenmoForm({ initialHandle }: { initialHandle: string | null }) {
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await setVenmoHandle(handle);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError("Letters, numbers, dashes, and underscores only");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Commissioners: add your Venmo so your pools show members a one-tap pay
        button for entry fees. Clubhouse never touches the money.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: "var(--color-text-dim)" }}>@</span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="your-venmo"
          maxLength={31}
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        <Button type="submit" variant="secondary" size="sm" loading={isPending}>
          {saved ? "✓ Saved" : "Save"}
        </Button>
      </div>
      {error && (
        <p className="text-xs font-semibold" style={{ color: "var(--color-red)" }}>{error}</p>
      )}
    </form>
  );
}
