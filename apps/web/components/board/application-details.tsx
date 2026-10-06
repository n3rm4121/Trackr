import { useRef, useState } from "react";
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
import { useColumnTitles } from "@/lib/use-column-titles";
import {
  cvDownloadUrl,
  useDeleteCv,
  useUploadCv,
} from "@/lib/applications-api";
import { CV_ACCEPT, CV_MAX_BYTES } from "@/lib/cv";
import { shortDate } from "@/lib/date";
import { NotesTimeline } from "./notes-timeline";
import { CvViewerDialog } from "./cv-viewer";
import { ConfirmDialog } from "./confirm-dialog";

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
  const titles = useColumnTitles();
  const deleteCv = useDeleteCv();
  const uploadCv = useUploadCv();
  const hasCv = Boolean(application.cvFileName);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmRemoveCv, setConfirmRemoveCv] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvPicker = useRef<HTMLInputElement>(null);

  // Uploads straight from the details panel, so attaching or swapping the CV
  // never requires a trip through the edit dialog. The board refetch swaps in
  // the saved file once the server answers.
  async function handleCvPicked(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setCvError("CV must be at most 5MB");
      return;
    }
    setCvError(null);
    try {
      await uploadCv.mutateAsync({ id: application.id, file });
    } catch {
      setCvError("Could not upload the CV. Try again.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
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
              <SelectValue>{titles[application.status]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  label={titles[status]}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${STATUS_META[status].dot}`}
                    />
                    {titles[status]}
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
                  className="hover:underline text-accent"
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

      {application.jobDescription ? (
        <section aria-labelledby="job-desc-heading" className="grid gap-2">
          <h3 id="job-desc-heading" className="text-sm font-semibold">
            Job description
          </h3>
          <p className="text-muted-foreground text-xs whitespace-pre-wrap">
            {application.jobDescription}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="cv-heading" className="grid gap-2">
        <h3 id="cv-heading" className="text-sm font-semibold">
          CV submitted
        </h3>
        <input
          ref={cvPicker}
          type="file"
          accept={CV_ACCEPT}
          aria-label={hasCv ? "Replace CV file" : "Add CV file"}
          className="hidden"
          onChange={(event) => {
            void handleCvPicked(event.target.files?.[0]);
            // Reset so picking the same file again still fires a change.
            event.target.value = "";
          }}
        />
        {hasCv ? (
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate font-medium">
                {application.cvFileName}
              </span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {(application.cvSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewerOpen(true)}
              >
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(cvDownloadUrl(application.id), "_blank")
                }
              >
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadCv.isPending}
                onClick={() => cvPicker.current?.click()}
              >
                {uploadCv.isPending ? "Uploading…" : "Replace"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleteCv.isPending}
                onClick={() => setConfirmRemoveCv(true)}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <p className="text-muted-foreground text-xs">
              No CV attached yet. Add the version sent for this job.
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadCv.isPending}
                onClick={() => cvPicker.current?.click()}
              >
                {uploadCv.isPending ? "Uploading…" : "Add CV"}
              </Button>
            </div>
          </div>
        )}
        {cvError ? (
          <p role="alert" className="text-destructive text-xs">
            {cvError}
          </p>
        ) : null}
      </section>

      {hasCv ? (
        <CvViewerDialog
          applicationId={application.id}
          fileName={application.cvFileName}
          mime={application.cvMime}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      ) : null}

      <ConfirmDialog
        open={confirmRemoveCv}
        title={`Remove ${application.cvFileName || "CV"}?`}
        description="The card and its notes stay. Only the attached file is removed."
        confirmLabel="Remove"
        onOpenChange={setConfirmRemoveCv}
        onConfirm={() => {
          deleteCv.mutate(application.id);
          setConfirmRemoveCv(false);
        }}
      />

      <NotesTimeline
        application={application}
        onAdd={onAddNote}
        onDelete={onDeleteNote}
        composerAtEnd={notesAtEnd}
      />

      <div className="border-t pt-4">
        <Button type="button" variant="destructive" onClick={onDelete} className="w-full">
          <IconTrash className="size-4" aria-hidden />
          Delete application
        </Button>
      </div>
    </div>
  );
}