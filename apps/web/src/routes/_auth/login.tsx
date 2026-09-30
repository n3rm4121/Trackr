import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";
import { AuthError, AuthField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/lib/auth";
import { ApiError, type FieldErrors } from "@/lib/api";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(undefined);

    try {
      await login.mutateAsync({ email, password });
      await navigate({ to: "/dashboard" });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.hasFieldErrors ? undefined : error.message);
      } else {
        setFormError("Something went wrong");
      }
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to keep your job applications in one place."
      footer={
        <>
          New here?{" "}
          <Link
            to="/signup"
            className="text-primary underline underline-offset-4"
          >
            Create an account
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
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Forgot your password?
          </Link>
        </div>
        <AuthError message={formError} />
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
