import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "@/components/navbar";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
            <PaperclipIcon className="w-4 h-4" />
            <span>Job Kanban</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Built for{" "}
            <span className="relative">
              job seekers,
              <span className="absolute bottom-[0.15em] left-0 right-0 h-[0.35em] bg-accent/40 -z-10 pointer-events-none" aria-hidden="true" />
            </span>
            by job seekers.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            I built this while job hunting in 2024. Spreadsheets were messy.
            Notion was too flexible. Trello was too generic. I wanted a board
            that understood the job hunt — statuses that match reality, notes
            that stay with the application, reminders that actually help.
          </p>
          <Link to="/signup">
            <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:brightness-95 active:brightness-105 px-8 py-3 text-base font-medium">
              Try it free
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-6">Why this exists</h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  The average job search takes 3–6 months and 100+ applications.
                  Most tools treat every application the same — a row in a
                  spreadsheet, a card in a generic board. But a job application
                  has a lifecycle: applied, phone screen, technical interview,
                  onsite, offer, negotiation. Or rejection. Each stage needs
                  different information.
                </p>
                <p>
                  Job Kanban models that lifecycle. Four columns that match
                  reality. Notes that travel with the card. A silence badge that
                  appears after a week of no response — because the worst part
                  of job hunting isn't rejection, it's the waiting.
                </p>
                <p>
                  It's free during beta. No credit card. Your data exports to
                  CSV or JSON in one click. If you stop using it, you take your
                  history with you.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <article className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-3">The stack</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Frontend</dt>
                    <dd className="font-medium tabular-nums">React 19 + TanStack Router</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">State</dt>
                    <dd className="font-medium tabular-nums">TanStack Query + custom store</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Drag & drop</dt>
                    <dd className="font-medium tabular-nums">@dnd-kit</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Styling</dt>
                    <dd className="font-medium tabular-nums">Tailwind CSS v4 + shadcn/ui</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-ogeneous">Fonts</dt>
                    <dd className="font-medium tabular-nums">Raleway (display) + Outfit (body)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Backend</dt>
                    <dd className="font-medium tabular-nums">Node.js + Express + PostgreSQL</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Auth</dt>
                    <dd className="font-medium tabular-nums">HttpOnly cookies, JWT, refresh tokens</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Deploy</dt>
                    <dd className="font-medium tabular-nums">Docker + Cloudflare</dd>
                  </div>
                </dl>
              </article>
              <article className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-3">Principles</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">•</span>
                    <span>No dark patterns. No gamification. No streaks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">•</span>
                    <span>Keyboard-first. Screen-reader tested. Reduced motion respected.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">•</span>
                    <span>Fast by default. No heavy bundles. Server-rendered where it counts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">•</span>
                    <span>Open source. MIT licensed. Fork it, self-host it, improve it.</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 font-heading font-semibold text-lg text-foreground hover:opacity-80 transition-opacity">
              <PaperclipIcon className="w-6 h-6 text-accent" />
              <span>Job Kanban</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
            </nav>
            <p className="text-xs text-muted-foreground/70">Built with care for job seekers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}