"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, PenLine, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface NavUser {
  name?: string | null;
  image?: string | null;
}

interface NavProps {
  user?: NavUser;
}

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "My Pools", href: "/pools", icon: Trophy },
  { label: "Make Picks", href: "/picks", icon: PenLine },
  { label: "Standings", href: "/standings", icon: BarChart2 },
  { label: "Profile", href: "/profile", icon: User },
] as const;

function useActiveHref() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
}

export function Nav({ user }: NavProps) {
  const isActive = useActiveHref();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-stretch safe-area-bottom">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_var(--color-accent)]")} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] h-screen sticky top-0 overflow-y-auto">
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <span className="text-headline text-xl text-white tracking-tight">
            CLUB<span className="text-[var(--color-accent)]">HOUSE</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-2 py-3 flex-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-100",
                  active
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="px-3 py-3 border-t border-[var(--color-border)]">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Avatar src={user.image} name={user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                  {user.name ?? "Profile"}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
                  My Account
                </p>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
