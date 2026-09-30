import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  IconCalendar,
  IconDollar,
  IconEdit,
  IconExternalLink,
  IconMapPin,
  IconTrash,
} from "@/components/icons";
import {
  STATUSES,
  STATUS_META,
  type Application,
  type Status,
} from "@/lib/applications";
import { shortDate } from "@/lib/date";
import { NotesTimeline } from "./notes-timeline";

/**
 * The body shared by the desktop drawer and the mobile bottom sheet, so the two
 * cannot drift apart. Fields are shown rather than edited in place: editing
 * happens in the add/edit dialog, which already owns validation, and having
 * one editor beats two that disagree.
 */
export function ApplicationDetails({
  application,
  onStatusChange,
  onEdit,
  onDelete,
  onAddNote,
  onDeleteNote,
  compact = false,
  notesAtEnd = false,
}: {
  application: Application;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddNote: (body: string) => void;
  onDeleteNote: (noteId: string) => void;
  // The bottom sheet is short, so rows stack tighter.
  compact?: boolean;
  // Passed through to the notes so the mobile sheet can pin the composer.
  notesAtEnd?: boolean;
}) {
  const rows: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }[] = [
    { icon: IconMapPin, label: "Location", value: application.location },
    { icon: IconDollar, label: "Salary", value: application.salary },
    {
      icon: IconCalendar,
      label: "Applied",
      value: shortDate(application.appliedAt),
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {application.company}
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {application.role}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <IconEdit className="size-4" aria-hidden />
            Edit
          </Button>
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="detail-status"
            className="text-muted-foreground text-xs font-medium"
          >
            Status
          </label>
          <Select
            value={application.status}
            onValueChange={(value) => {
              if (value) {
                onStatusChange(value as Status);
              }
            }}
          >
            <SelectTrigger id="detail-status" className="w-full">
              <SelectValue>{STATUS_META[application.status].title}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  label={STATUS_META[status].title}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${STATUS_META[status].dot}`}
                    />
                    {STATUS_META[status].title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section aria-labelledby="detail-heading" className="grid gap-2">
        <h3 id="detail-heading" className="text-sm font-semibold">
          Details
        </h3>
        <dl className={compact ? "grid gap-1.5" : "grid gap-2"}>
          {rows
            .filter((row) => row.value)
            .map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <dt className="text-muted-foreground flex w-20 shrink-0 items-center gap-1.5">
                    <Icon className="size-3.5" aria-hidden />
                    {row.label}
                  </dt>
                  <dd className="min-w-0 flex-1 truncate tabular-nums">
                    {row.value}
                  </dd>
                </div>
              );
            })}
          <div className="flex items-center gap-2 text-xs">
            <dt className="text-muted-foreground flex w-20 shrink-0 items-center gap-1.5">
              <IconExternalLink className="size-3.5" aria-hidden />
              Job URL
            </dt>
            <dd className="min-w-0 flex-1 truncate">
              {application.jobUrl ? (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:underline"
                >
                  {application.jobUrl.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <NotesTimeline
        application={application}
        onAdd={onAddNote}
        onDelete={onDeleteNote}
        composerAtEnd={notesAtEnd}
      />

      <div className="border-t pt-4">
        <Button type="button" variant="destructive" onClick={onDelete}>
          <IconTrash className="size-4" aria-hidden />
          Delete application
        </Button>
      </div>
    </div>
  );
}
