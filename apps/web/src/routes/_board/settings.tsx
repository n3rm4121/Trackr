import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";
import { AuthError, AuthField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/lib/auth";
import { ApiError, type FieldErrors } from "@/lib/api";

export const Route = createFileRoute("/_board/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(undefined);

    // Checked here so the round trip is only spent on a plausible change.
    // The server enforces the same rules again and refuses identical ones.
    if (!currentPassword) {
      setFieldErrors({ currentPassword: "Current password is required" });
      return;
    }
    if (newPassword.length < 8) {
      setFieldErrors({
        newPassword: "Password must be at least 8 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDone(true);
    } catch (error) {
      setDone(false);
      if (error instanceof ApiError) {
        if (error.status === 401) {
          // The only 401 this endpoint answers: the current password was wrong.
          setFieldErrors({ currentPassword: error.message });
        } else {
          setFieldErrors(error.fieldErrors);
          setFormError(error.hasFieldErrors ? undefined : error.message);
        }
      } else {
        setFormError("Something went wrong");
      }
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center">
      <AuthCard
        title="Settings"
        description="Change the password you sign in with. You stay signed in on this device."
        footer={
          <>
            <p>Done here?</p>
            <Link
              to="/dashboard"
              className="text-primary pl-2 underline underline-offset-4"
            >
              Back to your board
            </Link>
          </>
        }
      >
        {done ? (
          <p
            role="status"
            className="rounded-4xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
          >
            Password changed. Use the new one next time you sign in.
          </p>
        ) : null}
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <AuthField
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value);
              setDone(false);
            }}
            error={fieldErrors.currentPassword}
          />
          <AuthField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              setDone(false);
            }}
            error={fieldErrors.newPassword}
          />
          <AuthField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setDone(false);
            }}
            error={fieldErrors.confirmPassword}
          />
          <AuthError message={formError} />
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
