"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { label: "Home",       href: "/home" },
  { label: "My Pools",   href: "/pools" },
  { label: "Make Picks", href: "/picks" },
  { label: "Standings",  href: "/standings" },
  { label: "Profile",    href: "/profile" },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

export function Nav({ user }: NavProps) {
  const isActive = useIsActive();

  return (
    <>
      {/* Mobile bottom tab bar — text only, no icons */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-stretch"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        {NAV_ITEMS.map(({ label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex items-center justify-center py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
              style={{ color: active ? "var(--color-accent)" : "var(--color-text-dim)" }}
            >
              {label === "Make Picks" ? "Picks" : label === "My Pools" ? "Pools" : label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar — ESPN-style left rail */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0"
        style={{
          backgroundColor: "#0d0f12",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "3px solid var(--color-accent)" }}
        >
          <span
            className="text-headline text-2xl tracking-tight text-white"
            style={{ fontWeight: 900, letterSpacing: "-0.03em" }}
          >
            CLUB<span style={{ color: "var(--color-accent)" }}>HOUSE</span>
          </span>
        </div>

        {/* Nav links — plain text, no icons */}
        <nav className="flex flex-col py-2 flex-1">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-l-2",
                  active
                    ? "border-[var(--color-accent)] text-white bg-white/5"
                    : "border-transparent text-[var(--color-text-dim)] hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div
            className="px-4 py-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <Link
              href="/profile"
              className="flex items-center gap-3 py-1 hover:opacity-80 transition-opacity"
            >
              <Avatar src={user.image} name={user.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name ?? "Profile"}</p>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>
                  Account
                </p>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
