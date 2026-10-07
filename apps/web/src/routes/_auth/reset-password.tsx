import { useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";
import { AuthError, AuthField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/lib/auth";
import { ApiError, type FieldErrors } from "@/lib/api";

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
});

function ResetPasswordPage() {
  const { token } = useSearch({ from: "/_auth/reset-password" });
  const resetPassword = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [done, setDone] = useState(false);

  const resetToken = token;
  if (!resetToken) {
    return (
      <AuthCard
        title="This link is incomplete"
        description="The reset link is missing its token. Request a new one and try again."
        footer={
          <Link
            to="/forgot-password"
            className="text-primary underline underline-offset-4"
          >
            Request a new link
          </Link>
        }
      />
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        description="Your password has been reset and your other sessions have been signed out. Log in with your new password."
        footer={
          <Link
            to="/login"
            className="text-primary underline underline-offset-4"
          >
            Go to log in
          </Link>
        }
      />
    );
  }

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(undefined);

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      await resetPassword.mutateAsync({ token: resetToken, password });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.hasFieldErrors ? undefined : error.message);
      } else {
        setFormError("Something went wrong");
      }
    }
  };

  return (
    <AuthCard
      title="Choose a new password"
      description="Pick something you haven't used here before."
      footer={
        <>
          Changed your mind?{" "}
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
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        <AuthField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
        />
        <AuthError message={formError} />
        <Button type="submit" variant="accent" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </AuthCard>
  );
}
