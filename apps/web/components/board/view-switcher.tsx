import { cn } from "cn";
import { IconKanban, IconList, IconTable } from "@/components/icons";
import type { BoardView } from "@/lib/use-board-view";

const OPTIONS: { id: BoardView; label: string; Icon: typeof IconKanban }[] = [
  { id: "board", label: "Board", Icon: IconKanban },
  { id: "list", label: "List", Icon: IconList },
  { id: "table", label: "Table", Icon: IconTable },
];

/** Segmented control switching the dashboard between board, list and table. */
export function ViewSwitcher({
  view,
  onChange,
}: {
  view: BoardView;
  onChange: (next: BoardView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Change view"
      data-testid="view-switcher"
      className="bg-muted/60 flex items-center gap-0.5 rounded-lg border p-0.5"
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            data-testid={`view-${id}`}
            aria-pressed={active}
            aria-label={`${label} view`}
            title={`${label} view`}
            onClick={() => onChange(id)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-xs ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="hidden lg:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
