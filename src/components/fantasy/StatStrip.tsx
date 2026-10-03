export interface StatStripItem {
  label: string;
  value: string;
  hint?: string;
}

/** One compact card with 2–4 label/value columns. Replaces a row of separate stat tiles. */
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="home-card grid auto-cols-fr grid-flow-col divide-x divide-white/10 py-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 line-clamp-2 break-words text-[15px] font-bold leading-snug">{item.value}</p>
          {item.hint ? <p className="mt-0.5 text-[10px] text-muted-foreground">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}