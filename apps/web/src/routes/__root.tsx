import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";

const RootLayout = () => (
  <>
    <Navbar />
    <main className="pt-16 min-h-screen" id="main-content">
      <Outlet />
    </main>
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
  },
);