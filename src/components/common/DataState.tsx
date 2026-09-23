import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { cn } from "@/lib/utils";

/** Neutral skeleton block — never contains anything that could read as real data. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span role="status">{label}</span>
      </CardBody>
    </Card>
  );
}

export function EmptyMessage({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorMessage({
  title = "Live football data is temporarily unavailable.",
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-3xl border border-border bg-secondary/50 px-5 py-4 text-sm"
    >
      <span className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {title}
      </span>
      {detail ? <p className="text-muted-foreground">{detail}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
