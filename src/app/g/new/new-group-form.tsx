"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createGroup } from "@/actions/picks";

const EMOJI_OPTIONS = ["🏆", "🏈", "⛳", "🍺", "🔥", "💀", "🦅", "🐐", "🎯", "💰", "🤠", "🏟️"];

export function NewGroupForm() {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏆");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your group a name");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const { groupSlug } = await createGroup(name.trim(), emoji);
        router.push(`/g/${groupSlug}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="group-name" className="text-label block mb-2">
          Group name
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Degenerates"
          maxLength={60}
          autoFocus
          className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* Emoji */}
      <div>
        <label className="text-label block mb-2">Pick an emblem</label>
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEmoji(option)}
              className="h-12 rounded-lg text-2xl flex items-center justify-center transition-all"
              style={{
                backgroundColor: emoji === option ? "var(--color-surface-2)" : "var(--color-surface)",
                border: `2px solid ${emoji === option ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm font-semibold" style={{ color: "var(--color-red)" }}>
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full">
        Create group
      </Button>
    </form>
  );
}
