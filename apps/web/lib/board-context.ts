import { createContext } from "react";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/react";
import type { Application, BoardState, Status } from "./applications";

export type ApplicationDraft = {
  company: string;
  role: string;
  jobUrl: string;
  location: string;
  salary: string;
  jobDescription: string;
  status: Status;
  appliedAt: string;
};

// What a finished drag did, so the caller can react without the store having to know about toasts.
export type DragOutcome = {
  reverted: boolean;
  // The move that was attempted, kept so a revert can offer a retry.
  retry: { id: string; status: Status } | null;
};

export type BoardNotice = {
  tone: "success" | "error";
  message: string;
  // Set on a refused move, so the toast can offer the move again.
  retry?: { id: string; status: Status };
};

export type BoardStore = {
  status: "loading" | "error" | "ready";
  /// Why the board could not be read at all. Retryable by definition.
  loadError: unknown;
  reload: () => void;
  /// The one channel for board messages, so there is a single place where a write's outcome turns into words.
  notice: BoardNotice | null;
  clearNotice: () => void;
  board: BoardState;
  search: string;
  setSearch: (value: string) => void;
  isSearching: boolean;
  visibleColumns: Record<Status, string[]>;
  hasAnyResults: boolean;
  stats: {
    total: number;
    activeInterviews: number;
    offers: number;
    rejected: number;
  };
  // Every write returns void: the card is shown optimistically and the  server's answer replaces it, so there is nothing to hand back.
  addApplication: (draft: ApplicationDraft, cvFile?: File | null) => void;
  updateApplication: (
    id: string,
    draft: ApplicationDraft,
    cvFile?: File | null,
  ) => void;
  setStatus: (id: string, status: Status) => void;
  deleteApplication: (id: string) => void;
  addNote: (id: string, body: string) => void;
  deleteNote: (id: string, noteId: string) => void;
  dragStart: (event: DragStartEvent) => void;
  dragOver: (event: DragOverEvent) => void;
  /** Reports what the drop actually did, so the UI can explain a revert. */
  dragEnd: (event: DragEndEvent) => DragOutcome;
  getApplication: (id: string | null) => Application | null;
};

// Kept in its own module so the provider file exports only a component, which  is what fast refresh needs to swap the board in place while developing.
export const BoardContext = createContext<BoardStore | null>(null);
