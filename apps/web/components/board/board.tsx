import { useState } from "react";
import {
  DragDropProvider,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/react";
import {
  STATUSES,
  type Application,
  type BoardState,
  type Status,
} from "@/lib/applications";
import { useBoard } from "@/lib/use-board";
import {
  useColumnLabels,
  useUpdateColumnLabels,
} from "@/lib/applications-api";
import { resolveTitles } from "@/lib/use-column-titles";
import {
  DESKTOP_BOARD_QUERY,
  useCoarsePointer,
  useMediaQuery,
} from "@/lib/use-media-query";
import { ApplicationCard } from "./application-card";
import { BoardColumn } from "./board-column";
import { MobileBoard } from "./mobile-board";

// The card shown under the cursor while dragging. A separate render, because
// dnd-kit has already taken the original element out of the flow.

function CardOverlay({ application }: { application: Application }) {
  return (
    <div
      data-testid="card-overlay"
      // The slight rotation and heavier shadow are what make the card read as picked
      className="bg-card rotate-2 rounded-lg border border-primary/40 p-3 shadow-xl shadow-black/20"
    >
      <p className="truncate text-sm font-semibold">{application.company}</p>
      <p className="text-muted-foreground truncate text-xs">
        {application.role}
      </p>
    </div>
  );
}

// The line marking the gap the dragged card will drop into.
function InsertionLine() {
  return (
    <div
      data-testid="insertion-line"
      aria-hidden
      className="border-primary/80 relative h-0.5 rounded-full"
    >
      <span className="bg-primary absolute -top-[3px] left-0 size-2 rounded-full" />
    </div>
  );
}

type CardHandlers = {
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  /// Asks for the action sheet. Only the mobile build passes this.
  onOpenActions?: (id: string) => void;
};

/**
 * A column's cards with an insertion line woven in where the dragged card lands.
 *
 * The line sits immediately before the dragged card's projected position, which
 * the store has already applied through move() as the pointer moved. Reading it
 * from that state rather than from the collision target keeps it steady:
 * dnd-kit can report the dragged card as its own drop target, which made a
 * target-keyed line flicker. A plain function rather than a hook, because it
 * runs once per column inside a loop.
 */
function columnChildren(
  ids: string[],
  board: BoardState,
  activeId: string | null,
  handlers: CardHandlers,
  coarse: boolean,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  ids.forEach((id, index) => {
    const application = board.applications[id];
    if (!application) {
      return;
    }
    if (id === activeId) {
      nodes.push(<InsertionLine key="line" />);
    }
    nodes.push(
      <ApplicationCard
        key={id}
        application={application}
        index={index}
        dragging={id === activeId}
        coarse={coarse}
        onOpen={() => handlers.onOpen(id)}
        onEdit={() => handlers.onEdit(id)}
        onDelete={() => handlers.onDelete(id)}
        onMove={(next) => handlers.onMove(id, next)}
        onRequestActions={
          handlers.onOpenActions
            ? () => handlers.onOpenActions?.(id)
            : undefined
        }
      />,
    );
  });

  return nodes;
}

export function Board({
  onQuickAdd,
  onOpen,
  onEdit,
  onDelete,
  onMove,
  onOpenActions,
  onRevert,
}: CardHandlers & {
  onQuickAdd: (status: Status) => void;
  // A drag was rolled back, so the caller can explain it and offer a retry.
  onRevert?: (retry: { id: string; status: Status }) => void;
}) {
  const { visibleColumns, board, dragStart, dragOver, dragEnd } =
    useBoard();
  const { data: labelData } = useColumnLabels();
  const updateLabels = useUpdateColumnLabels();
  const titles = resolveTitles(labelData ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Status>("applied");
  const desktop = useMediaQuery(DESKTOP_BOARD_QUERY);
  const coarse = useCoarsePointer();
  const active = activeId ? (board.applications[activeId] ?? null) : null;
  // Where the card currently sits, which is where it would be dropped.
  const activeColumn = STATUSES.find((status) =>
    board.columns[status].includes(activeId ?? ""),
  );
  const handlers: CardHandlers = {
    onOpen,
    onEdit,
    onDelete,
    onMove,
    onOpenActions,
  };

  const renderColumn = (status: Status) => (
    <BoardColumn
      key={status}
      status={status}
      title={titles[status]}
      count={visibleColumns[status].length}
      highlighted={status === activeColumn}
      onQuickAdd={onQuickAdd}
      onRename={(renamed, label) =>
        updateLabels.mutate({ ...titles, [renamed]: label })
      }
      showHeader={desktop}
    >
      {columnChildren(
        visibleColumns[status],
        board,
        activeId,
        handlers,
        coarse,
      )}
    </BoardColumn>
  );

  // Configure sensors for drag and drop - pointer for mouse/touch, keyboard for accessibility
  // In dnd-kit v0.5, pass sensor constructors directly in the sensors array
  const sensors = [PointerSensor, KeyboardSensor];

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={(event) => {
        setActiveId(String(event.operation.source?.id ?? ""));
        dragStart(event);
      }}
      onDragOver={dragOver}
      // A cancelled gesture arrives here too, flagged with canceled, so the
      // overlay is dropped whether the drag finished or was abandoned.
      onDragEnd={(event) => {
        const outcome = dragEnd(event);
        setActiveId(null);
        if (outcome.reverted && outcome.retry) {
          onRevert?.(outcome.retry);
        }
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {desktop ? (
          <div
            data-testid="board"
            className="board-desk min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 pb-1 sm:px-4"
          >
            <div className="flex h-full min-h-0 items-stretch gap-3 py-3">
              {STATUSES.map((status) => renderColumn(status))}
            </div>
          </div>
        ) : (
          <div data-testid="board" className="flex min-h-0 flex-1 flex-col">
            <MobileBoard
              active={activeTab}
              titles={titles}
              counts={
                Object.fromEntries(
                  STATUSES.map((status) => [
                    status,
                    visibleColumns[status].length,
                  ]),
                ) as Record<Status, number>
              }
              onActiveChange={setActiveTab}
              onAdd={onQuickAdd}
              renderColumn={renderColumn}
            />
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {active ? <CardOverlay application={active} /> : null}
      </DragOverlay>
    </DragDropProvider>
  );
}