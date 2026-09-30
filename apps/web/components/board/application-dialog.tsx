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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, STATUS_META, type Status } from "@/lib/applications";
import type { ApplicationDraft } from "@/lib/board-context";
import { toDateInputValue } from "@/lib/date";

// The form edits exactly the fields the store's draft type declares, so the two cannot drift apart.
type Draft = ApplicationDraft;

type Errors = Partial<Record<keyof Draft, string>>;

function emptyDraft(status: Status): Draft {
  return {
    company: "",
    role: "",
    jobUrl: "",
    location: "",
    salary: "",
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
  if (!draft.appliedAt) {
    errors.appliedAt = "Applied date is required";
  }
  return errors;
}

type FormProps = {
  mode: "add" | "edit";
  applicationId?: string;
  initial?: Draft;
  defaultStatus: Status;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: Draft, id?: string) => Promise<void> | void;
};

function ApplicationForm({
  mode,
  applicationId,
  initial,
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

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) =>
      current[key] ? { ...current, [key]: undefined } : current,
    );
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await onSubmit(draft, mode === "edit" ? applicationId : undefined);
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
              <SelectValue>{STATUS_META[draft.status].title}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  label={STATUS_META[status].title}
                >
                  {STATUS_META[status].title}
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
