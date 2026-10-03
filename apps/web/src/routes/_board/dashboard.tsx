import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Board } from "@/components/board/board";
import { BoardSkeleton } from "@/components/board/board-skeleton";
import {
  BoardError,
  EmptyBoard,
  NoSearchResults,
} from "@/components/board/empty-board";
import { ApplicationDialog } from "@/components/board/application-dialog";
import { ApplicationDrawer } from "@/components/board/application-drawer";
import { CardActionSheet } from "@/components/board/card-action-sheet";
import { MobileDetailSheet } from "@/components/board/mobile-detail-sheet";
import { ConfirmDialog } from "@/components/board/confirm-dialog";
import { BoardToolbar } from "@/components/board/board-toolbar";
import { useBoard } from "@/lib/use-board";
import type { Status } from "@/lib/applications";
import { useCurrentUser, useLogout } from "@/lib/auth";
import { downloadApplicationsCsv } from "@/lib/csv";
import { toDateInputValue } from "@/lib/date";
import { DESKTOP_BOARD_QUERY, useMediaQuery } from "@/lib/use-media-query";

export const Route = createFileRoute("/_board/dashboard")({
  // ?open=<id> opens a card's details on arrival, which is how the stats page
  // sends someone to a specific application. The key is declared optional
  // rather than as `string | undefined`: the router reads a key it must be
  // handed as a required search param, which would make every Link and
  // navigate to this route carry `search: { open: undefined }` forever.
  validateSearch: (
    search?: Record<string, unknown>,
  ): { open?: string } => ({
    open: typeof search?.open === "string" ? search.open : undefined,
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { open: openParam } = Route.useSearch();
  const { data } = useCurrentUser();
  const logout = useLogout();
  const desktop = useMediaQuery(DESKTOP_BOARD_QUERY);
  const {
    status,
    loadError,
    reload,
    notice,
    clearNotice,
    search,
    setSearch,
    isSearching,
    hasAnyResults,
    stats,
    board,
    addApplication,
    updateApplication,
    setStatus,
    deleteApplication,
    addNote,
    deleteNote,
    getApplication,
  } = useBoard();

  const [dialog, setDialog] = useState<
    { mode: "add"; status: Status } | { mode: "edit"; id: string } | null
  >(null);
  // The opened card is the URL's, so the details panel survives a refresh and
  // can be linked to. Fall back to local state for the in-page interactions.
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);

  // In-page state wins over the URL: ?open= is how a card is linked to, but
  // once someone has opened or closed something here, the URL is stale and
  // must not drag the panel back.
  const openId = openedId ?? openParam ?? null;
  const open = getApplication(openId);
  const deleting = getApplication(pendingDelete);
  const actionSheet = getApplication(actionSheetId);

  // The store raises one message per confirmed write, so the reader is told
  // what actually happened rather than what was attempted. A refused move
  // carries the move itself, which is worth offering back.
  useEffect(() => {
    if (!notice) {
      return;
    }
    const { tone, message, retry } = notice;
    toast[tone](
      message,
      retry
        ? {
            action: {
              label: "Retry",
              onClick: () => setStatus(retry.id, retry.status),
            },
            onDismiss: clearNotice,
          }
        : undefined,
    );
    clearNotice();
  }, [notice, clearNotice, setStatus]);

  function closeDetails() {
    setOpenedId(null);
    if (openParam) {
      void navigate({ to: "/dashboard", search: { open: undefined } });
    }
  }

  function showDetails(id: string) {
    setOpenedId(id);
  }

  async function handleLogout() {
    await logout.mutateAsync();
    await navigate({ to: "/" });
  }

  function handleMove(id: string, next: Status) {
    setStatus(id, next);
  }

  /** Downloads every application, not just the ones the search is showing: an
   *  export is the reader taking their data away, so it leaves with all of it.
   *  The count comes back from the export so the toast can say what went into
   *  the file rather than leaving the reader to open it and count. */
  function handleExport() {
    const count = downloadApplicationsCsv(board);
    toast.success(
      `Exported ${count} ${count === 1 ? "application" : "applications"}`,
      { description: "CSV downloaded to this device." },
    );
  }

  /** A drag the user abandoned (Escape, or a drop the gesture library
   *  rejected). Nothing was sent, so the board was simply put back. */
  function handleRevert(retry: { id: string; status: Status }) {
    const company = getApplication(retry.id)?.company ?? "Card";
    toast.success("Move cancelled", {
      description: `${company} stayed put.`,
      action: {
        label: "Move anyway",
        onClick: () => setStatus(retry.id, retry.status),
      },
    });
  }

  // The same details, notes and status control either way; only the furniture
  // around them changes.
  const detailProps = {
    application: open,
    onOpenChange: (next: boolean) => {
      if (!next) {
        closeDetails();
      }
    },
    onStatusChange: (next: Status) => {
      if (openId) {
        handleMove(openId, next);
      }
    },
    onEdit: () => {
      if (openId) {
        setDialog({ mode: "edit", id: openId });
      }
    },
    onDelete: () => {
      if (openId) {
        closeDetails();
        setPendingDelete(openId);
      }
    },
    onAddNote: (body: string) => {
      if (openId) {
        addNote(openId, body);
      }
    },
    onDeleteNote: (noteId: string) => {
      if (openId) {
        deleteNote(openId, noteId);
      }
    },
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BoardToolbar
        userName={data?.user.name}
        onLogout={handleLogout}
        onAdd={() => setDialog({ mode: "add", status: "applied" })}
        onSearchChange={setSearch}
        search={search}
        onOpenStats={() => void navigate({ to: "/stats" })}
        onExport={handleExport}
        stats={stats}
      />

      {status === "loading" ? (
        <BoardSkeleton />
      ) : status === "error" ? (
        <BoardError message={loadErrorMessage(loadError)} onRetry={reload} />
      ) : stats.total === 0 ? (
        <EmptyBoard
          onAdd={() => setDialog({ mode: "add", status: "applied" })}
        />
      ) : isSearching && !hasAnyResults ? (
        <NoSearchResults query={search.trim()} onClear={() => setSearch("")} />
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <Board
            onQuickAdd={(next) => setDialog({ mode: "add", status: next })}
            onOpen={showDetails}
            onEdit={(id) => setDialog({ mode: "edit", id })}
            onDelete={setPendingDelete}
            onMove={handleMove}
            onOpenActions={setActionSheetId}
            onRevert={handleRevert}
          />
        </div>
      )}

      <ApplicationDialog
        open={dialog !== null}
        mode={dialog?.mode ?? "add"}
        applicationId={dialog?.mode === "edit" ? dialog.id : undefined}
        defaultStatus={
          dialog?.mode === "edit" ? "applied" : (dialog?.status ?? "applied")
        }
        initial={
          dialog?.mode === "edit"
            ? toDraft(getApplication(dialog.id))
            : undefined
        }
        onOpenChange={(next) => {
          if (!next) {
            setDialog(null);
          }
        }}
        onSubmit={(draft, id) => {
          if (id) {
            updateApplication(id, draft);
          } else {
            addApplication(draft);
          }
        }}
      />

      {desktop ? (
        <ApplicationDrawer {...detailProps} />
      ) : (
        <MobileDetailSheet {...detailProps} />
      )}

      <CardActionSheet
        application={actionSheet}
        onOpenChange={(next) => {
          if (!next) {
            setActionSheetId(null);
          }
        }}
        onOpen={() => {
          if (actionSheetId) {
            showDetails(actionSheetId);
            setActionSheetId(null);
          }
        }}
        onEdit={() => {
          if (actionSheetId) {
            setDialog({ mode: "edit", id: actionSheetId });
            setActionSheetId(null);
          }
        }}
        onMove={(next) => {
          if (actionSheetId) {
            handleMove(actionSheetId, next);
            setActionSheetId(null);
          }
        }}
        onDelete={() => {
          if (actionSheetId) {
            setActionSheetId(null);
            setPendingDelete(actionSheetId);
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.company ?? "application"}?`}
        description="This removes the card and its notes. It cannot be undone."
        onOpenChange={(next) => {
          if (!next) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          if (pendingDelete) {
            deleteApplication(pendingDelete);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

/**
 * The API's own words when there are some, because a 403 ("not yours") and a
 * dropped connection need different reactions from the reader. Falls back to
 * something plain rather than leaking a status code or a stack.
 */
function loadErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message) {
      return message;
    }
  }
  return "The request did not go through. Check your connection and try again.";
}

/** The edit dialog is seeded from the card, so its fields have to be the draft
 *  shape with a plain YYYY-MM-DD date for the date input. */
function toDraft(
  application: ReturnType<ReturnType<typeof useBoard>["getApplication"]>,
) {
  if (!application) {
    return undefined;
  }
  return {
    company: application.company,
    role: application.role,
    jobUrl: application.jobUrl,
    location: application.location,
    salary: application.salary,
    status: application.status,
    appliedAt: toDateInputValue(application.appliedAt),
  };
}
