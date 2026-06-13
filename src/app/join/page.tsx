"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function JoinIndexPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept a bare code or a full invite URL
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste an invite link or code");
      return;
    }
    const code = trimmed.split("/").filter(Boolean).pop()!;
    setError(null);
    router.push(`/join/${encodeURIComponent(code)}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-headline text-3xl font-black" style={{ color: "var(--color-text)" }}>
            CLUB<span style={{ color: "var(--color-accent)" }}>HOUSE</span>
          </p>
        </div>

        <div
          className="rounded-xl border px-6 py-6"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h1 className="font-black text-lg mb-1 text-center" style={{ color: "var(--color-text)" }}>
            Join a group
          </h1>
          <p className="text-sm mb-5 text-center" style={{ color: "var(--color-text-muted)" }}>
            Paste the invite link or code your commissioner sent you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://…/join/abc123 or abc123"
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
            {error && (
              <p className="text-sm font-semibold" style={{ color: "var(--color-red)" }}>
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
