import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IconEdit, IconNote, IconTrash } from "@/components/icons";
import { STATUSES, STATUS_META, type Application, type Status } from "@/lib/applications";
import { daysSince } from "@/lib/date";

/**
 * The card's action sheet, and the non-drag way to move a card.
 *
 * A long press works, but it is not discoverable and it is not available to
 * anyone using a keyboard, a switch device or assistive tech. This is the
 * reachable equivalent of the desktop three-dot menu: the same actions, laid
 * out as a bottom sheet with 44px rows, because that is what a thumb can hit.
 */
export function CardActionSheet({
  application,
  onOpenChange,
  onOpen,
  onEdit,
  onMove,
  onDelete,
}: {
  application: Application | null;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onMove: (status: Status) => void;
  onDelete: () => void;
}) {
  if (!application) {
    return null;
  }

  const silent = daysSince(application.lastActivityAt) >= 7;

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="truncate">{application.company}</SheetTitle>
        </SheetHeader>

        <div className="grid gap-1">
          <Action icon={<IconNote className="size-4" />} onClick={onOpen}>
            Open details
          </Action>
          <Action icon={<IconEdit className="size-4" />} onClick={onEdit}>
            Edit application
          </Action>
        </div>

        <p className="text-muted-foreground mt-2 px-3 text-xs font-medium">Move to</p>
        <div className="grid gap-1">
          {STATUSES.filter((status) => status !== application.status).map((status) => (
            <Action
              key={status}
              onClick={() => onMove(status)}
              icon={
                <span
                  aria-hidden
                  className={`size-2.5 rounded-full ${STATUS_META[status].dot}`}
                />
              }
            >
              {STATUS_META[status].title}
            </Action>
          ))}
        </div>

        {silent ? (
          <p className="text-muted-foreground mt-3 px-3 text-xs">
            No response in {daysSince(application.lastActivityAt)} days.
          </p>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          className="mt-3 h-11 w-full justify-start"
          onClick={onDelete}
        >
          <IconTrash className="size-4" aria-hidden />
          Delete application
        </Button>
      </SheetContent>
    </Sheet>
  );
}

function Action({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-11 w-full justify-start gap-3 px-3"
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
}
