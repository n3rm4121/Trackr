import { useState } from "react";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { InboxIcon } from "@hugeicons/core-free-icons";
import { IconAdd } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { STATUS_META, type Status } from "@/lib/applications";

export function BoardColumn({
  status,
  title,
  count,
  highlighted,
  onQuickAdd,
  onRename,
  showHeader = true,
  children,
}: {
  status: Status;
  title?: string;
  count: number;
  // The dragged card is projected into this column, so this is the drop zone.
  highlighted: boolean;
  onQuickAdd: (status: Status) => void;
  onRename?: (status: Status, label: string) => void;
  // The mobile tab strip already names the column and shows the count, so the
  // header is dropped there rather than repeated above every card.
  showHeader?: boolean;
  // Cards and insertion lines, already interleaved by the caller.
  children: React.ReactNode;
}) {
  const meta = STATUS_META[status];
  const displayTitle = title ?? meta.title;
  const [editing, setEditing] = useState(false);
  // Refreshed from the live title every time editing starts, so a rename
  // that arrived after first paint is never edited stale.
  const [draft, setDraft] = useState(displayTitle);

  function commit() {
    const next = draft.trim().slice(0, 50);
    if (next && next !== displayTitle) {
      onRename?.(status, next);
    } else {
      setDraft(displayTitle);
    }
    setEditing(false);
  }
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
        "bg-muted/40 flex max-h-full min-h-0 w-full flex-col rounded-xl border border-transparent md:w-72 md:shrink-0",
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
          {editing ? (
            <form
              className="min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                commit();
              }}
            >
              <Input
                autoFocus
                value={draft}
                maxLength={50}
                aria-label={`Rename ${displayTitle} column`}
                className="h-7 text-sm font-semibold"
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setDraft(displayTitle);
                    setEditing(false);
                  }
                }}
              />
            </form>
          ) : (
            <h2
              id={`column-${status}`}
              className="min-w-0 flex-1 text-sm font-semibold"
            >
              <button
                type="button"
                onClick={() => {
                  if (onRename) {
                    setDraft(displayTitle);
                    setEditing(true);
                  }
                }}
                title={onRename ? "Click to rename" : undefined}
                aria-label={
                  onRename
                    ? `Rename ${displayTitle} column`
                    : `${displayTitle} column`
                }
                className={cn(
                  "block w-full truncate text-left",
                  onRename &&
                    "cursor-text rounded hover:text-primary hover:underline hover:decoration-dotted hover:underline-offset-4",
                )}
              >
                {displayTitle}
              </button>
            </h2>
          )}
          <span
            data-testid="column-count"
            className="bg-background text-muted-foreground rounded-full border px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
          >
            {count}
          </span>
          <button
            type="button"
            onClick={() => onQuickAdd(status)}
            aria-label={`Add application to ${displayTitle}`}
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
          {displayTitle}
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