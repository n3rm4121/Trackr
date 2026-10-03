import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";
import { AuthError, AuthField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/lib/auth";
import { ApiError, type FieldErrors } from "@/lib/api";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const register = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(undefined);

    try {
      await register.mutateAsync({ name, email, password });
      await navigate({ to: "/dashboard", search: { open: undefined } });
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
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center">
      <AuthCard
        title="Create your account"
        description="Track every application from applied to offer."
        footer={
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary underline underline-offset-4"
            >
              Log in
            </Link>
          </>
        }
      >
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <AuthField
            label="Name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={setName}
            error={fieldErrors.name}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
          />
          <AuthError message={formError} />
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Creating account…" : "Sign up"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
