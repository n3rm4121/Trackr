import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  applicationResponseSchema,
  applicationsResponseSchema,
  columnLabelsResponseSchema,
  noteResponseSchema,
  type AddNoteInput,
  type Application as ApiApplication,
  type ColumnLabels,
  type CreateApplicationInput,
  type Note as ApiNote,
  type ReorderApplicationsInput,
  type UpdateApplicationInput,
} from "@trackr/shared";

import { apiClient, toApiError } from "./api";
import {
  fromApiApplication,
  fromApiNote,
  toApiId,
  type Application,
  type BoardState,
  type Note,
  type Status,
} from "./applications";
import type { ApplicationDraft } from "./board-context";

/**
 * Every application the user can see, which is the whole board. There is no
 * per-card fetch: a board is small, it is read in one request, and one request
 * means the columns and the cards can never be out of step with each other.
 */

export const applicationKeys = {
  all: ["applications"] as const,
  board: () => ["applications", "board"] as const,
};

async function getBoard(): Promise<BoardState> {
  try {
    const { data } = await apiClient.get("/applications");
    const { applications } = applicationsResponseSchema.parse(data);
    return toBoardState(applications);
  } catch (error) {
    throw toApiError(error);
  }
}

// Folds the API's flat list into the columns the board renders.
export function toBoardState(applications: ApiApplication[]): BoardState {
  const board: BoardState = {
    columns: {
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      rejected: [],
    },
    applications: {},
  };

  // The API returns the board in render order, so appending preserves it.
  for (const api of applications) {
    const application = fromApiApplication(api);
    board.applications[application.id] = application;
    board.columns[application.status].push(application.id);
  }

  return board;
}

export const boardQuery = () =>
  queryOptions({
    queryKey: applicationKeys.board(),
    queryFn: getBoard,
    // The board is the user's own and changes only through this app, so
    // refetching it on every window focus would be noise.
    staleTime: 30_000,
    retry: 1,
  });

export function useBoard() {
  return useQuery(boardQuery());
}

export function useAddApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplicationDraft) => {
      const { data } = await apiClient.post(
        "/applications",
        toCreateInput(input),
      );
      const { application } = applicationResponseSchema.parse(data);
      return fromApiApplication(application);
    },
    // Every write refetches the board rather than patching the cache in place.
    // One extra small request is cheaper than a second implementation of the
    // column and position rules, and it cannot disagree with the server.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      draft,
    }: {
      id: string;
      draft: ApplicationDraft;
    }) => {
      const { data } = await apiClient.patch(`/applications/${id}`, {
        company: draft.company,
        role: draft.role,
        jobUrl: draft.jobUrl,
        location: draft.location,
        salary: draft.salary,
        jobDescription: draft.jobDescription,
        status: draft.status,
        appliedAt: new Date(draft.appliedAt).toISOString(),
      } satisfies UpdateApplicationInput);
      const { application } = applicationResponseSchema.parse(data);
      return fromApiApplication(application);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useSetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { data } = await apiClient.patch(`/applications/${id}`, { status });
      const { application } = applicationResponseSchema.parse(data);
      return fromApiApplication(application);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/applications/${id}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      body,
    }: {
      applicationId: string;
      body: string;
    }) => {
      const { data } = await apiClient.post(
        `/applications/${applicationId}/notes`,
        { body } satisfies AddNoteInput,
      );
      const { note } = noteResponseSchema.parse(data);
      return fromApiNote(note);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      noteId,
    }: {
      applicationId: string;
      noteId: string;
    }) => {
      await apiClient.delete(`/applications/${applicationId}/notes/${noteId}`);
      return noteId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

/**
 * A drop sends the whole board and replaces the cache with the answer, so what
 * the user sees afterwards is what the database decided rather than an
 * optimistic guess that might have been rejected.
 */
export function useReorderApplications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columns: BoardState["columns"]) => {
      const payload: ReorderApplicationsInput = {
        columns: {
          applied: columns.applied.map(toApiId),
          screening: columns.screening.map(toApiId),
          interview: columns.interview.map(toApiId),
          offer: columns.offer.map(toApiId),
          rejected: columns.rejected.map(toApiId),
        },
      };

      const { data } = await apiClient.post("/applications/reorder", payload);
      const { applications } = applicationsResponseSchema.parse(data);
      return toBoardState(applications);
    },
    onSuccess: (board) => {
      queryClient.setQueryData(applicationKeys.board(), board);
    },
  });
}

function toCreateInput(draft: ApplicationDraft): CreateApplicationInput {
  return {
    company: draft.company,
    role: draft.role,
    jobUrl: draft.jobUrl,
    location: draft.location,
    salary: draft.salary,
    jobDescription: draft.jobDescription,
    status: draft.status,
    appliedAt: new Date(draft.appliedAt).toISOString(),
  };
}

export const columnLabelKeys = {
  all: ["column-labels"] as const,
};

export function useColumnLabels() {
  return useQuery({
    queryKey: columnLabelKeys.all,
    queryFn: async (): Promise<ColumnLabels> => {
      const { data } = await apiClient.get("/applications/columns/labels");
      return columnLabelsResponseSchema.parse(data).labels;
    },
    staleTime: 60_000,
  });
}

export function useUpdateColumnLabels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labels: ColumnLabels) => {
      const { data } = await apiClient.put("/applications/columns/labels", {
        labels,
      });
      return columnLabelsResponseSchema.parse(data).labels;
    },
    onSuccess: (labels) => {
      queryClient.setQueryData(columnLabelKeys.all, labels);
    },
  });
}

export function useUploadCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("cv", file);
      const { data } = await apiClient.post(`/applications/${id}/cv`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { application } = applicationResponseSchema.parse(data);
      return fromApiApplication(application);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useDeleteCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/applications/${id}/cv`);
      const { application } = applicationResponseSchema.parse(data);
      return fromApiApplication(application);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function cvDownloadUrl(id: string): string {
  return `/api/applications/${id}/cv`;
}

export type { ApiApplication, ApiNote, Application, Note };
