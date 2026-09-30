import { Skeleton } from "@/components/ui/skeleton";
import { STATUSES, STATUS_META } from "@/lib/applications";
import { cn } from "cn";

/**
 * Column-shaped skeletons for the first paint. The card placeholders are a
 * different height from each other so the columns do not look like a grid of
 * identical bars while data is on its way.
 */
export function BoardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" aria-busy="true" aria-label="Loading applications">
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-8 w-40 rounded-full" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((status, columnIndex) => (
          <section
            key={status}
            aria-label={STATUS_META[status].title}
            className="bg-muted/40 flex min-h-0 flex-col rounded-xl p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("size-2 rounded-full opacity-40", STATUS_META[status].dot)} />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: columnIndex === 0 ? 3 : 2 }).map((_, cardIndex) => (
                <Skeleton
                  key={cardIndex}
                  className={cn("rounded-lg", cardIndex % 2 === 0 ? "h-28" : "h-24")}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
