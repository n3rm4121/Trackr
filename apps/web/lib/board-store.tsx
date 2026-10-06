import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { move } from "@dnd-kit/helpers";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react";
import {
  STATUSES,
  STATUS_META,
  emptyBoard,
  type Application,
  type BoardState,
  type Status,
} from "./applications";
import {
  useAddApplication,
  useAddNote,
  useBoard,
  useDeleteApplication,
  useDeleteNote,
  useReorderApplications,
  useSetStatus,
  useUpdateApplication,
  useUploadCv,
} from "./applications-api";
import {
  BoardContext,
  type ApplicationDraft,
  type BoardNotice,
  type BoardStore,
  type DragOutcome,
} from "./board-context";

/**
 * Points every card's status at the column it currently sits in. The column
 * arrays are the source of truth for position, so anything that disagrees with
 * them is a card whose metadata drifted. */
function syncStatuses(
  applications: BoardState["applications"],
  columns: BoardState["columns"],
): BoardState["applications"] {
  let changed = false;
  const next: BoardState["applications"] = { ...applications };
  for (const status of STATUSES) {
    for (const id of columns[status]) {
      const application = next[id];
      if (application && application.status !== status) {
        next[id] = { ...application, status };
        changed = true;
      }
    }
  }
  return changed ? next : applications;
}

type Optimistic = {
  // The confirmed board this was derived from, so it can be dropped the moment the server's answer arrives instead of overwriting it.
  base: BoardState | null;
  board: BoardState;
};

