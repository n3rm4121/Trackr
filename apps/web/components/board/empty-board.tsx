import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function EmptyBoard({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        aria-hidden
        className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-2xl"
      >
        <HugeiconsIcon icon={Task01Icon} className="size-8" />
      </div>
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">No applications yet</h2>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          Add the first role you have applied for and it will show up in the
          Applied column. You can drag it across as things progress.
        </p>
      </div>
      <Button type="button" onClick={onAdd}>
        Add your first application
      </Button>
    </div>
  );
}

export function BoardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      data-testid="board-error"
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div
        aria-hidden
        className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-2xl"
      >
        <HugeiconsIcon icon={Alert02Icon} className="size-8" />
      </div>
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Could not load your board</h2>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          {message}
        </p>
      </div>
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div
      data-testid="no-search-results"
      className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <h2 className="text-base font-semibold">No matches for “{query}”</h2>
      <p className="text-muted-foreground text-sm">
        Try a company, a role, or a location.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}
