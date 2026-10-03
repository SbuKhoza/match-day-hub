import { RotateCcw } from "lucide-react";

import { SaveButton } from "./SaveButton";

/**
 * Floating "unsaved changes" bar. Sits just above the mobile bottom navigation (or near the
 * bottom of the screen on desktop): a status line, then a quiet discard button beside a larger
 * save button.
 */
export function SaveBar({
  title,
  detail,
  saving,
  error,
  onSave,
  onDiscard,
  saveLabel = "Save",
  discardLabel = "Discard",
}: {
  title: string;
  detail?: string;
  saving: boolean;
  error?: string | null;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel?: string;
  discardLabel?: string;
}) {
  return (
    <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 lg:bottom-6">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-background/90 p-3 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex items-center gap-2 px-1">
          <span aria-hidden className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
          {detail ? <p className="shrink-0 text-xs text-muted-foreground">{detail}</p> : null}
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={onDiscard}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/[0.05] text-sm font-semibold text-muted-foreground ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {discardLabel}
          </button>
          <SaveButton label={saveLabel} pending={saving} onClick={onSave} />
        </div>

        {error ? <p className="px-1 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}