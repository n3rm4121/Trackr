import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { STATUSES, STATUS_META, type Status } from "@/lib/applications";
import { CV_ACCEPT, CV_MAX_BYTES } from "@/lib/cv";
import { useColumnTitles } from "@/lib/use-column-titles";
import type { ApplicationDraft } from "@/lib/board-context";
import { toDateInputValue } from "@/lib/date";

// The form edits exactly the fields the store's draft type declares, so the two cannot drift apart.
type Draft = ApplicationDraft;

type Errors = Partial<Record<keyof Draft, string>> & { cv?: string };

function emptyDraft(status: Status): Draft {
  return {
    company: "",
    role: "",
    jobUrl: "",
    location: "",
    salary: "",
    jobDescription: "",
    status,
    appliedAt: toDateInputValue(new Date()),
  };
}

/** Validated here rather than on the server because the board has no API yet.
 *  The rules are the ones a job application actually needs: a company and a
 *  role to show on the card, and a URL that will not be rendered broken. */
function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (!draft.company.trim()) {
    errors.company = "Company is required";
  }
  if (!draft.role.trim()) {
    errors.role = "Role is required";
  }
  if (draft.jobUrl.trim() && !/^https?:\/\/\S+$/i.test(draft.jobUrl.trim())) {
    errors.jobUrl = "Enter a full URL starting with http:// or https://";
  }
  if (draft.jobDescription.trim().length > 10000) {
    errors.jobDescription = "Job description must be at most 10000 characters";
  }
  if (!draft.appliedAt) {
    errors.appliedAt = "Applied date is required";
  }
  return errors;
}

function validateCvFile(file: File): string | null {
  if (file.size > CV_MAX_BYTES) {
    return "CV must be at most 5MB";
  }
  return null;
}

type FormProps = {
  mode: "add" | "edit";
  applicationId?: string;
  initial?: Draft;
  existingCvName?: string;
  defaultStatus: Status;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: Draft, id?: string, cvFile?: File | null) => Promise<void> | void;
};

function ApplicationForm({
  mode,
  applicationId,
  initial,
  existingCvName,
  defaultStatus,
  onOpenChange,
  onSubmit,
}: FormProps) {
  // State is seeded once per mount. The parent gives this component a key that
  // changes with the dialog's target, so opening the dialog on a different
  // card remounts it instead of needing an effect to reset it.
  const [draft, setDraft] = useState<Draft>(
    () => initial ?? emptyDraft(defaultStatus),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const cvInput = useRef<HTMLInputElement>(null);
  const titles = useColumnTitles();

  function pickCv(file: File | undefined) {
    if (!file) {
      return;
    }
    setCvFile(file);
    setDragOver(false);
    setErrors((current) =>
      current.cv ? { ...current, cv: undefined } : current,
    );
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) =>
      current[key] ? { ...current, [key]: undefined } : current,
    );
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(draft);
    if (cvFile) {
      const cvError = validateCvFile(cvFile);
      if (cvError) {
        found.cv = cvError;
      }
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await onSubmit(
        draft,
        mode === "edit" ? applicationId : undefined,
        cvFile,
      );
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const field = (
    key: keyof Draft,
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`application-${key}`}>{label}</Label>
      <Input
        id={`application-${key}`}
        name={key}
        type={type}
        value={draft[key] as string}
        placeholder={placeholder}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `application-${key}-error` : undefined}
        onChange={(event) =>
          update(key, event.target.value as Draft[typeof key])
        }
      />
      {errors[key] ? (
        <p id={`application-${key}-error`} className="text-destructive text-xs">
          {errors[key]}
        </p>
      ) : null}
    </div>
  );

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {mode === "add" ? "Add application" : "Edit application"}
        </DialogTitle>
        <DialogDescription>
          {mode === "add"
            ? "Track a role you have applied for."
            : "Update the details on this card."}
        </DialogDescription>
      </DialogHeader>

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("company", "Company", "Stripe")}
          {field("role", "Role", "Frontend Engineer")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("location", "Location", "Dublin, IE · Hybrid")}
          {field("salary", "Salary range", "€95k – €115k")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("jobUrl", "Job URL", "https://…", "url")}
          {field("appliedAt", "Applied date", "", "date")}
        </div>

        <div className="grid gap-2">
          <span id="application-status-label" className="text-sm font-medium">
            Status
          </span>
          <div
            role="radiogroup"
            aria-labelledby="application-status-label"
            className="flex flex-wrap gap-1.5"
          >
            {STATUSES.map((status) => {
              const selected = draft.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("status", status)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", STATUS_META[status].dot)}
                  />
                  {titles[status]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="application-jobDescription">
              Job description
            </Label>
            <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
              {draft.jobDescription.length.toLocaleString()} / 10,000
            </span>
          </div>
          <Textarea
            id="application-jobDescription"
            name="jobDescription"
            value={draft.jobDescription}
            placeholder="Paste the posting: responsibilities, stack, closing date…"
            rows={5}
            className="max-h-56"
            aria-invalid={errors.jobDescription ? true : undefined}
            aria-describedby={
              errors.jobDescription
                ? "application-jobDescription-error"
                : undefined
            }
            onChange={(event) =>
              update("jobDescription", event.target.value)
            }
          />
          {errors.jobDescription ? (
            <p
              id="application-jobDescription-error"
              className="text-destructive text-xs"
            >
              {errors.jobDescription}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <span id="application-cv-label" className="text-sm font-medium">
            CV {mode === "edit" ? "(upload replaces existing)" : "(per job)"}
          </span>
          {mode === "edit" && existingCvName ? (
            <p className="text-muted-foreground text-xs">
              Current file: <span className="font-medium">{existingCvName}</span>
            </p>
          ) : null}
          <input
            ref={cvInput}
            id="application-cv"
            name="cv"
            type="file"
            accept={CV_ACCEPT}
            aria-labelledby="application-cv-label"
            aria-describedby={errors.cv ? "application-cv-error" : undefined}
            className="sr-only"
            onChange={(event) => {
              pickCv(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label={cvFile ? `Attached ${cvFile.name}. Activate to choose a different file.` : "Attach a CV file"}
            onClick={() => cvInput.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                cvInput.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              pickCv(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "grid cursor-pointer gap-1 rounded-lg border border-dashed p-4 text-center transition-colors",
              dragOver
                ? "border-foreground bg-muted"
                : "hover:border-foreground/40",
              errors.cv && "border-destructive",
            )}
          >
            {cvFile ? (
              <span className="flex items-center justify-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-left font-medium">
                  {cvFile.name}
                </span>
                <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                  {(cvFile.size / 1024).toFixed(1)} KB
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Remove attached file"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCvFile(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      setCvFile(null);
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive shrink-0 rounded px-1 text-xs underline"
                >
                  Remove
                </span>
              </span>
            ) : (
              <>
                <span className="text-sm font-medium">
                  Drop your CV here or <span className="underline">browse</span>
                </span>
                <span className="text-muted-foreground text-[11px]">
                  PDF, Word, TXT or RTF · max 5MB · a different CV per job
                </span>
              </>
            )}
          </div>
          {errors.cv ? (
            <p id="application-cv-error" className="text-destructive text-xs">
              {errors.cv}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function ApplicationDialog({
  open,
  ...rest
}: FormProps & { open: boolean }) {
  return (
    <Dialog open={open} onOpenChange={rest.onOpenChange}>
      {open ? (
        <ApplicationForm
          key={rest.applicationId ?? `new-${rest.defaultStatus}`}
          {...rest}
        />
      ) : null}
    </Dialog>
  );
}
