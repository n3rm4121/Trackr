import type { ApplicationStatus } from "@trackr/shared";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

type SeedNote = { body: string; daysAgo: number };

type SampleApplication = {
  company: string;
  role: string;
  jobUrl: string;
  location: string;
  salary: string;
  status: ApplicationStatus;
  appliedDaysAgo: number;
  // Defaults to the applied date, so only cards that have moved say so.
  activityDaysAgo?: number;
  notes?: SeedNote[];
};

export const SAMPLE_APPLICATIONS: SampleApplication[] = [
  // Applied — five cards, a couple of them going quiet.
  {
    company: "Stripe",
    role: "Frontend Engineer",
    jobUrl: "https://stripe.com/jobs/frontend-engineer",
    location: "Dublin, IE · Hybrid",
    salary: "€95k – €115k",
    status: "applied",
    appliedDaysAgo: 2,
  },
  {
    company: "Linear",
    role: "Full Stack Developer",
    jobUrl: "https://linear.app/jobs/full-stack",
    location: "Remote · EU",
    salary: "$160k – $200k",
    status: "applied",
    appliedDaysAgo: 4,
  },
  {
    company: "Notion",
    role: "Frontend Engineer",
    jobUrl: "https://notion.so/careers/frontend",
    location: "San Francisco, US",
    salary: "$180k – $240k",
    status: "applied",
    appliedDaysAgo: 5,
    notes: [
      {
        body: "Referred by Dana — she thinks the team is mid-hire.",
        daysAgo: 4,
      },
    ],
  },
  {
    company: "Shopify",
    role: "Full Stack Developer",
    jobUrl: "https://shopify.com/careers/full-stack",
    location: "Berlin, DE · Hybrid",
    salary: "€105k – €130k",
    status: "applied",
    appliedDaysAgo: 9,
  },
  {
    company: "Vercel",
    role: "Frontend Engineer",
    jobUrl: "https://vercel.com/careers/frontend-engineer",
    location: "Remote · Global",
    salary: "$170k – $215k",
    status: "applied",
    appliedDaysAgo: 12,
  },

  // Interview Scheduled — three cards.
  {
    company: "Vercel",
    role: "Full Stack Developer",
    jobUrl: "https://vercel.com/careers/full-stack-developer",
    location: "Remote · Global",
    salary: "$175k – $220k",
    status: "interview",
    appliedDaysAgo: 18,
    activityDaysAgo: 1,
    notes: [
      {
        body: "Recruiter screen went well. Asked about edge caching.",
        daysAgo: 8,
      },
      { body: "Technical round booked for Thursday 14:00.", daysAgo: 1 },
    ],
  },
  {
    company: "Linear",
    role: "Frontend Engineer",
    jobUrl: "https://linear.app/jobs/frontend",
    location: "Amsterdam, NL · Hybrid",
    salary: "€110k – €135k",
    status: "interview",
    appliedDaysAgo: 21,
    activityDaysAgo: 2,
    notes: [
      { body: "Take-home: a sortable list with keyboard support.", daysAgo: 2 },
    ],
  },
  {
    company: "Shopify",
    role: "Frontend Engineer",
    jobUrl: "https://shopify.com/careers/frontend-engineer",
    location: "Toronto, CA · Remote",
    salary: "CA$150k – CA$190k",
    status: "interview",
    appliedDaysAgo: 25,
    activityDaysAgo: 6,
  },

  // Offer — two cards.
  {
    company: "Stripe",
    role: "Full Stack Developer",
    jobUrl: "https://stripe.com/jobs/full-stack",
    location: "Dublin, IE · Hybrid",
    salary: "€120k – €145k",
    status: "offer",
    appliedDaysAgo: 38,
    activityDaysAgo: 3,
    notes: [
      {
        body: "Offer: 4 days in the office, 1 remote. Equity refresh in year 2.",
        daysAgo: 3,
      },
    ],
  },
  {
    company: "Notion",
    role: "Full Stack Developer",
    jobUrl: "https://notion.so/careers/fullstack",
    location: "London, UK · Hybrid",
    salary: "£135k – £160k",
    status: "offer",
    appliedDaysAgo: 44,
    activityDaysAgo: 1,
    notes: [
      {
        body: "Verbal yes. Waiting on the written offer before I resign anything.",
        daysAgo: 1,
      },
    ],
  },

  // Rejected — deliberately empty, so the empty-column state is on screen.
];

export type { SampleApplication };
