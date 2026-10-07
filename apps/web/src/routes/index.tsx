import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutGroup,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Button } from "@/components/ui/button";
import { DemoBoard } from "@/components/demo-board";
import { PaperclipIcon } from "@/components/navbar";
import { GithubStars } from "@/components/github-stars";
import { config } from "@/lib/config";

export const Route = createFileRoute("/")({
  component: Index,
});

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function Index() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Hero />
      <Ticker />
      <Journey />
      <Graveyard />
      <Features />
      <Numbers />
      <ClosingCta />
      <Footer />
    </div>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      aria-labelledby="hero-title"
      className="relative pt-14 pb-16 sm:pt-20 sm:pb-24"
    >
      {/* faint ruled-paper lines, pure decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,var(--border)_31px,var(--border)_32px)] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mb-5 inline-flex -rotate-2 items-center gap-2 border border-destructive/40 bg-destructive/5 px-3 py-1 font-mono text-xs font-semibold tracking-[0.18em] text-destructive uppercase"
            >
              Built mid-hunt, out of spreadsheet spite
            </motion.p>
            <motion.h1
              id="hero-title"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
              className="font-heading text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl"
            >
              Your job hunt,{" "}
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
                  pinned down.
                </span>
              </span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              Spreadsheets store rows. They don&apos;t answer{" "}
              <RedCircled>“where do I stand?”</RedCircled> Trackr is a board
              where the column a card sits in <em>is</em> its status: drag it
              forward, write the note, watch the pipeline.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EASE_OUT }}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link to="/signup">
                <Button
                  size="lg"
                  variant="accent"
                  className="w-full px-8 py-3 text-base font-semibold sm:w-auto"
                >
                  Start tracking free
                </Button>
              </Link>
              <a href="#journey">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full px-8 py-3 text-base  font-medium sm:w-auto"
                >
                  Watch a card grow up
                </Button>
              </a>
            </motion.div>
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-4 font-mono text-xs text-muted-foreground"
            >
              Free · Open Source · Export your data anytime
            </motion.p>
          </div>

          <HeroDesk reduce={reduce ?? false} />
        </div>
      </div>
    </section>
  );
}

/** Red-pen circle drawn around a phrase, stroke animates in. */
function RedCircled({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block whitespace-nowrap">
      <svg
        aria-hidden
        viewBox="0 0 220 60"
        preserveAspectRatio="none"
        className="absolute -inset-x-2 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+1rem)] text-destructive"
      >
        <motion.path
          d="
        M 205 30
        C 205 44, 166 54, 112 54
        C 60 54, 15 45, 15 30
        C 15 16, 53 7, 103 6
        C 143 5, 180 10, 196 19
      "
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            delay: 1,
            duration: 0.7,
            ease: EASE_OUT,
          }}
        />
      </svg>

      <span className="relative">{children}</span>
    </span>
  );
}

