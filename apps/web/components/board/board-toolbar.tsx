"use client";

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { config } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconAdd, IconChartBar, IconDownload, IconMoon, IconSearch, IconSun } from "@/components/icons";
import { initials } from "@/lib/date";
import type { BoardView } from "@/lib/use-board-view";
import { PaperclipIcon } from "@/components/navbar";
import { useTheme } from "@/lib/use-theme";
import { StatStrip } from "./stat-strip";
import { ViewSwitcher } from "./view-switcher";

/**
 * The board's top bar, in two rows.
 *
 * Row one is the app nav: logo, search, theme toggle, account menu.
 * Row two is the board controls: stats summary, view switcher, Add, Stats,
 * Export. The account menu carries the same actions on small screens, where
 * the row-two buttons are hidden.
 */
export function BoardToolbar({
  userName,
  search,
  onSearchChange,
  onAdd,
  onLogout,
  onOpenStats,
  onExport,
  stats,
  view,
  onViewChange,
}: {
  userName?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onLogout: () => void;
  onOpenStats: () => void;
  onExport: () => void;
  stats: { total: number; activeInterviews: number; offers: number };
  view: BoardView;
  onViewChange: (next: BoardView) => void;
}) {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const field = (id: string, autoFocus: boolean) => (
    <div className="relative w-full">
      <IconSearch
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <label htmlFor={id} className="sr-only">
        Search applications
      </label>
      <Input
        id={id}
        type="search"
        value={search}
        autoFocus={autoFocus}
        placeholder="Search…"
        className="h-9 pl-8 bg-background border-border"
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {search ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onSearchChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1"
        >
          <HugeiconsIcon
            icon={CancelCircleIcon}
            className="size-4"
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );

  return (
    <header className="shrink-0 bg-background/95 backdrop-blur-sm">
      {/* Row one: app nav */}
      <nav
        aria-label="Primary"
        className="flex h-14 items-center gap-2 px-3 sm:px-4"
      >
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-heading font-semibold text-lg text-foreground hover:opacity-80 transition-opacity"
          aria-label={`${config.site.name} - Home`}
        >
          <PaperclipIcon className="w-6 h-6 text-accent" />
          <span className="hidden sm:block">{config.site.name}</span>
        </Link>

        <div className="mx-auto hidden w-full max-w-md sm:block">
          {field("board-search", false)}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="sm:hidden"
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <IconSearch className="size-4" aria-hidden />
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
              <IconSun className="size-4" aria-hidden />
            ) : (
              <IconMoon className="size-4" aria-hidden />
            )}
          </Button>

          {userName && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="rounded-full outline-offset-2"
                  />
                }
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-accent/10 text-accent text-[11px] font-semibold">
                    {initials(userName ?? "?")}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <p className="truncate px-2 py-1.5 text-sm font-medium">
                  {userName}
                </p>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onAdd}
                  className="sm:hidden"
                >
                  <IconAdd className="size-4" aria-hidden />
                  Add application
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onOpenStats}
                  className="md:hidden"
                >
                  <IconChartBar className="size-4" aria-hidden />
                  Stats
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onExport}
                  disabled={stats.total === 0}
                  className="md:hidden"
                >
                  <IconDownload className="size-4" aria-hidden />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void navigate({ to: "/settings" })}
                >
                  Change password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="font-medium text-destructive"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {searchOpen ? (
        <div className="border-t px-3 py-2 sm:hidden">
          {field("board-search-mobile", true)}
        </div>
      ) : null}

      {/* Row two: board controls */}
      <div className="flex items-center gap-2 border-t px-3 py-2 sm:px-4">
        <div className="hidden min-w-0 md:block">
          <StatStrip
            total={stats.total}
            activeInterviews={stats.activeInterviews}
            offers={stats.offers}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ViewSwitcher view={view} onChange={onViewChange} />

          <Button
            type="button"
            size="sm"
            className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground/90 font-medium"
            onClick={onAdd}
          >
            <IconAdd className="size-4" aria-hidden />
            Add
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenStats}
            className="hidden md:inline-flex"
          >
            <IconChartBar className="size-4" aria-hidden />
            Stats
          </Button>

          {/* The bar is tight between md and lg, so the button is the icon alone
              there and picks up its label once there is room for one. The
              sr-only span keeps it named for a screen reader either way. */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onExport}
            disabled={stats.total === 0}
            className="hidden md:inline-flex"
          >
            <IconDownload className="size-4" aria-hidden />
            <span className="hidden lg:inline">Export</span>
            <span className="sr-only lg:hidden">Export CSV</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
