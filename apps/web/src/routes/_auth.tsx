import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserQuery } from "@/lib/auth";

/**
 * Pathless layout shared by every unauthenticated-only route (/login,
 * /signup, /forgot-password, /reset-password). The underscore prefix keeps it
 * out of the URL, so children stay at /login, /signup and so on.
 */
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    // A signed-in visitor has no business on these pages, so send them to the
    // dashboard. A failed /auth/me means there is no session, which is exactly
    // why they are here, so the failure is swallowed rather than thrown.
    const session = await context.queryClient
      .query(currentUserQuery())
      .catch(() => null);

    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
