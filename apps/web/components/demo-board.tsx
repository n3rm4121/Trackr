"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_META, type Status, type Application } from "@/lib/applications";
import { initials } from "@/lib/date";
import { IconDollar, IconMapPin } from "@/components/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { NoteIcon, InboxIcon } from "@hugeicons/core-free-icons";

const STATUSES: Status[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

const DEMO_APPLICATIONS: Application[] = [
  {
    id: "1",
    company: "Stripe",
    role: "Senior Software Engineer",
    jobUrl: "https://stripe.com/jobs",
    location: "San Francisco, CA",
    salary: "$180K–$250K",
    jobDescription: "",
    cvFileName: "",
    cvMime: "",
    cvSize: 0,
    status: "applied",
    appliedAt: "2024-11-15",
    lastActivityAt: "2024-11-15",
    notes: [{ id: "1", body: "Applied via referral from Sarah", createdAt: "2024-11-15" }],
  },
  {
    id: "2",
    company: "Linear",
    role: "Staff Engineer",
    jobUrl: "https://linear.app/careers",
    location: "Remote (US)",
    salary: "$200K–$280K",
    jobDescription: "",
    cvFileName: "linear-cv.pdf",
    cvMime: "application/pdf",
    cvSize: 42000,
    status: "screening",
    appliedAt: "2024-11-10",
    lastActivityAt: "2024-11-10",
    notes: [{ id: "2", body: "Love their product philosophy", createdAt: "2024-11-10" }],
  },
  {
    id: "3",
    company: "Vercel",
    role: "Senior Frontend Engineer",
    jobUrl: "https://vercel.com/careers",
    location: "San Francisco, CA",
    salary: "$170K–$240K",
    jobDescription: "",
    cvFileName: "",
    cvMime: "",
    cvSize: 0,
    status: "interview",
    appliedAt: "2024-11-05",
    lastActivityAt: "2024-11-20",
    notes: [
      { id: "3", body: "Phone screen scheduled for Nov 22", createdAt: "2024-11-18" },
      { id: "4", body: "Recruiter called - very positive", createdAt: "2024-11-20" },
    ],
  },
  {
    id: "4",
    company: "Notion",
    role: "Software Engineer",
    jobUrl: "https://notion.so/careers",
    location: "New York, NY",
    salary: "$160K–$220K",
    jobDescription: "",
    cvFileName: "",
    cvMime: "",
    cvSize: 0,
    status: "offer",
    appliedAt: "2024-10-28",
    lastActivityAt: "2024-11-18",
    notes: [
      { id: "5", body: "Onsite completed", createdAt: "2024-11-10" },
      { id: "6", body: "Offer received! $210K base + equity", createdAt: "2024-11-18" },
    ],
  },
  {
    id: "5",
    company: "Figma",
    role: "Senior Backend Engineer",
    jobUrl: "https://figma.com/careers",
    location: "Remote",
    salary: "$190K–$260K",
    jobDescription: "",
    cvFileName: "",
    cvMime: "",
    cvSize: 0,
    status: "rejected",
    appliedAt: "2024-10-20",
    lastActivityAt: "2024-11-01",
    notes: [{ id: "7", body: "Not moving forward after onsite", createdAt: "2024-11-01" }],
  },
  {
    id: "6",
    company: "Ramp",
    role: "Full Stack Engineer",
    jobUrl: "https://ramp.com/careers",
    location: "New York, NY",
    salary: "$170K–$230K",
    jobDescription: "",
    cvFileName: "",
    cvMime: "",
    cvSize: 0,
    status: "rejected",
    appliedAt: "2024-10-15",
    lastActivityAt: "2024-10-30",
    notes: [{ id: "8", body: "Generic rejection email", createdAt: "2024-10-30" }],
  },
];

function ApplicationCardDemo({ application }: { application: Application }) {
  const isOffer = application.status === "offer";
  const isRejected = application.status === "rejected";

  return (
    <article
      className={`
        bg-card group relative rounded-lg border p-3 transition-shadow
        hover:border-foreground/25 hover:shadow-sm
        ${isOffer ? "ring-2 ring-emerald-500/50" : ""}
        ${isRejected ? "opacity-70" : ""}
      `}
    >
      <div className="flex items-start gap-2">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-[11px]">
            {initials(application.company)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold" title={application.company}>
            {application.company}
          </span>
          <span className="text-muted-foreground block truncate text-xs" title={application.role}>
            {application.role}
          </span>
        </div>
      </div>

      <dl className="text-muted-foreground mt-2 space-y-1 text-[11px]">
        {application.location ? (
          <div className="flex items-center gap-1">
            <dt className="sr-only">Location</dt>
            <IconMapPin className="size-3 shrink-0" aria-hidden />
            <dd className="truncate">{application.location}</dd>
          </div>
        ) : null}
        {application.salary ? (
          <div className="flex items-center gap-1">
            <dt className="sr-only">Salary</dt>
            <IconDollar className="size-3 shrink-0" aria-hidden />
            <dd className="truncate tabular-nums">{application.salary}</dd>
          </div>
        ) : null}
      </dl>

      <footer className="text-muted-foreground mt-3 flex items-center justify-between text-[11px]">
        <span>Applied Nov {new Date(application.appliedAt).getDate()}</span>
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={NoteIcon} className="size-3" aria-hidden />
          <span className="tabular-nums">{application.notes.length}</span>
          <span className="sr-only">
            {application.notes.length === 1 ? "note" : "notes"}
          </span>
        </span>
      </footer>
    </article>
  );
}

function ColumnDemo({ status, applications }: { status: Status; applications: Application[] }) {
  const meta = STATUS_META[status];
  const isHighlighted = status === "offer";

  return (
    <section
      aria-labelledby={`demo-column-${status}`}
      data-status={status}
      className={`
        bg-muted/40 flex min-h-0 min-w-0 flex-col rounded-xl border border-transparent
        ${isHighlighted ? "border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/20" : ""}
      `}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
        <h2 id={`demo-column-${status}`} className="min-w-0 flex-1 truncate text-sm font-semibold">
          {meta.title}
        </h2>
        <span className="bg-background text-muted-foreground rounded-full border px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
          {applications.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "thin" }}>
        {applications.length === 0 ? (
          <div className="text-muted-foreground flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-6 text-center">
            <HugeiconsIcon icon={InboxIcon} className="size-5 opacity-60" aria-hidden />
            <p className="text-xs">No applications yet</p>
            <p className="text-[11px] opacity-80">Drag a card here</p>
          </div>
        ) : (
          applications.map((app) => <ApplicationCardDemo key={app.id} application={app} />)
        )}
      </div>
    </section>
  );
}

export function DemoBoard() {
  const columns = STATUSES.map((status) => ({
    status,
    applications: DEMO_APPLICATIONS.filter((a) => a.status === status),
  }));

  return (
    <div
      data-testid="demo-board"
      className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
      role="region"
      aria-label="Demo Kanban board"
    >
      {columns.map(({ status, applications }) => (
        <ColumnDemo key={status} status={status} applications={applications} />
      ))}
    </div>
  );
}