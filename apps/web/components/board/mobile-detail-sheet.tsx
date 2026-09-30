import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Application, Status } from "@/lib/applications";
import { ApplicationDetails } from "./application-details";

/**
 * The mobile detail panel: a bottom sheet covering 85% of the viewport.
 *
 * A fixed height rather than one that hugs the content, so the composer at the
 * bottom is always in the same place: a sheet that grew with the number of
 * notes would push the input further away the more notes a card had.
 *
 * It renders the same ApplicationDetails body as the desktop drawer, so a note
 * or a status change behaves identically on either. What changes is the
 * furniture: a drag handle instead of a side handle, and the note composer
 * pinned to the bottom of the sheet so it stays above the keyboard rather than
 * scrolling away behind the note history.
 */
export function MobileDetailSheet({
  application,
  onOpenChange,
  onStatusChange,
  onEdit,
  onDelete,
  onAddNote,
  onDeleteNote,
}: {
  application: Application | null;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddNote: (body: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  return (
    <Sheet open={application !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col gap-0 rounded-t-2xl p-0"
      >
        {/* The affordance for dismissing by dragging, and the only grab target that is not content. */}
        <div
          aria-hidden
          data-testid="sheet-drag-handle"
          className="bg-muted mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full"
        />
        <SheetHeader className="px-4 pt-3 pb-2 text-left">
          <SheetTitle className="sr-only">
            {application?.company ?? "Application"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Application details and notes
          </SheetDescription>
        </SheetHeader>

        {application ? (
          <div
            data-testid="mobile-detail"
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <ApplicationDetails
              application={application}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddNote={onAddNote}
              onDeleteNote={onDeleteNote}
              compact
              notesAtEnd
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
