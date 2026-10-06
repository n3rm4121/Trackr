import { STATUS_DEFAULT_TITLES, type ColumnLabels } from "@trackr/shared";
import { useColumnLabels } from "./applications-api";
import { STATUS_META, type Status } from "./applications";

/** Merges the server's per-user renames over the built-in titles. */
export function resolveTitles(labels?: ColumnLabels | null): Record<Status, string> {
  return {
    applied: labels?.applied ?? STATUS_DEFAULT_TITLES.applied,
    screening: labels?.screening ?? STATUS_DEFAULT_TITLES.screening,
    interview: labels?.interview ?? STATUS_DEFAULT_TITLES.interview,
    offer: labels?.offer ?? STATUS_DEFAULT_TITLES.offer,
    rejected: labels?.rejected ?? STATUS_DEFAULT_TITLES.rejected,
  };
}

export function useColumnTitles(): Record<Status, string> {
  const { data } = useColumnLabels();
  return resolveTitles(data ?? null);
}

export function titleFor(status: Status, labels?: ColumnLabels | null): string {
  if (labels?.[status]) return labels[status];
  return STATUS_META[status].title;
}
