import { useRef } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { IconAdd } from "@/components/icons";
import { STATUSES, STATUS_META, type Status } from "@/lib/applications";

/**
 * The mobile tab strip and the snap-scrolling column rail.
 *
 * Four columns cannot fit a phone, so one column fills the width at a time and
 * the tabs above choose which. The rail scrolls horizontally with a mandatory
 * snap, so a swipe moves to the next column and stops on it. The strip stays in
 * sync in both directions: tapping a tab scrolls the rail, and scrolling the
 * rail moves the active tab.
 *
 * The columns themselves are still the droppables from BoardColumn, so a card
 * dragged or long-pressed onto the visible column lands in the right place, and
 * a swipe on a card cannot fight a drag: the rail only scrolls when the gesture
 * starts on the rail itself.
 */
export function MobileBoard({
  active,
  counts,
  onActiveChange,
  onAdd,
  renderColumn,
}: {
  active: Status;
  counts: Record<Status, number>;
  onActiveChange: (status: Status) => void;
  onAdd: (status: Status) => void;
  renderColumn: (status: Status) => React.ReactNode;
}) {
  const rail = useRef<HTMLDivElement>(null);

  function select(status: Status) {
    onActiveChange(status);
    rail.current
      ?.querySelector<HTMLElement>(`[data-status="${status}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Application status"
        className="flex shrink-0 gap-1 overflow-x-auto border-b px-2"
        style={{ scrollbarWidth: "none" }}
      >
        {STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const selected = status === active;
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`mobile-panel-${status}`}
              data-testid="mobile-tab"
              data-status={status}
              onClick={() => select(status)}
              /* 44px tall, so a tab is a comfortable target on a phone. */
              className={cn(
                "relative flex h-11 shrink-0 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                selected
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn("size-2 rounded-full", meta.dot)}
              />
              {meta.title}
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                {counts[status]}
              </span>

              {selected ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-1.5 -bottom-px h-0.5 rounded-full",
                    meta.dot,
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        ref={rail}
        data-testid="mobile-rail"
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
        onScroll={(event) => {
          const width = event.currentTarget.clientWidth;
          if (width === 0) {
            return;
          }
          const index = Math.round(event.currentTarget.scrollLeft / width);
          const next = STATUSES[index];
          if (next && next !== active) {
            onActiveChange(next);
          }
        }}
      >
        {STATUSES.map((status) => (
          <div
            key={status}
            id={`mobile-panel-${status}`}
            role="tabpanel"
            aria-label={STATUS_META[status].title}
            className="w-full shrink-0 snap-start [&>section]:h-full [&>section]:rounded-none [&>section]:border-0"
          >
            {renderColumn(status)}
          </div>
        ))}
      </div>

      <Button
        type="button"
        aria-label={`Add application to ${STATUS_META[active].title}`}
        onClick={() => onAdd(active)}
        className="absolute right-4 bottom-4 z-20 size-14 rounded-full shadow-lg shadow-black/25"
      >
        <IconAdd className="size-6" aria-hidden />
      </Button>
    </div>
  );
}
