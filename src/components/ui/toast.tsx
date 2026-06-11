"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X, CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right" duration={4500}>
        {children}
        {items.map((item) => (
          <ToastRoot key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
        <RadixToast.Viewport className="fixed bottom-24 right-4 lg:bottom-4 z-[100] flex flex-col gap-2 w-full max-w-sm outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

interface ToastRootProps {
  item: ToastItem;
  onDismiss: () => void;
}

function ToastRoot({ item, onDismiss }: ToastRootProps) {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-[var(--color-green)] shrink-0" />,
    error: <XCircle className="w-4 h-4 text-[var(--color-red)] shrink-0" />,
    info: <Info className="w-4 h-4 text-[var(--color-blue)] shrink-0" />,
  };

  return (
    <RadixToast.Root
      defaultOpen
      onOpenChange={(open) => !open && onDismiss()}
      className={cn(
        "flex items-start gap-3 bg-[var(--color-surface)] border rounded-[var(--radius-lg)] px-4 py-3 shadow-2xl",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-4",
        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-4",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-4",
        {
          "border-[var(--color-green)]/30": item.variant === "success",
          "border-[var(--color-red)]/30": item.variant === "error",
          "border-[var(--color-blue)]/30": item.variant === "info",
        }
      )}
    >
      <div className="mt-0.5">{iconMap[item.variant]}</div>
      <div className="flex-1 min-w-0">
        <RadixToast.Title className="text-sm font-semibold text-[var(--color-text)]">
          {item.title}
        </RadixToast.Title>
        {item.description && (
          <RadixToast.Description className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {item.description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close
        onClick={onDismiss}
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