export function BoardProvider({
  children,
  initialBoard,
}: {
  children: ReactNode;
  /** Renders a fixed board with no API call, which is how the board can still
   *  be shown (and screenshotted) with the server down. */
  initialBoard?: BoardState;
}) {
  const boardRequest = useBoard();
  const addApplicationMutation = useAddApplication();
  const updateApplicationMutation = useUpdateApplication();
  const setStatusMutation = useSetStatus();
  const deleteApplicationMutation = useDeleteApplication();
  const addNoteMutation = useAddNote();
  const deleteNoteMutation = useDeleteNote();
  const reorderMutation = useReorderApplications();
  const uploadCvMutation = useUploadCv();

  const [search, setSearch] = useState("");
  const [optimistic, setOptimistic] = useState<Optimistic | null>(null);
  const [notice, setNotice] = useState<BoardNotice | null>(null);

  // The confirmed board, which is whatever the query last returned.
  const serverBoard = initialBoard ?? boardRequest.data ?? null;

  /**
   * A drag is applied locally on the frame the pointer crosses a column, long
   * before the drop is committed, so the local board can disagree with the
   * server for the length of a gesture.
   *
   * The optimistic layer only shows while it is still based on the board we
   * have. The moment the query delivers a different board — after a save, or a
   * refetch — this layer stops applying itself and the server's answer is what
   * the user sees. Deriving that here rather than in an effect means there is
   * no window where a stale guess is on screen after the real answer arrived.
   */
  const board =
    optimistic && optimistic.base === serverBoard
      ? optimistic.board
      : (serverBoard ?? emptyBoard());

  // Where the dragged card last landed while the pointer was moving, kept so a
  // revert can offer to retry the move the user actually asked for.
  const attempted = useRef<{ id: string; status: Status } | null>(null);
  // The confirmed board as it stood when the current drag began. Both the
  // cancel path and the failed-save path roll back to this.
  const committedBeforeDrag = useRef<BoardState | null>(null);

  const loadState: BoardStore["status"] = initialBoard
    ? "ready"
    : boardRequest.isPending
      ? "loading"
      : boardRequest.isError
        ? "error"
        : "ready";

  /**
   * The outcome of a write, recorded only once the server has answered. Kept as
   * state rather than toasted from here so the store stays unaware of how
   * messages are shown, and so the reader is never told something worked when
   * it did not.
   */
  const report = useCallback((next: BoardNotice) => setNotice(next), []);

  const reportFailure = useCallback(
    (error: unknown, message: string, retry?: BoardNotice["retry"]) => {
      setNotice({ tone: "error", message, retry });
      console.error("board write failed", message, error);
    },
    [],
  );

  const addApplication = useCallback(
    (draft: ApplicationDraft, cvFile?: File | null) => {
      addApplicationMutation.mutate(draft, {
        onSuccess: (created) => {
          if (cvFile) {
            uploadCvMutation.mutate(
              { id: created.id, file: cvFile },
              {
                onSuccess: () =>
                  report({
                    tone: "success",
                    message: "Application added with CV",
                  }),
                onError: (error) =>
                  reportFailure(
                    error,
                    "Application added, but the CV did not upload",
                  ),
              },
            );
          } else {
            report({ tone: "success", message: "Application added" });
          }
        },
        onError: (error) =>
          reportFailure(error, "Could not add the application"),
      });
    },
    [addApplicationMutation, uploadCvMutation, report, reportFailure],
  );

  // Writes a card in place. A status change is a move, not a copy, so the card cannot end up listed under two columns.
  const writeApplication = useCallback(
    (
      source: BoardState,
      id: string,
      patch: Partial<Application>,
      newStatus?: Status,
    ): BoardState => {
      const existing = source.applications[id];
      if (!existing) {
        return source;
      }
      const status = newStatus ?? existing.status;
      const next: Application = {
        ...existing,
        ...patch,
        status,
        lastActivityAt: new Date().toISOString(),
      };

      let columns = source.columns;
      if (status !== existing.status) {
        columns = { ...columns };
        for (const key of STATUSES) {
          columns[key] = columns[key].filter((candidate) => candidate !== id);
        }
        columns[status] = [...columns[status], id];
      }

      return {
        columns,
        applications: { ...source.applications, [id]: next },
      };
    },
    [],
  );

  const updateApplication = useCallback(
    (id: string, draft: ApplicationDraft, cvFile?: File | null) => {
      // Show the edit immediately, then let the server have its say. A
      // refetch replaces it with the saved version.
      setOptimistic({
        base: serverBoard,
        board: writeApplication(
          board,
          id,
          {
            company: draft.company.trim(),
            role: draft.role.trim(),
            jobUrl: draft.jobUrl.trim(),
            location: draft.location.trim(),
            salary: draft.salary.trim(),
            jobDescription: draft.jobDescription.trim(),
            appliedAt: new Date(draft.appliedAt).toISOString(),
          },
          draft.status,
        ),
      });
      updateApplicationMutation.mutate(
        { id, draft },
        {
          onSuccess: () => {
            if (cvFile) {
              uploadCvMutation.mutate(
                { id, file: cvFile },
                {
                  onSuccess: () =>
                    report({
                      tone: "success",
                      message: "Application updated with CV",
                    }),
                  onError: (error) =>
                    reportFailure(
                      error,
                      "Changes saved, but the CV did not upload",
                    ),
                },
              );
            } else {
              report({ tone: "success", message: "Application updated" });
            }
          },
          onError: (error) =>
            reportFailure(error, "Could not save the changes"),
        },
      );
    },
    [
      board,
      writeApplication,
      serverBoard,
      updateApplicationMutation,
      uploadCvMutation,
      report,
      reportFailure,
    ],
  );

  const setStatus = useCallback(
    (id: string, nextStatus: Status) => {
      setOptimistic({
        base: serverBoard,
        board: writeApplication(board, id, {}, nextStatus),
      });
      setStatusMutation.mutate(
        { id, status: nextStatus },
        {
          onSuccess: (application) =>
            report({
              tone: "success",
              message: `${application.company} moved to ${STATUS_META[nextStatus].title}`,
            }),
          onError: (error) => reportFailure(error, "Could not move the card"),
        },
      );
    },
    [
      board,
      writeApplication,
      serverBoard,
      setStatusMutation,
      report,
      reportFailure,
    ],
  );

  const deleteApplication = useCallback(
    (id: string) => {
      // Removed locally straight away: waiting for the round trip leaves a
      // card on screen that the user has already said they want gone.
      if (!board.applications[id]) {
        return;
      }
      const source = board;
      const applications = { ...source.applications };
      delete applications[id];
      const columns = { ...source.columns };
      for (const key of STATUSES) {
        columns[key] = columns[key].filter((candidate) => candidate !== id);
      }
      setOptimistic({ base: serverBoard, board: { columns, applications } });

      deleteApplicationMutation.mutate(id, {
        onSuccess: () =>
          report({ tone: "success", message: "Application deleted" }),
        onError: (error) => {
          setOptimistic(null);
          reportFailure(error, "Could not delete the application");
        },
      });
    },
    [board, serverBoard, deleteApplicationMutation, report, reportFailure],
  );

  const addNote = useCallback(
    (id: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) {
        return;
      }

      // A note is the one write whose delay is felt most: you press enter and
      // the text sits in a composer waiting for a round trip. It appears at once
      // and the refetch swaps in the saved copy.
      const existing = board.applications[id];
      if (existing) {
        setOptimistic({
          base: serverBoard,
          board: {
            columns: board.columns,
            applications: {
              ...board.applications,
              [id]: {
                ...existing,
                notes: [
                  {
                    id: `pending:${crypto.randomUUID()}`,
                    body: trimmed,
                    createdAt: new Date().toISOString(),
                    pending: true,
                  },
                  ...existing.notes,
                ],
              },
            },
          },
        });
      }

      addNoteMutation.mutate(
        { applicationId: id, body: trimmed },
        {
          onError: (error) => {
            setOptimistic(null);
            reportFailure(error, "Could not save the note");
          },
        },
      );
    },
    [board, serverBoard, addNoteMutation, reportFailure],
  );

  const deleteNote = useCallback(
    (id: string, noteId: string) => {
      const source = board;
      const existing = source.applications[id];
      if (existing) {
        setOptimistic({
          base: serverBoard,
          board: {
            columns: source.columns,
            applications: {
              ...source.applications,
              [id]: {
                ...existing,
                notes: existing.notes.filter((note) => note.id !== noteId),
              },
            },
          },
        });
      }

      deleteNoteMutation.mutate(
        { applicationId: id, noteId },
        {
          onError: (error) => {
            setOptimistic(null);
            reportFailure(error, "Could not delete the note");
          },
        },
      );
    },
    [board, serverBoard, deleteNoteMutation, reportFailure],
  );

  const dragStart = useCallback(() => {
    attempted.current = null;
    const source = board;
    // Kept as the source of truth for the whole gesture: every optimistic layer
    // is stacked on the last confirmed board, never on another guess.
    committedBeforeDrag.current = source;
  }, [board]);

  const dragOver = useCallback(
    (event: DragOverEvent) => {
      // dnd-kit mutates optimistically while dragging; move() is what keeps the
      // React state in step so a card can cross into an empty column.
      setOptimistic((current) => {
        // Rebased on the server board whenever this layer no longer sits on it,
        // which is what a refetch landing mid-drag does. Each dragOver builds on
        // the previous one only while the two share a base.
        const source =
          current?.base === serverBoard
            ? current.board
            : (serverBoard ?? emptyBoard());
        const columns = move(source.columns, event);
        const id = String(event.operation.source?.id ?? "");
        const status = STATUSES.find((key) => columns[key].includes(id));
        if (id && status) {
          attempted.current = { id, status };
        }
        return {
          base: serverBoard,
          board: {
            columns,
            // A card's own status has to follow it across columns, or the
            // detail panel and the sortable group would still describe the old
            // column.
            applications: syncStatuses(source.applications, columns),
          },
        };
      });
    },
    [serverBoard],
  );

  const dragEnd = useCallback(
    (event: DragEndEvent): DragOutcome => {
      const retry = attempted.current;
      attempted.current = null;

      // Escape, or a drop dnd-kit refused: nothing was sent, so just put the
      // board back and report the move that was attempted.
      if (event.canceled) {
        const before = committedBeforeDrag.current;
        committedBeforeDrag.current = null;
        setOptimistic(before ? { base: serverBoard, board: before } : null);
        return { reverted: true, retry };
      }

      const before = committedBeforeDrag.current;
      committedBeforeDrag.current = null;

      if (!retry || !before) {
        setOptimistic(null);
        return { reverted: false, retry: null };
      }

      // The order the user actually dropped into, not the one they started
      // from: `board` is the post-drag optimistic board.
      reorderMutation.mutate(board.columns, {
        onSuccess: () => {
          // The mutation replaces the cached board, which changes serverBoard
          // and retires this optimistic layer on its own.
          setOptimistic(null);
        },
        onError: () => {
          // The drop did not stick. Put the board back exactly as it was and
          // say so, with the move to retry — a card that silently snaps back
          // looks like a bug.
          setOptimistic({ base: serverBoard, board: before });
          setNotice({
            tone: "error",
            message: "Couldn't move card. Reverted.",
            retry: { id: retry.id, status: retry.status },
          });
        },
      });

      return { reverted: false, retry: null };
    },
    [board, reorderMutation, serverBoard],
  );

  const clearNotice = useCallback(() => setNotice(null), []);

  const searchQuery = search.trim().toLowerCase();

  const visibleColumns = useMemo(() => {
    if (!searchQuery) {
      return board.columns;
    }
    const match = (id: string) => {
      const application = board.applications[id];
      if (!application) {
        return false;
      }
      return (
        application.company.toLowerCase().includes(searchQuery) ||
        application.role.toLowerCase().includes(searchQuery) ||
        application.location.toLowerCase().includes(searchQuery) ||
        application.jobDescription.toLowerCase().includes(searchQuery)
      );
    };
    return {
      applied: board.columns.applied.filter(match),
      screening: board.columns.screening.filter(match),
      interview: board.columns.interview.filter(match),
      offer: board.columns.offer.filter(match),
      rejected: board.columns.rejected.filter(match),
    } satisfies Record<Status, string[]>;
  }, [board, searchQuery]);

  const stats = useMemo(() => {
    const all = Object.values(board.applications);
    return {
      total: all.length,
      activeInterviews: board.columns.interview.length,
      offers: board.columns.offer.length,
      rejected: board.columns.rejected.length,
    };
  }, [board]);

  const hasAnyResults = useMemo(
    () => STATUSES.some((key) => visibleColumns[key].length > 0),
    [visibleColumns],
  );

  const getApplication = useCallback(
    (id: string | null) => (id ? (board.applications[id] ?? null) : null),
    [board],
  );

  const value = useMemo<BoardStore>(
    () => ({
      status: loadState,
      loadError: boardRequest.isError ? boardRequest.error : null,
      reload: boardRequest.refetch,
      notice,
      clearNotice,
      board,
      search,
      setSearch,
      isSearching: searchQuery.length > 0,
      visibleColumns,
      hasAnyResults,
      stats,
      addApplication,
      updateApplication,
      setStatus,
      deleteApplication,
      addNote,
      deleteNote,
      dragStart,
      dragOver,
      dragEnd,
      getApplication,
    }),
    [
      loadState,
      boardRequest,
      notice,
      clearNotice,
      board,
      search,
      searchQuery,
      visibleColumns,
      hasAnyResults,
      stats,
      addApplication,
      updateApplication,
      setStatus,
      deleteApplication,
      addNote,
      deleteNote,
      dragStart,
      dragOver,
      dragEnd,
      getApplication,
    ],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}
