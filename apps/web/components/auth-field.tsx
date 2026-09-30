import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A labelled input wired for error display: the message is referenced by
 * aria-describedby and the input marked aria-invalid so assistive tech reads
 * the failure with the field.
 */
export function AuthField({
  label,
  name,
  type = "text",
  value,
  onChange,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// For failures that belong to the form rather than a single field.
export function AuthError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="bg-destructive/10 text-destructive rounded-4xl px-3 py-2 text-sm"
    >
      {message}
    </p>
  );
}
