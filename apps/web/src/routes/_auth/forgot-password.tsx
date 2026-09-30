import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";
import { AuthError, AuthField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "@/lib/auth";
import { ApiError, type FieldErrors } from "@/lib/api";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();

  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(undefined);

    try {
      await forgotPassword.mutateAsync({ email });
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.hasFieldErrors ? undefined : error.message);
      } else {
        setFormError("Something went wrong");
      }
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists for that address, a reset link is on its way. The link expires in an hour."
        footer={
          <>
            Remembered it?{" "}
            <Link
              to="/login"
              className="text-primary underline underline-offset-4"
            >
              Back to log in
            </Link>
          </>
        }
      />
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link
            to="/login"
            className="text-primary underline underline-offset-4"
          >
            Back to log in
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <AuthError message={formError} />
        <Button type="submit" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
