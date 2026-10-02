import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DemoBoard } from "@/components/demo-board";
import { PaperclipIcon } from "@/components/navbar";
import { config } from "@/lib/config";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with live demo board */}
      <section
        aria-labelledby="hero-title"
        className="relative py-16 sm:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <PaperclipIcon className="w-4 h-4" />
              <span>Now in public beta</span>
            </div> */}
            <h1
              id="hero-title"
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6"
            >
              Your job hunt,{" "}
              <span className="relative">
                organized.
                <span
                  className="absolute bottom-[0.15em] left-0 right-0 h-[0.35em] bg-accent/40 -z-10 pointer-events-none"
                  aria-hidden="true"
                />
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Stop losing track of applications in spreadsheets. Drag cards. Add
              notes. See the pipeline. Get hired.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-accent text-accent-foreground hover:brightness-95 active:brightness-105 px-8 py-3 text-base font-medium"
                >
                  Start tracking free
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-3 text-base font-medium border-border hover:bg-muted"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          {/* The demo board - the product itself */}
          <div className="relative">
            <div
              className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none h-16 bottom-0 top-auto"
              aria-hidden="true"
            />
            <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full bg-rose-500"
                      aria-hidden="true"
                    />
                    <div
                      className="w-3 h-3 rounded-full bg-amber-500"
                      aria-hidden="true"
                    />
                    <div
                      className="w-3 h-3 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground font-mono">
                    trackr.local
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded">
                    DEMO
                  </span>
                  <span>Read-only preview</span>
                </div>
              </div>
              <div className="p-4 min-h-[420px] max-h-[520px]">
                <DemoBoard />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4 max-w-xl mx-auto">
              This is a live preview — drag cards between columns to see how it
              works. Your data stays private when you sign up.
            </p>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section
        aria-labelledby="features-title"
        className="py-16 sm:py-24 bg-muted/30"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="features-title" className="sr-only">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group bg-card rounded-xl border border-border p-6 transition-all hover:border-accent/50 hover:shadow-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:border-accent group-hover:text-accent-foreground transition-colors">
                  <feature.icon
                    className="w-5 h-5 text-accent group-hover:text-accent-foreground transition-colors"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to organize your search?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Free during beta. No credit card. Export your data anytime.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-accent text-accent-foreground hover:brightness-95 active:brightness-105 px-8 py-3 text-base font-medium"
            >
              Create your board
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 font-heading font-semibold text-lg text-foreground hover:opacity-80 transition-opacity"
            >
              <PaperclipIcon className="w-6 h-6 text-accent" />
              <span>{config.site.name}</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link
                to="/about"
                className="hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/login"
                className="hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="hover:text-foreground transition-colors"
              >
                Sign up
              </Link>
            </nav>
            <p className="text-xs text-muted-foreground/70">
              Built with care for job seekers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: "Kanban Board",
    description:
      "Visualize every application. Drag cards from Applied → Interview → Offer. See your pipeline at a glance.",
    icon: KanbanIcon,
  },
  {
    title: "Notes & Timeline",
    description:
      "Add notes to any card — recruiter emails, interview feedback, follow-up reminders. Everything stays with the application.",
    icon: NotesIcon,
  },
  {
    title: "Smart Reminders",
    description:
      "Cards flagged after 7 days of silence. Never forget to follow up. Get nudged when it matters.",
    icon: ClockIcon,
  },
  {
    title: "Private & Portable",
    description:
      "Your data, your control. Export to CSV or JSON anytime. No lock-in, no tracking, no ads.",
    icon: ExportIcon,
  },
];

function KanbanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="6" rx="1" />
      <rect x="10" y="18" width="5" height="3" rx="1" />
      <rect x="17" y="12" width="5" height="9" rx="1" />
    </svg>
  );
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
