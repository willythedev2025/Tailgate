import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { NewGroupForm } from "./new-group-form";

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "var(--color-text-dim)" }}>
            New group
          </p>
          <h1 className="text-headline text-3xl" style={{ color: "var(--color-text)" }}>
            START A CLUBHOUSE
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Your crew&apos;s home for every pool. You&apos;ll be the commissioner.
          </p>
        </div>
        <NewGroupForm />
      </div>
    </AppShell>
  );
}
