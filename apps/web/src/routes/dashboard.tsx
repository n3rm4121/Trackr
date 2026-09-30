import {
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { currentUserQuery, useCurrentUser, useLogout } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    // Guards the route before it renders. Any failure from /auth/me means
    // there is no session, so the visitor goes back to /login.
    try {
      await context.queryClient.ensureQueryData(currentUserQuery());
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data } = useCurrentUser();
  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    await navigate({ to: "/" });
  }

  return (
    <div className="grid gap-2 p-2">
      <h1 className="text-3xl">Hello world</h1>
      {data ? (
        <p className="text-muted-foreground text-sm">
          Signed in as {data.user.name} ({data.user.email})
        </p>
      ) : null}
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          disabled={logout.isPending}
          onClick={handleLogout}
        >
          {logout.isPending ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </div>
  );
}
