import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { NoteIcon } from "@hugeicons/core-free-icons";
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
import { IconAdd, IconMore } from "@/components/icons";
import {
  STATUSES,
  STATUS_META,
  type Application,
  type Status,
} from "@/lib/applications";
import { useBoard } from "@/lib/use-board";
import { useColumnLabels } from "@/lib/applications-api";
import { resolveTitles } from "@/lib/use-column-titles";
import { daysSince, initials, relativeDays, shortDate } from "@/lib/date";

type RowHandlers = {
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
};

function RowActions({
  application,
  onOpen,
  onEdit,
  onDelete,
  onMove,
}: RowHandlers & { application: Application }) {
  return (
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
        <DropdownMenuLabel>{application.company}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onOpen(application.id)}>
          Open details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(application.id)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {STATUSES.filter((status) => status !== application.status).map(
          (status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => onMove(application.id, status)}
            >
              {STATUS_META[status].title}
            </DropdownMenuItem>
          ),
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(application.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Compact flat rows grouped under a header per status. */
export function ListView({
  onOpen,
  onEdit,
  onDelete,
  onMove,
  onQuickAdd,
}: RowHandlers & { onQuickAdd: (status: Status) => void }) {
  const { board, visibleColumns } = useBoard();
  const { data: labelData } = useColumnLabels();
  const titles = resolveTitles(labelData ?? null);

  return (
    <div
      data-testid="list-view"
      className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pt-3 pb-8 sm:px-4"
    >
      {STATUSES.map((status) => {
        const ids = visibleColumns[status];
        const meta = STATUS_META[status];
        return (
          <section
            key={status}
            aria-labelledby={`list-${status}`}
            data-testid="list-group"
            data-status={status}
          >
            <header className="mb-2 flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-2 rounded-full", meta.dot)}
              />
              <h2
                id={`list-${status}`}
                className="text-sm font-semibold"
              >
                {titles[status]}
              </h2>
              <span
                data-testid="list-group-count"
                className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
              >
                {ids.length}
              </span>
              <button
                type="button"
                onClick={() => onQuickAdd(status)}
                aria-label={`Add application to ${titles[status]}`}
                className="text-muted-foreground hover:bg-background hover:text-foreground ml-auto rounded-md border p-1 transition-colors"
              >
                <IconAdd className="size-3.5" aria-hidden />
              </button>
            </header>
            {ids.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-xs">
                No applications in {titles[status]}
              </p>
            ) : (
              <ul className="bg-card divide-y divide-border overflow-hidden rounded-xl border">
                {ids.map((id) => {
                  const application = board.applications[id];
                  if (!application) return null;
                  const silent =
                    daysSince(application.lastActivityAt) >= 7;
                  return (
                    <li
                      key={id}
                      data-testid="list-row"
                      data-application-id={id}
                      className="hover:bg-muted/40 flex items-center gap-3 px-3 py-2.5 transition-colors"
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[11px] font-semibold">
                          {initials(application.company)}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => onOpen(id)}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <span className="block truncate text-sm font-semibold">
                          {application.company}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {application.role}
                          {application.location
                            ? ` · ${application.location}`
                            : ""}
                        </span>
                      </button>
                      <span className="text-muted-foreground hidden w-24 shrink-0 truncate text-xs tabular-nums md:block">
                        {application.salary || "—"}
                      </span>
                      <span
                        className="text-muted-foreground hidden w-24 shrink-0 text-xs sm:block"
                        title={shortDate(application.appliedAt)}
                      >
                        {relativeDays(application.appliedAt)}
                      </span>
                      {silent ? (
                        <Badge
                          variant="outline"
                          className="hidden shrink-0 border-amber-500/40 text-amber-700 lg:inline-flex dark:text-amber-400"
                        >
                          {daysSince(application.lastActivityAt)}d quiet
                        </Badge>
                      ) : null}
                      <span className="text-muted-foreground hidden items-center gap-1 text-xs tabular-nums sm:flex">
                        <HugeiconsIcon
                          icon={NoteIcon}
                          className="size-3"
                          aria-hidden
                        />
                        {application.notes.length}
                      </span>
                      <RowActions
                        application={application}
                        onOpen={onOpen}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onMove={onMove}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
