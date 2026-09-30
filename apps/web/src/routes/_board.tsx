import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BoardProvider } from "@/lib/board-store";
import { currentUserQuery } from "@/lib/auth";

export const Route = createFileRoute("/_board")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.query(currentUserQuery());
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: BoardLayout,
});

function BoardLayout() {
  return (
    <BoardProvider>
      <Outlet />
    </BoardProvider>
  );
}
