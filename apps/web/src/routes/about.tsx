import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "@/components/navbar";
import { GithubStars, REPO_URL } from "@/components/github-stars";
import { config } from "@/lib/config";

export const Route = createFileRoute("/about")({
  component: About,
});

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function About() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Hero />
      <Timeline />
      <Rules />
      <Principles />
      <Closing />
      <Footer />
    </div>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      aria-labelledby="about-title"
      className="relative pt-14 pb-16 sm:pt-20 sm:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--border)_31px,var(--border)_32px)] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="mb-5 inline-flex -rotate-2 items-center gap-2 border border-destructive/40 bg-destructive/5 px-3 py-1 font-mono text-xs font-semibold tracking-[0.18em] text-destructive uppercase"
        >
          The origin story
        </motion.p>
        <motion.h1
          id="about-title"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
          className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          It started with a spreadsheet{" "}
          <span className="relative inline-block px-1">
            <motion.span
              aria-hidden
              className="absolute inset-0 bg-accent"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.45, ease: EASE_OUT }}
              style={{ originX: 0 }}
            />
            <span className="relative dark:text-accent-foreground">
              and a grudge.
            </span>
          </span>
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          I built this while job hunting. Spreadsheets were messy. Notion was
          too flexible. Trello was too generic. I wanted a board that understood
          the job hunt: stages that match reality, notes that stay with the
          application, and a nudge when an employer goes quiet.
        </motion.p>
      </div>
    </section>
  );
}

/* --------------------------------- timeline -------------------------------- */

const CHAPTERS = [
  {
    when: "Month one",
    title: "Twelve tabs and a spreadsheet",
    body: "Applications lived in rows. Follow-ups lived in memory. Memory lost every single time.",
  },
  {
    when: "Month two",
    title: "The filter view (1)",
    body: "One saved filter I never remembered to clear. Every morning the same unanswered question: what is my pipeline right now?",
  },
  {
    when: "Month three",
    title: "The board",
    body: "A column per stage, drag to move, notes pinned to cards. The pipeline finally had a shape you could see.",
  },
  {
    when: "Month four",
    title: "The silence badge",
    body: "Seven quiet days and the card raises its hand. No application goes forgotten again, even the boring ones.",
  },
  {
    when: "Today",
    title: "Open source",
    body: "If the hunt taught one thing, it is that nobody should do it in a spreadsheet. So here it is: star it, fork it, get hired.",
  },
];

function Timeline() {
  const reduce = useReducedMotion();
  return (
    <section
      aria-labelledby="timeline-title"
      className="border-y border-border bg-muted/30 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2
          id="timeline-title"
          className="font-heading mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl"
        >
          The hunt that built it
        </h2>
        <ol className="relative ml-2 grid gap-8 border-l-2 border-dashed border-border pl-8">
          {CHAPTERS.map((chapter, i) => (
            <motion.li
              key={chapter.title}
              initial={reduce ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: (i % 5) * 0.06,
                ease: EASE_OUT,
              }}
              className="relative"
            >
              <span
                aria-hidden
                className={`absolute top-1.5 -left-8 size-3 -translate-x-1/2 rounded-full border-2 border-background ${
                  i === CHAPTERS.length - 1 ? "bg-accent" : "bg-foreground"
                }`}
              />
              <p className="font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {chapter.when}
              </p>
              <h3 className="font-heading mt-1 text-xl font-bold">
                {chapter.title}
              </h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {chapter.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------- rules ---------------------------------- */

const RULES = [
  {
    no: "01",
    title: "One request per board",
    body: "No per-card fetch. Columns and cards can never be out of step with each other.",
  },
  {
    no: "02",
    title: "One owner of ordering",
    body: "A single repository module may produce a position. Everywhere else consumes an id list.",
  },
  {
    no: "03",
    title: "One contract",
    body: "Every request and response is a Zod schema in a shared package, so the API's validation and the web's types cannot drift.",
  },
];

function Rules() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="rules-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Under the hood
          </p>
          <h2
            id="rules-title"
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Three rules hold it together
          </h2>
          <p className="mt-3 text-muted-foreground">
            React 19, Express 5, Postgres, and Zod everywhere. If you read code,
            the whole thing is one honest afternoon.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {RULES.map((rule, i) => (
            <motion.article
              key={rule.no}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE_OUT }}
              className="rounded-lg border border-border bg-card p-6 shadow-[5px_5px_0_0_var(--border)]"
            >
              <p className="font-mono text-sm font-bold text-accent">
                {rule.no}
              </p>
              <h3 className="font-heading mt-2 text-lg font-bold">
                {rule.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {rule.body}
              </p>
            </motion.article>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-sm text-muted-foreground underline decoration-accent decoration-2 underline-offset-4 hover:text-foreground"
          >
            Read it, fork it, break it, fix it
          </a>
          <GithubStars />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- principles ------------------------------- */

const PRINCIPLES = [
  "No dark patterns. No gamification. No streaks.",
  "Every card moves with the mouse, a thumb, or the keyboard.",
  "The board is the record. Nothing hides behind a paywall.",
];

function Principles() {
  const reduce = useReducedMotion();
  return (
    <section
      aria-labelledby="principles-title"
      className="border-t border-border bg-muted/30 py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2
            id="principles-title"
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            House rules
          </h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
            A job hunt is stressful enough. The tool tracking it should be the
            calmest thing on your desk.
          </p>
          <Link to="/signup" className="mt-6 inline-block">
            <Button
              size="lg"
              className="bg-accent px-8 py-3 text-base font-semibold text-accent-foreground hover:brightness-95 active:brightness-105"
            >
              Try it free
            </Button>
          </Link>
        </div>
        <ol className="grid gap-4">
          {PRINCIPLES.map((principle, i) => (
            <motion.li
              key={principle}
              initial={
                reduce
                  ? false
                  : { opacity: 0, y: 20, rotate: i % 2 === 0 ? -0.6 : 0.6 }
              }
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE_OUT }}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-5 shadow-[4px_4px_0_0_var(--border)]"
            >
              <span
                aria-hidden
                className="font-heading text-2xl font-bold text-destructive"
              >
                ✗
              </span>
              <span className="pt-0.5 leading-relaxed">{principle}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------- closing --------------------------------- */

function Closing() {
  return (
    <section aria-label="Get started" className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Your turn. The board is waiting.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Free and open-source. One example card on arrival. Your data exports
          anytime.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/signup">
            <Button
              size="lg"
              className="w-full bg-accent px-8 py-3 text-base font-semibold text-accent-foreground hover:brightness-95 active:brightness-105 sm:w-auto"
            >
              Create your board
            </Button>
          </Link>
          <GithubStars />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- footer ---------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold transition-opacity hover:opacity-80"
        >
          <PaperclipIcon className="h-6 w-6 text-accent" />
          <span>{config.site.name}</span>
        </Link>
        <nav
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          aria-label="Footer"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link to="/login" className="transition-colors hover:text-foreground">
            Log in
          </Link>
          <Link
            to="/signup"
            className="transition-colors hover:text-foreground"
          >
            Sign up
          </Link>
          <GithubStars compact />
        </nav>
        <p className="font-mono text-xs text-muted-foreground/70">
          Built for job seekers everywhere. 📎
        </p>
      </div>
    </footer>
  );
}
