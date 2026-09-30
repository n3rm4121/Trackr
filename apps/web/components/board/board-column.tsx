import { useDroppable } from "@dnd-kit/react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { InboxIcon } from "@hugeicons/core-free-icons";
import { IconAdd } from "@/components/icons";
import { STATUS_META, type Status } from "@/lib/applications";

export function BoardColumn({
  status,
  count,
  highlighted,
  onQuickAdd,
  showHeader = true,
  children,
}: {
  status: Status;
  count: number;
  // The dragged card is projected into this column, so this is the drop zone.
  highlighted: boolean;
  onQuickAdd: (status: Status) => void;
  // The mobile tab strip already names the column and shows the count, so the
  // header is dropped there rather than repeated above every card.
  showHeader?: boolean;
  // Cards and insertion lines, already interleaved by the caller.
  children: React.ReactNode;
}) {
  const meta = STATUS_META[status];
  // The droppable is what makes the column a valid destination, so it covers
  // the header too rather than only the scrolling area below it. No explicit
  // collision priority: a card under the pointer is closer to the pointer than
  // the whole column is, so the default comparison already prefers the card and
  // falls back to the column wherever there is no card to land on — which is
  // what makes an empty column a target. Setting a priority here overrides that
  // comparison and hands every collision to a card instead.
  const { ref } = useDroppable({
    id: status,
    type: "column",
    accept: ["card"],
  });

  const isOffer = status === "offer";

  return (
    <section
      ref={ref}
      aria-labelledby={`column-${status}`}
      data-testid="board-column"
      data-status={status}
      data-drop-target={highlighted || undefined}
      className={cn(
        "bg-muted/40 flex min-h-0 min-w-0 flex-col rounded-xl border border-transparent",
        // The dashed outline and tint only land on the column under the
        // pointer, so at most one column ever reads as a target.
        highlighted &&
          "border-primary/70 bg-primary/10 border-dashed shadow-[inset_0_0_0_1px_var(--primary)]",
        // Highlight the Offer column with a subtle accent ring
        isOffer && "ring-2 ring-emerald-500/30 bg-emerald-500/5 border-emerald-500/20",
      )}
    >
      {showHeader ? (
        <header className="flex items-center gap-2 px-3 pt-3 pb-2">
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", meta.dot)}
          />
          <h2
            id={`column-${status}`}
            className="min-w-0 flex-1 truncate text-sm font-semibold"
          >
            {meta.title}
          </h2>
          <span
            data-testid="column-count"
            className="bg-background text-muted-foreground rounded-full border px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
          >
            {count}
          </span>
          <button
            type="button"
            onClick={() => onQuickAdd(status)}
            aria-label={`Add application to ${meta.title}`}
            className="text-muted-foreground hover:bg-background hover:text-foreground rounded-md border p-1 transition-colors"
          >
            <IconAdd className="size-3.5" aria-hidden />
          </button>
        </header>
      ) : (
        /* The tab strip above the rail already names this column and shows its
           count, so the visible header is dropped and only the heading stays,
           for the tab panel's label. */
        <h2 id={`column-${status}`} className="sr-only">
          {meta.title}
        </h2>
      )}

      <div
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {count === 0 ? (
          <div
            data-testid="column-empty"
            className="text-muted-foreground flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-6 text-center"
          >
            <HugeiconsIcon
              icon={InboxIcon}
              className="size-5 opacity-60"
              aria-hidden
            />
            <p className="text-xs">No applications yet</p>
            <p className="text-[11px] opacity-80">
              Drag or long-press a card here
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}