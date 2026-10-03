import { Check, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The primary "save" action for Fantasy screens: a solid pill in the app's primary colour with
 * a small icon badge. Quiet and flat when disabled, a spinner while saving.
 */
export function SaveButton({
  label,
  pendingLabel = "Saving…",
  pending = false,
  disabled = false,
  onClick,
  block = true,
  icon: Icon = Check,
  className,
}: {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onClick: () => void;
  block?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold tracking-tight",
        "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
        "transition-all duration-150 enabled:hover:brightness-110 enabled:active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-muted-foreground disabled:shadow-none disabled:ring-1 disabled:ring-white/10",
        block && "w-full",
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 group-disabled:bg-white/10">
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <Icon className="h-3 w-3" strokeWidth={3} aria-hidden />
        )}
      </span>
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}