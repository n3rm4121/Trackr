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
 * Desktop detail panel: a right-hand sheet 480px wide. The mobile build swaps
 * this for a bottom sheet — see components/board/mobile/detail-sheet.tsx — and
 * both render the same ApplicationDetails body.
 */
export function ApplicationDrawer({
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
      <SheetContent side="right" className="w-full sm:max-w-[480px]">
        <SheetHeader className="sr-only">
          <SheetTitle>{application?.company ?? "Application"}</SheetTitle>
          <SheetDescription>Application details and notes</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-6 pb-6">
          {application ? (
            <ApplicationDetails
              application={application}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddNote={onAddNote}
              onDeleteNote={onDeleteNote}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
