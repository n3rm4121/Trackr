import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/login", label: "Log in" },
  { to: "/signup", label: "Sign up" },
] as const;

const RootLayout = () => (
  <>
    <nav className="flex flex-wrap items-center gap-4 p-4">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors [&.active]:text-foreground [&.active]:font-medium"
        >
          {link.label}
        </Link>
      ))}
    </nav>
    <hr className="border-border" />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

// Route guards read the session through the query client, so the router
// context is what carries it.
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
  },
);
