import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";

const RootLayout = () => {
  const location = useLocation();
  // The board routes bring their own chrome (BoardToolbar / stats header),
  // so the marketing navbar would just double up above them.
  const appRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/stats");
  return (
    <>
      {appRoute ? null : <Navbar />}
      <main className={appRoute ? "min-h-screen" : "pt-16 min-h-screen"} id="main-content">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
  },
);