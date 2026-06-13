"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinPool } from "@/actions/groups";

export function EnterPoolButton({ poolId }: { poolId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleEnter = () => {
    setError(null);
    startTransition(async () => {
      try {
        await joinPool(poolId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="primary" loading={isPending} onClick={handleEnter}>
        Enter pool
      </Button>
      {error && (
        <p className="text-xs font-semibold" style={{ color: "var(--color-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
