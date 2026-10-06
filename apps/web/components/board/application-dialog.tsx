import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, type Status } from "@/lib/applications";
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
  const titles = useColumnTitles();

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
    <DialogContent>
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
        {field("company", "Company", "Stripe")}
        {field("role", "Role", "Frontend Engineer")}
        {field("jobUrl", "Job URL", "https://…", "url")}
        {field("location", "Location", "Dublin, IE · Hybrid")}
        {field("salary", "Salary range", "€95k – €115k")}

        <div className="grid gap-1.5">
          <Label htmlFor="application-jobDescription">
            Job description
          </Label>
          <Textarea
            id="application-jobDescription"
            name="jobDescription"
            value={draft.jobDescription}
            placeholder="Paste the posting — responsibilities, stack, closing date…"
            rows={4}
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
          <Label htmlFor="application-cv">
            CV {mode === "edit" ? "(upload replaces existing)" : "(per job)"}
          </Label>
          {mode === "edit" && existingCvName ? (
            <p className="text-muted-foreground text-xs">
              Current file: <span className="font-medium">{existingCvName}</span>
            </p>
          ) : null}
          <Input
            id="application-cv"
            name="cv"
            type="file"
            accept={CV_ACCEPT}
            aria-describedby={errors.cv ? "application-cv-error" : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setCvFile(file);
              setErrors((current) =>
                current.cv ? { ...current, cv: undefined } : current,
              );
            }}
          />
          <p className="text-muted-foreground text-[11px]">
            {cvFile
              ? `${cvFile.name} · ${(cvFile.size / 1024).toFixed(1)} KB`
              : "PDF, Word, TXT or RTF · max 5MB. A different CV can be submitted per job."}
          </p>
          {errors.cv ? (
            <p id="application-cv-error" className="text-destructive text-xs">
              {errors.cv}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="application-status">Status</Label>
          <Select
            value={draft.status}
            onValueChange={(value) => {
              if (value) {
                update("status", value as Status);
              }
            }}
          >
            <SelectTrigger id="application-status" className="w-full">
              <SelectValue>{titles[draft.status]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  label={titles[status]}
                >
                  {titles[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {field("appliedAt", "Applied date", "", "date")}

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
