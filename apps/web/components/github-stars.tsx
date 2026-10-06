"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, StarIcon } from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

const REPO = "n3rm4121/job-kanban";
export const REPO_URL = `https://github.com/${REPO}`;

function formatStars(count: number): string {
  if (count >= 1000) {
    const trimmed = (count / 1000).toFixed(1).replace(/\.0$/, "");
    return `${trimmed}k`;
  }
  return `${count}`;
}

export function GithubStars({ compact = false }: { compact?: boolean }) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}`);
        if (!response.ok) return;
        const data = (await response.json()) as { stargazers_count?: number };
        if (!cancelled && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      } catch {
        // Offline or rate-limited: the link still works, just without a count.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Star Trackr on GitHub"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "font-mono text-xs",
      )}
    >
      <HugeiconsIcon icon={GithubIcon} className="size-4" aria-hidden />
      {!compact ? <span className="hidden sm:inline">Star</span> : null}
      <span className="flex items-center gap-1 tabular-nums">
        <HugeiconsIcon
          icon={StarIcon}
          className="size-3.5 text-accent"
          aria-hidden
        />
        {stars === null ? "—" : formatStars(stars)}
      </span>
    </a>
  );
}
