import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { root: "w-6 h-6", text: "text-[9px]" },
  md: { root: "w-9 h-9", text: "text-xs" },
  lg: { root: "w-12 h-12", text: "text-sm" },
  xl: { root: "w-16 h-16", text: "text-base" },
} as const;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { root, text } = sizeMap[size];
  return (
    <RadixAvatar.Root
      className={cn(
        root,
        "relative inline-flex items-center justify-center rounded-full overflow-hidden ring-1 ring-[var(--color-border)] bg-[var(--color-surface-2)] shrink-0",
        className
      )}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt={name ?? "User avatar"}
          className="w-full h-full object-cover"
        />
      )}
      <RadixAvatar.Fallback
        className={cn(
          "w-full h-full flex items-center justify-center font-bold text-[var(--color-text-muted)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-muted)]",
          text
        )}
        delayMs={src ? 300 : 0}
      >
        {getInitials(name)}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

interface AvatarStackProps {
  users: Array<{ src?: string | null; name?: string | null }>;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarStack({ users, max = 4, size = "sm" }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const { root, text } = sizeMap[size];

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div
          key={i}
          className="relative ring-2 ring-[var(--color-bg)] rounded-full"
          style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: visible.length - i }}
        >
          <Avatar src={user.src} name={user.name} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            root,
            text,
            "relative ml-[-8px] inline-flex items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-text-muted)] font-bold ring-2 ring-[var(--color-bg)] shrink-0"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
