import { useMemo, useState } from "react";
import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconMore } from "@/components/icons";
import {
  STATUSES,
  STATUS_META,
  type Application,
  type Status,
} from "@/lib/applications";
import { useBoard } from "@/lib/use-board";
import { initials, shortDate } from "@/lib/date";

type RowHandlers = {
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
};

type SortKey = "company" | "status" | "appliedAt" | "lastActivityAt";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<Status, number> = {
  applied: 0,
  screening: 1,
  interview: 2,
  offer: 3,
  rejected: 4,
};

function sortApps(
  apps: Application[],
  key: SortKey,
  dir: SortDir,
): Application[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...apps].sort((a, b) => {
    switch (key) {
      case "company":
        return (
          a.company.localeCompare(b.company, undefined, {
            sensitivity: "base",
          }) * factor
        );
      case "status":
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * factor;
      case "lastActivityAt":
        return (
          (new Date(a.lastActivityAt).getTime() -
            new Date(b.lastActivityAt).getTime()) *
          factor
        );
      case "appliedAt":
      default:
        return (
          (new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()) *
          factor
        );
    }
  });
}

function SortButton({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label}${active ? ` (${dir === "asc" ? "ascending" : "descending"})` : ""}`}
      className={cn(
        "hover:text-foreground inline-flex cursor-pointer items-center gap-1 font-medium",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <span aria-hidden className="text-[10px]">
        {active ? (dir === "asc" ? "▲" : "▼") : ""}
      </span>
    </button>
  );
}

/** Flat sortable table over every visible application. */
export function TableView({ onOpen, onEdit, onDelete, onMove }: RowHandlers) {
  const { board, visibleColumns } = useBoard();
  const [sortKey, setSortKey] = useState<SortKey>("appliedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const apps = useMemo(() => {
    const visible = new Set(Object.values(visibleColumns).flat());
    const all = Object.values(board.applications).filter((app) =>
      visible.has(app.id),
    );
    return sortApps(all, sortKey, sortDir);
  }, [board, visibleColumns, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "company" ? "asc" : "desc");
    }
  }

  return (
    <div
      data-testid="table-view"
      className="min-h-0 flex-1 overflow-auto px-3 pt-3 pb-8 sm:px-4"
    >
      <div className="bg-card overflow-hidden rounded-xl border">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b text-xs">
              <th scope="col" className="px-3 py-2.5 font-medium">
                <SortButton
                  label="Company"
                  sortKey="company"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 font-medium lg:table-cell"
              >
                Location
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 font-medium xl:table-cell"
              >
                Salary
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                <SortButton
                  label="Status"
                  sortKey="status"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                <SortButton
                  label="Applied"
                  sortKey="appliedAt"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 font-medium md:table-cell"
              >
                <SortButton
                  label="Updated"
                  sortKey="lastActivityAt"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-right font-medium sm:table-cell"
              >
                Notes
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {apps.map((application) => {
              const meta = STATUS_META[application.status];
              return (
                <tr
                  key={application.id}
                  data-testid="table-row"
                  data-application-id={application.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => onOpen(application.id)}
                      className="flex min-w-0 cursor-pointer items-center gap-2 text-left"
                    >
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[11px] font-semibold">
                          {initials(application.company)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {application.company}
                        </span>
                        <span className="text-muted-foreground block max-w-44 truncate text-xs">
                          {application.role}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="text-muted-foreground hidden max-w-32 truncate px-3 py-2.5 text-xs lg:table-cell">
                    {application.location || "—"}
                  </td>
                  <td className="text-muted-foreground hidden max-w-32 truncate px-3 py-2.5 text-xs tabular-nums xl:table-cell">
                    {application.salary || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className="gap-1.5 font-normal">
                      <span
                        aria-hidden
                        className={cn("size-1.5 rounded-full", meta.dot)}
                      />
                      {meta.title}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-xs whitespace-nowrap">
                    {shortDate(application.appliedAt)}
                  </td>
                  <td className="text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap md:table-cell">
                    {shortDate(application.lastActivityAt)}
                  </td>
                  <td className="text-muted-foreground hidden px-3 py-2.5 text-right text-xs tabular-nums sm:table-cell">
                    {application.notes.length}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            aria-label={`Actions for ${application.company}`}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1.5"
                          />
                        }
                      >
                        <IconMore className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {application.company}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onOpen(application.id)}
                        >
                          Open details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(application.id)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Move to</DropdownMenuLabel>
                        {STATUSES.filter(
                          (status) => status !== application.status,
                        ).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onMove(application.id, status)}
                          >
                            {STATUS_META[status].title}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(application.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
