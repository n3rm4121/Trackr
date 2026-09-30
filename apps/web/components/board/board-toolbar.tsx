import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconAdd,
  IconChartBar,
  IconKanban,
  IconMoon,
  IconSearch,
  IconSun,
} from "@/components/icons";
import { initials } from "@/lib/date";
import { useTheme } from "@/lib/use-theme";
import { DESKTOP_BOARD_QUERY, useMediaQuery } from "@/lib/use-media-query";

/**
 * The board's top bar.
 *
 * On a desktop it is one row with everything inline. On a phone it becomes a
 * compact bar — logo, search icon, avatar — because the width does not hold a
 * search field and two buttons, and a field that is always there would push the
 * board below the fold. Search opens a row of its own, and the account actions
 * move into the avatar menu. Adding a card is the board's floating button on
 * mobile, so the Add button is dropped from the bar there.
 */
export function BoardToolbar({
  userName,
  search,
  onSearchChange,
  onAdd,
  onLogout,
  onOpenStats,
}: {
  userName?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onLogout: () => void;
  onOpenStats: () => void;
}) {
  const { theme, toggle } = useTheme();
  const desktop = useMediaQuery(DESKTOP_BOARD_QUERY);
  const [searchOpen, setSearchOpen] = useState(false);

  const field = (id: string, autoFocus: boolean) => (
    <div className="relative">
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
        placeholder="Search"
        className="h-9 pl-8"
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {search ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onSearchChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1"
        >
          <HugeiconsIcon icon={CancelCircleIcon} className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );

  return (
    <header className="shrink-0 border-b">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
        <h1 className="mr-auto flex min-w-0 items-center gap-2 truncate text-sm font-semibold">
          <IconKanban className="text-primary size-4 shrink-0" aria-hidden />
          Job Kanban
          {userName ? (
            <span className="text-muted-foreground hidden font-normal sm:inline">
              {userName}
            </span>
          ) : null}
        </h1>

        {/* One search control, not two: rendering the desktop field on a phone
            as well would leave a second, hidden control on the page. */}
        {desktop ? <div className="w-52">{field("board-search", false)}</div> : null}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          /* Distinct from the field's own label, so a screen reader meets one
             "Search applications" control rather than two with the same name. */
          aria-label={searchOpen ? "Close search" : "Open search"}
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          <IconSearch className="size-4" aria-hidden />
        </Button>

        <Button
          type="button"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={onAdd}
        >
          <IconAdd className="size-4" aria-hidden />
          Add
        </Button>

        <Button type="button" size="sm" variant="outline" onClick={onOpenStats}>
          <IconChartBar className="size-4" aria-hidden />
          Stats
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={desktop ? "" : "hidden"}
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <IconSun className="size-4" aria-hidden />
          ) : (
            <IconMoon className="size-4" aria-hidden />
          )}
        </Button>

        {/* The phone has no room for a sign-out button, so the account sits
            behind the avatar. */}
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
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                {initials(userName ?? "?")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <p className="truncate px-2 py-1.5 text-sm font-medium">{userName}</p>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggle} className="sm:hidden">
              {theme === "dark" ? (
                <IconSun className="size-4" aria-hidden />
              ) : (
                <IconMoon className="size-4" aria-hidden />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAdd} className="sm:hidden">
              <IconAdd className="size-4" aria-hidden />
              Add application
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenStats}>
              <IconChartBar className="size-4" aria-hidden />
              Stats
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="font-medium">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchOpen && !desktop ? (
        <div className="px-3 pb-2">{field("board-search-mobile", true)}</div>
      ) : null}
    </header>
  );
}
