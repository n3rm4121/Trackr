import { useCallback, useState } from "react";

export type BoardView = "board" | "list" | "table";

const STORAGE_KEY = "trackr:board-view";

const VIEWS: readonly BoardView[] = ["board", "list", "table"];

function readInitial(): BoardView {
  if (typeof window === "undefined") {
    return "board";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return VIEWS.includes(stored as BoardView) ? (stored as BoardView) : "board";
}

/** Which layout the dashboard renders. Persisted locally, per device. */
export function useBoardView() {
  const [view, setViewState] = useState<BoardView>(readInitial);

  const setView = useCallback((next: BoardView) => {
    setViewState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the view still works for this visit.
    }
  }, []);

  return { view, setView };
}
