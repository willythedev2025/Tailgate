import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { Nav } from "./nav";

interface AppShellProps {
  children: ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, image: session.user.image }
    : undefined;

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Nav user={user} />
      <main className="flex-1 min-w-0 pb-[72px] lg:pb-0 lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
