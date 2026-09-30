import { useRef } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { Drag01Icon, NoteIcon } from "@hugeicons/core-free-icons";
import {
  IconClock,
  IconDollar,
  IconMapPin,
  IconMore,
} from "@/components/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  STATUSES,
  STATUS_META,
  type Application,
  type Status,
} from "@/lib/applications";
import { daysSince, initials, relativeDays } from "@/lib/date";

// After this long with no movement or note, the card is flagged as going quiet.
const SILENCE_DAYS = 7;

export function ApplicationCard({
  application,
  index,
  dragging,
  coarse = false,
  onOpen,
  onEdit,
  onDelete,
  onMove,
  onRequestActions,
}: {
  application: Application;
  index: number;
  dragging: boolean;
  // True where the primary input is touch: the whole card becomes the drag handle for a long press, and the tap targets grow to 44px.
  coarse?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (status: Status) => void;
  // On touch the three-dot opens the action sheet instead of a dropdown menu, which a thumb cannot reach.
  onRequestActions?: () => void;
}) {
  // The grip element, held in a ref of our own so it can be handed to dnd-kit
  // as a handle. dnd-kit reads it when the sensor binds on pointerdown, so the
  // ref is already pointing at the rendered button by then.
  const handle = useRef<HTMLButtonElement | null>(null);
  const { ref, isDragSource, isDropTarget } = useSortable({
    id: application.id,
    index,
    group: application.status,
    type: "card",
    accept: ["card", "column"],
    // On touch, dnd-kit's default pointer sensor waits 250ms before it lifts a
    // card, so passing no handle makes the whole card long-press draggable and
    // leaves swipes to the rail. On a mouse the handle keeps text selection and
    // the card's own buttons usable, and dragging straight from the grip starts
    // immediately, because the sensor skips its activation delay for a press
    // that lands on the handle itself.
    handle: coarse ? undefined : handle,
  });

  const silent = daysSince(application.lastActivityAt) >= SILENCE_DAYS;
  const isOffer = application.status === "offer";
  const isRejected = application.status === "rejected";
  const isInterview = application.status === "interview";

  return (
    <article
      ref={ref}
      data-testid="application-card"
      data-application-id={application.id}
      data-dragging={dragging || undefined}
      data-drop-target={isDropTarget || undefined}
      onClick={(event) => {
        // A touch tap anywhere on the card opens details, so the whole card is
        // a target rather than just the title. Its own buttons are skipped:
        // they have their own actions, and dnd-kit treats them as interactive
        // for the same reason.
        if (!coarse || event.defaultPrevented) {
          return;
        }
        if ((event.target as Element).closest("button, a, input, textarea")) {
          return;
        }
        onOpen();
      }}
      className={cn(
        "bg-card group relative rounded-lg border p-3 transition-shadow",
        "hover:border-foreground/25 hover:shadow-sm",
        coarse && "p-4",
        // While the card is in the air the original slot keeps its height but
        // fades out, so the column never collapses under the pointer.
        isDragSource && "opacity-40",
        isDropTarget && "border-primary/60 ring-primary/20 ring-2",
        // Offer cards get a subtle emerald ring
        isOffer && "ring-2 ring-emerald-500/40",
        // Rejected cards are dimmed
        isRejected && "opacity-60",
        // Interview cards get a subtle amber accent
        isInterview && "border-amber-500/30",
        // Silent cards get a warning border
        silent && "border-amber-500/50",
      )}
    >
      {/* Status indicator bar at top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 rounded-t-lg",
          isOffer && "bg-emerald-500",
          isInterview && "bg-amber-500",
          isRejected && "bg-rose-500",
          application.status === "applied" && "bg-sky-500",
        )}
        aria-hidden="true"
      />

      <div className="flex items-start gap-2">
        <Avatar className={cn("shrink-0", coarse ? "size-9" : "size-7")}>
          <AvatarFallback
            className={cn(
              "bg-muted text-muted-foreground font-semibold",
              coarse ? "text-xs" : "text-[11px]",
            )}
          >
            {initials(application.company)}
          </AvatarFallback>
        </Avatar>

        {/* The identity block doubles as the "open details" target, so a card
            can be inspected without going through the three-dot menu. */}
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "min-w-0 flex-1 cursor-pointer text-left",
            coarse && "py-1",
          )}
        >
          {/* A heading inside a button is invalid HTML, so the level is set by
              role instead. The board is still navigable by heading. */}
          <span
            role="heading"
            aria-level={3}
            className="block truncate text-sm font-semibold"
            title={application.company}
          >
            {application.company}
          </span>
          <span
            className="text-muted-foreground block truncate text-xs"
            title={application.role}
          >
            {application.role}
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          {/* Only the handle starts a drag on a pointer device, so text
              selection and the menu keep working on the rest of the card. On
              touch there is no hover to reveal it and the whole card is the
              handle, so it is not rendered at all. */}
          {coarse ? null : (
            <button
              ref={handle}
              type="button"
              aria-label={`Drag ${application.company}`}
              className="text-muted-foreground hover:text-foreground cursor-grab touch-none rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
            >
              <HugeiconsIcon icon={Drag01Icon} className="size-4" aria-hidden />
            </button>
          )}

          {onRequestActions ? (
            <button
              type="button"
              aria-label={`Actions for ${application.company}`}
              onClick={onRequestActions}
              /* 44px on touch, where a 20px target is a miss waiting to happen. */
              className={cn(
                "text-muted-foreground hover:text-foreground rounded",
                coarse ? "-mr-2 size-11" : "p-1",
              )}
            >
              <IconMore className={coarse ? "size-5" : "size-4"} aria-hidden />
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Actions for ${application.company}`}
                    className="text-muted-foreground hover:text-foreground rounded p-1"
                  />
                }
              >
                <IconMore className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{application.company}</DropdownMenuLabel>
                <DropdownMenuItem onClick={onOpen}>
                  Open details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                {STATUSES.filter((status) => status !== application.status).map(
                  (status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onMove(status)}
                    >
                      {STATUS_META[status].title}
                    </DropdownMenuItem>
                  ),
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {silent ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          <IconClock className="size-3" aria-hidden />
          No response in {daysSince(application.lastActivityAt)} days
        </p>
      ) : null}

      <dl className="text-muted-foreground mt-2 space-y-1 text-[11px]">
        {application.location ? (
          <div className="flex items-center gap-1">
            <dt className="sr-only">Location</dt>
            <IconMapPin className="size-3 shrink-0" aria-hidden />
            <dd className="truncate">{application.location}</dd>
          </div>
        ) : null}
        {application.salary ? (
          <div className="flex items-center gap-1">
            <dt className="sr-only">Salary</dt>
            <IconDollar className="size-3 shrink-0" aria-hidden />
            <dd className="truncate tabular-nums">{application.salary}</dd>
          </div>
        ) : null}
      </dl>

      <footer className="text-muted-foreground mt-3 flex items-center justify-between text-[11px]">
        <span>Applied {relativeDays(application.appliedAt)}</span>
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={NoteIcon} className="size-3" aria-hidden />
          <span className="tabular-nums">{application.notes.length}</span>
          <span className="sr-only">
            {application.notes.length === 1 ? "note" : "notes"}
          </span>
        </span>
      </footer>
    </article>
  );
}