import {
  STATUSES,
  type Application,
  type BoardState,
  type Status,
} from "./applications";
import { daysSince } from "./date";

/**
 * The read-only views behind the stats page.
 *
 * These are pure functions over the board state rather than values kept in the
 * store, so a card that is added, moved or written on changes the numbers the
 * moment it happens, with nothing to keep in step. Everything here is derived
 * from what the board already holds, so no new state and no new source of truth.
 */

/** A card with no movement and no note for this long is worth a nudge. */
export const FOLLOW_UP_AFTER_DAYS = 7;

export type Kpi = {
  label: string;
  value: string;
  hint: string;
};

export type WeekBucket = {
  // The Monday that starts the week, as YYYY-MM-DD.
  weekStart: string;
  count: number;
  // "4 Aug" for the axis.
  label: string;
};

export type FunnelStep = {
  status: Status;
  count: number;
  // Share of the applied column, as a percentage.
  share: number;
};

export type FollowUp = {
  application: Application;
  days: number;
};

export type BoardInsights = {
  kpis: Kpi[];
  weeks: WeekBucket[];
  funnel: FunnelStep[];
  followUps: FollowUp[];
};

// Monday of the week containing `date`. Weeks start on Monday because that is when a hiring week starts.
function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Applications per week for the last `weeks` weeks, oldest first.
export function weeklyApplications(
  applications: Application[],
  weeks = 8,
  now = new Date(),
): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  const thisWeek = startOfWeek(now);

  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - offset * 7);
    buckets.push({
      weekStart: dayKey(start),
      count: 0,
      label: start.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    });
  }

  const byWeek = new Map(buckets.map((bucket) => [bucket.weekStart, bucket]));
  for (const application of applications) {
    const bucket = byWeek.get(
      dayKey(startOfWeek(new Date(application.appliedAt))),
    );
    if (bucket) {
      bucket.count += 1;
    }
  }

  return buckets;
}

// The four stages, each as a share of everything applied.
export function funnel(board: BoardState): FunnelStep[] {
  const total = board.columns.applied.length;
  return STATUSES.map((status) => {
    const count = board.columns[status].length;
    return {
      status,
      count,
      share: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });
}

/**
 * Cards still in play that have gone quiet, quietest first. A rejected card is
 * not overdue for a follow-up: the answer already came back.
 */
export function needsFollowUp(
  applications: Application[],
  after = FOLLOW_UP_AFTER_DAYS,
  now = new Date(),
): FollowUp[] {
  return applications
    .filter((application) => application.status !== "rejected")
    .map((application) => ({
      application,
      days: daysSince(application.lastActivityAt, now),
    }))
    .filter((entry) => entry.days >= after)
    .sort((a, b) => b.days - a.days);
}

/**
 * The headline numbers. Conversion is stated against the applied column, which
 * is the only count every card passes through, so the percentages compare like
 * with like.
 */
export function kpis(board: BoardState, total: number): Kpi[] {
  const applied = board.columns.applied.length;
  const interviews = board.columns.interview.length;
  const offers = board.columns.offer.length;
  const rejected = board.columns.rejected.length;
  const inPlay = total - rejected;
  const percent = (value: number) =>
    applied === 0 ? "—" : `${Math.round((value / applied) * 100)}%`;

  return [
    { label: "Applied", value: `${applied}`, hint: "sent and waiting" },
    {
      label: "Interviews",
      value: `${interviews}`,
      hint: `${percent(interviews)} of applied`,
    },
    {
      label: "Offers",
      value: `${offers}`,
      hint: `${percent(offers)} of applied`,
    },
    {
      label: "Rejected",
      value: `${rejected}`,
      hint: `${percent(rejected)} of applied`,
    },
    {
      label: "In play",
      value: `${inPlay}`,
      hint: `of ${total} total`,
    },
  ];
}

export function boardInsights(
  board: BoardState,
  now = new Date(),
): BoardInsights {
  const applications = Object.values(board.applications);
  return {
    kpis: kpis(board, applications.length),
    weeks: weeklyApplications(applications, 8, now),
    funnel: funnel(board),
    followUps: needsFollowUp(applications, FOLLOW_UP_AFTER_DAYS, now).slice(
      0,
      6,
    ),
  };
}
