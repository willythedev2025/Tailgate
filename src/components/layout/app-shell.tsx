import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Nav } from "./nav";

interface AppShellProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export async function AppShell({ children, requireAuth = true }: AppShellProps) {
  const session = await auth();

  if (requireAuth && !session?.user) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/home";
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const user = session?.user
    ? { name: session.user.name, image: session.user.image }
    : undefined;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <Nav user={user} />
      <main className="flex-1 min-w-0 pb-[64px] lg:pb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