/** The desk corner: a draggable sticky note, a silence-badge card, a taped CV. */
function HeroDesk({ reduce }: { reduce: boolean }) {
  const desk = useRef<HTMLDivElement>(null);
  const float = reduce
    ? {}
    : {
        animate: { y: [0, -8, 0] },
        transition: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };
  return (
    <motion.div
      ref={desk}
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT }}
      className="relative mx-auto hidden w-full max-w-md select-none sm:block"
      aria-hidden
    >
      {/* applied card */}
      <motion.div
        {...float}
        className="relative z-10 rounded-xl border border-border bg-card p-4 shadow-[6px_6px_0_0_var(--border)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-heading text-sm font-bold">
            S
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">Stripe</p>
            <p className="truncate text-sm text-muted-foreground">
              Frontend Engineer
            </p>
          </div>
          <span className="ml-auto rounded-full bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
            Screening
          </span>
        </div>
        <div className="mt-3 border-t border-dashed border-border pt-3 font-mono text-[11px] text-muted-foreground">
          thu 14:00 · technical round booked ✓
        </div>
      </motion.div>

      {/* sticky note, draggable */}
      <motion.div
        drag={!reduce}
        dragConstraints={desk}
        dragElastic={0.2}
        whileDrag={{ scale: 1.06, rotate: 0, cursor: "grabbing" }}
        initial={reduce ? false : { opacity: 0, y: 20, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
        className="absolute -top-10 -right-2 z-20 w-44 cursor-grab bg-accent p-3 font-mono text-xs leading-relaxed text-accent-foreground shadow-lg"
      >
        follow up with Dana (referral!!)
        <span className="mt-1 block text-[10px] opacity-70">drag me ↓</span>
      </motion.div>

      {/* silence badge card */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
        className="absolute -bottom-12 -left-4 z-20 w-60 rounded-lg border border-amber-500/50 bg-card p-3 shadow-xl"
      >
        <p className="truncate text-sm font-semibold">Notion · Full Stack</p>
        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          No response in 9 days
        </p>
      </motion.div>

      {/* paperclip */}
      <motion.div
        initial={reduce ? false : { opacity: 0, rotate: 30 }}
        animate={{ opacity: 1, rotate: 12 }}
        transition={{ duration: 0.6, delay: 0.85, ease: EASE_OUT }}
        className="absolute -bottom-8 right-8 text-muted-foreground"
      >
        <PaperclipIcon className="h-14 w-14" />
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- ticker --------------------------------- */

const TICKER_ITEMS = [
  "Applied",
  "Screening",
  "Interview Scheduled",
  "Offer",
  "Rejected",
];

function Ticker() {
  const reduce = useReducedMotion();
  const row = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="overflow-hidden border-y-2 border-foreground bg-accent py-2.5"
      aria-hidden
    >
      <motion.div
        className="flex w-max items-center gap-8 pr-8 font-mono text-sm font-bold tracking-[0.15em] text-accent-foreground uppercase"
        animate={reduce ? undefined : { x: ["0%", "-33.333%"] }}
        transition={
          reduce
            ? undefined
            : { duration: 30, repeat: Infinity, ease: "linear" }
        }
      >
        {[0, 1, 2].map((copy) => (
          <div key={copy} className="flex items-center gap-8">
            {row.map((item, i) => (
              <span key={`${copy}-${i}`} className="flex items-center gap-8">
                {item}
                <span className="text-lg leading-none">→</span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* --------------------------------- journey --------------------------------- */

const JOURNEY_STAGES = [
  {
    id: "applied",
    label: "Applied",
    dot: "bg-sky-500",
    note: "Sent Tuesday. The waiting begins.",
  },
  {
    id: "screening",
    label: "Screening",
    dot: "bg-violet-500",
    note: "Recruiter replied in 2 days. 20-minute call booked.",
  },
  {
    id: "interview",
    label: "Interview",
    dot: "bg-amber-500",
    note: "Technical round Thursday 14:00. Asked about edge caching.",
  },
  {
    id: "offer",
    label: "Offer",
    dot: "bg-emerald-500",
    note: "Verbal yes. Waiting on the written offer. 🎉",
  },
];

/** A card that hops columns on its own — the product's whole thesis, looping. */
function Journey() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(
      () => setActive((step) => (step + 1) % JOURNEY_STAGES.length),
      2300,
    );
    return () => clearInterval(timer);
  }, [reduce]);

  const stage = JOURNEY_STAGES[active]!;

  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="scroll-mt-20 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            How it feels
          </p>
          <h2
            id="journey-title"
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Watch a card{" "}
            <span className="bg-accent dark:text-accent-foreground px-1">
              grow up
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            The column <em>is</em> the status. Drag a card forward and the whole
            board follows: stats, badges, export.
          </p>
        </div>

        <LayoutGroup>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {JOURNEY_STAGES.map((step, index) => {
              const isActive = index === active;
              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    isActive
                      ? "border-foreground/30 bg-card shadow-[4px_4px_0_0_var(--border)]"
                      : "border-border bg-muted/40"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${step.dot}`}
                    />
                    <p className="truncate text-xs font-semibold">
                      {step.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`Move demo card to ${step.label}`}
                      className="ml-auto rounded px-1 font-mono text-[10px] text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      {index + 1}
                    </button>
                  </div>
                  <div className="min-h-[86px]">
                    {isActive ? (
                      <motion.div
                        layoutId="journey-card"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 260, damping: 28 }
                        }
                        className="rounded-lg border border-foreground/20 bg-card p-2.5 shadow-sm"
                      >
                        <p className="truncate text-sm font-semibold">Vercel</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Full Stack Developer
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground tabular-nums">
                          {index === 0
                            ? "day 0"
                            : `day ${[0, 2, 9, 21][index]}`}
                        </p>
                      </motion.div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </LayoutGroup>

        <div className="mx-auto mt-6 max-w-xl text-center" aria-live="polite">
          <motion.p
            key={stage.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="inline-block border-l-4 border-accent bg-muted/60 px-4 py-2 font-mono text-sm"
          >
            {stage.note}
          </motion.p>
          <div className="mt-4 flex justify-center gap-2">
            {JOURNEY_STAGES.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show ${step.label} stage`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active
                    ? "w-8 bg-foreground"
                    : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- graveyard -------------------------------- */

function Graveyard() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [7, -3]);

  return (
    <section
      aria-labelledby="graveyard-title"
      className="border-y border-border bg-muted/30 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2
            id="graveyard-title"
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            The spreadsheet is where applications go to be forgotten
          </h2>
          <p className="mt-3 text-muted-foreground">
            Twelve tabs, one filter you never clear, and one morning question
            nothing on that screen answers: “what&apos;s my pipeline right now?”
          </p>
        </div>

        <div ref={ref} className="grid gap-10" style={{ perspective: 1200 }}>
          {/* the dead spreadsheet */}
          <motion.figure
            initial={reduce ? false : { opacity: 0, y: 32, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card opacity-90 shadow-md"
          >
            <span
              aria-hidden
              className="absolute top-3 right-4 -rotate-6 border-2 border-destructive/60 px-2 py-0.5 font-mono text-xs font-bold tracking-[0.2em] text-destructive/70 uppercase"
            >
              Before
            </span>
            <figcaption className="border-b border-border bg-muted/60 px-4 py-2.5 font-mono text-xs text-muted-foreground">
              applications_FINAL_v3.xlsx · filter view (1) · last opened 3 weeks
              ago
            </figcaption>
            <table className="w-full font-mono text-xs">
              <tbody className="text-muted-foreground">
                {[
                  ["Stripe", "FE", "???", "…"],
                  ["Linear", "FS", "maybe 2nd?", "…"],
                  ["Notion", "FE", "heard back??", "…"],
                  ["???", "???", "", "…"],
                ].map(([company, role, status, followup], i) => (
                  <tr
                    key={i}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-2.5 line-through opacity-60">
                      {company}
                    </td>
                    <td className="px-2 py-2.5 line-through opacity-60">
                      {role}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="bg-destructive/10 px-1.5 py-0.5 text-destructive">
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right opacity-60">
                      {followup}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.figure>

          {/* the living board — full width, so all five columns breathe */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE_OUT }}
            style={
              reduce ? undefined : { rotateX, transformStyle: "preserve-3d" }
            }
            className="relative overflow-hidden rounded-xl border-2 border-foreground bg-card shadow-[8px_8px_0_0_var(--accent)]"
          >
            <span
              aria-hidden
              className="absolute top-3 right-4 z-10 -rotate-3 bg-accent px-2 py-0.5 font-mono text-xs font-bold tracking-[0.2em] text-accent-foreground uppercase shadow-sm"
            >
              After
            </span>
            <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5" aria-hidden>
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                trackr · Monday, answered
              </span>
            </div>
            <div className="max-h-[420px] overflow-hidden p-4">
              <DemoBoard />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- features --------------------------------- */

const FEATURE_CARDS = [
  {
    title: "Drag the pipeline",
    body: "Applied → Screening → Interview → Offer → Rejected. The order you leave cards in is the order you get back.",
    margin: "start with the + on any column",
    tilt: "-rotate-1",
  },
  {
    title: "Notes on every card",
    body: "Recruiter emails, interview feedback, reminders: a newest-first timeline pinned to the job it belongs to.",
    margin: "no more searching inbox for 'per our call'",
    tilt: "rotate-1",
  },
  {
    title: "The silence badge",
    body: "A card with no movement and no note for seven days gets flagged, so a forgotten application is visible, not remembered.",
    margin: "9 days quiet → nudge",
    tilt: "-rotate-1",
  },
  {
    title: "One CV per job",
    body: "Different versions for different roles. Attach the exact file you sent, preview it inline, download it later.",
    margin: "frontend-cv.pdf ≠ backend-cv.pdf",
    tilt: "rotate-1",
  },
  {
    title: "Stats that sting (nicely)",
    body: "Weekly volume, a funnel by stage, and the cards gone quiet. All derived live from the board, nothing to maintain.",
    margin: "38 days, 14 apps, 3 replies",
    tilt: "-rotate-1",
  },
  {
    title: "Yours to take",
    body: "CSV export of the whole board in board order, dark and light, and every card linkable for the stats page.",
    margin: "no lock-in, ever",
    tilt: "rotate-1",
  },
];

function Features() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="features-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2
            id="features-title"
            className="font-heading max-w-md text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything a hunt needs. Nothing it doesn&apos;t.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: (i % 3) * 0.1,
                ease: EASE_OUT,
              }}
              whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
              className={`group relative rounded-lg border border-border bg-card p-6 shadow-[5px_5px_0_0_var(--border)] transition-shadow hover:shadow-[5px_5px_0_0_var(--accent)] ${feature.tilt}`}
            >
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-heading mt-2 text-xl font-bold">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
              <p className="mt-4 -rotate-1 font-mono text-xs text-destructive">
                ✎ {feature.margin}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- numbers --------------------------------- */

const FUNNEL = [
  { label: "Applied", width: 100, dot: "bg-sky-500" },
  { label: "Screening", width: 64, dot: "bg-violet-500" },
  { label: "Interview", width: 38, dot: "bg-amber-500" },
  { label: "Offer", width: 16, dot: "bg-emerald-500" },
];

function Numbers() {
  const reduce = useReducedMotion();
  return (
    <section
      aria-labelledby="numbers-title"
      className="bg-foreground py-16 text-background sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2
              id="numbers-title"
              className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            >
              The whole hunt,{" "}
              <span className="bg-accent px-1 text-accent-foreground">
                one glance.
              </span>
            </h2>
            <p className="mt-4 max-w-md leading-relaxed opacity-70">
              Every number below is derived live from cards on the board. Add,
              move, or write on a card and the stats change with it. Nothing to
              update, nowhere to drift.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6">
              {[
                ["5", "stages, Screening included"],
                ["1", "request renders the board"],
                ["0", "spreadsheets harmed"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-heading text-5xl font-bold text-accent">
                    {value}
                  </dd>
                  <dd className="mt-1 text-sm opacity-70">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border border-background/20 bg-background/5 p-6">
            <p className="mb-4 font-mono text-xs tracking-[0.2em] uppercase opacity-60">
              Where 50 applications ended up
            </p>
            <div className="grid gap-4">
              {FUNNEL.map((step, i) => (
                <div key={step.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`size-2 rounded-full ${step.dot}`}
                      />
                      {step.label}
                    </span>
                    <span className="font-mono tabular-nums opacity-70">
                      {step.width}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-background/15">
                    <motion.div
                      className={`h-full rounded-full ${step.dot}`}
                      initial={reduce ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.12,
                        ease: EASE_OUT,
                      }}
                      style={{ originX: 0 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- cta ----------------------------------- */

function ClosingCta() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32, rotate: 1 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0.5 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="relative rounded-2xl border-2 border-foreground bg-secondary p-8 text-center shadow-[10px_10px_0_0_var(--accent)] sm:p-14"
        >
          <h2
            id="cta-title"
            className="font-heading text-3xl font-bold tracking-tight text-secondary-foreground sm:text-5xl"
          >
            Know where you stand, every morning.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-secondary-foreground/70">
            Sign up, get a board with one example card waiting, and drag your
            first real application into it before lunch.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup">
              <Button size="lg">Create your board</Button>
            </Link>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-secondary-foreground/30 bg-transparent px-8 py-3 text-base sm:w-auto"
              >
                How it works
              </Button>
            </Link>
          </div>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/20 px-3 py-1.5 font-mono text-xs text-secondary-foreground/70">
              Open source · a star keeps the hunt going
              <GithubStars />
            </span>
          </div>
        </motion.div>
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
          <Link to="/about" className="transition-colors hover:text-foreground">
            About
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
