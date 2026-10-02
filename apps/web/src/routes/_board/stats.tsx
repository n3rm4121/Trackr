import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconArrowRight, IconClock, IconKanban } from "@/components/icons";
import { useBoard } from "@/lib/use-board";
import { STATUS_META } from "@/lib/applications";
import {
  boardInsights,
  type FunnelStep,
  type WeekBucket,
} from "@/lib/analytics";
import { initials } from "@/lib/date";
import { useTheme } from "@/lib/use-theme";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/_board/stats")({
  component: Stats,
});

function Stats() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { board, status } = useBoard();
  const insights = boardInsights(board);

  // Opens the card on the board, so the list is a way into the work rather than a report about it.
  function openCard(id: string) {
    navigate({ to: "/dashboard", search: { open: id } });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-end gap-2 border-b px-3 py-2 sm:px-4 bg-background/95 backdrop-blur-sm">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            navigate({ to: "/dashboard", search: { open: undefined } })
          }
        >
          <IconKanban className="size-4" aria-hidden />
          Board
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <HugeiconsIcon icon={Sun01Icon} className="size-4" aria-hidden />
          ) : (
            <HugeiconsIcon icon={Moon01Icon} className="size-4" aria-hidden />
          )}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {status === "loading" ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            Loading your numbers…
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-4">
            <section aria-labelledby="kpi-heading" className="grid gap-2">
              <h2 id="kpi-heading" className="text-sm font-semibold">
                At a glance
              </h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {insights.kpis.map((kpi) => (
                  <li
                    key={kpi.label}
                    data-testid="kpi"
                    className="bg-card rounded-lg border px-3 py-2.5"
                  >
                    <p className="text-muted-foreground text-xs">{kpi.label}</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">
                      {kpi.value}
                    </p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {kpi.hint}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section
                aria-labelledby="volume-heading"
                className="bg-card rounded-lg border p-3"
              >
                <h2 id="volume-heading" className="text-sm font-semibold">
                  Applications per week
                </h2>
                <p className="text-muted-foreground text-xs">
                  The last 8 weeks, by the week they were sent.
                </p>
                <WeeklyChart weeks={insights.weeks} />
              </section>

              <section
                aria-labelledby="funnel-heading"
                className="bg-card rounded-lg border p-3"
              >
                <h2 id="funnel-heading" className="text-sm font-semibold">
                  Where they ended up
                </h2>
                <p className="text-muted-foreground text-xs">
                  Each stage as a share of everything applied.
                </p>
                <Funnel steps={insights.funnel} />
              </section>
            </div>

            <section
              aria-labelledby="followup-heading"
              className="bg-card rounded-lg border p-3"
            >
              <h2
                id="followup-heading"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <IconClock className="text-amber-500 size-4" aria-hidden />
                Needs a follow-up
              </h2>
              {insights.followUps.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-xs">
                  Nothing has gone quiet. Every open application has activity in
                  the last 7 days.
                </p>
              ) : (
                <ul className="mt-2 grid gap-1.5">
                  {insights.followUps.map(({ application, days }) => (
                    <li key={application.id}>
                      <button
                        type="button"
                        onClick={() => openCard(application.id)}
                        className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
                      >
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-accent/10 text-accent text-[11px] font-semibold">
                            {initials(application.company)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {application.company}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {application.role}
                          </span>
                        </span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 gap-1 font-normal"
                        >
                          <span
                            aria-hidden
                            className={`size-1.5 rounded-full ${STATUS_META[application.status].dot}`}
                          />
                          {STATUS_META[application.status].title}
                        </Badge>
                        <span className="text-muted-foreground w-16 shrink-0 text-right text-xs tabular-nums">
                          {days}d quiet
                        </span>
                        <IconArrowRight
                          className="text-muted-foreground size-4 shrink-0"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/** Bars sized against the busiest week, so a quiet fortnight still reads as a
 *  shape rather than five flat columns. */
function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const busiest = Math.max(1, ...weeks.map((week) => week.count));

  return (
    <div
      className="mt-3 flex h-40 items-end gap-1.5"
      data-testid="weekly-chart"
    >
      {weeks.map((week) => (
        <div
          key={week.weekStart}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <span className="text-muted-foreground text-[10px] tabular-nums">
            {week.count > 0 ? week.count : ""}
          </span>
          <div
            className="bg-accent w-full rounded-t"
            style={{ height: `${Math.max(4, (week.count / busiest) * 100)}%` }}
            role="img"
            aria-label={`${week.count} applied in the week of ${week.label}`}
          />
          <span className="text-muted-foreground w-full truncate text-center text-[10px]">
            {week.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Funnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <ul className="mt-3 grid gap-2" data-testid="funnel">
      {steps.map((step) => {
        const meta = STATUS_META[step.status];
        return (
          <li key={step.status} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full ${meta.dot}`}
                />
                <span className="truncate">{meta.title}</span>
              </span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {step.count} · {step.share}%
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${meta.dot}`}
                style={{
                  width: `${Math.max(step.count > 0 ? 6 : 0, step.share)}%`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
