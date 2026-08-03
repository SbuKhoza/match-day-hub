export function LiveBadge({ minute }: { minute?: number | undefined }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-live px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      Live{typeof minute === "number" ? ` · ${minute}'` : ""}
    </span>
  );
}