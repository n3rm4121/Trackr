import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a media query from React.
 *
 * The board renders a different layout below the md breakpoint, and the choice
 * is read in JavaScript rather than left to CSS: both layouts register the same
 * column and card test ids, and rendering both at once would duplicate every
 * dnd-kit id on the page.
 *
 * useSyncExternalStore rather than state plus an effect, because a media query
 * is exactly the case it is for: the browser owns the value, React only mirrors
 * it, and there is no intermediate render where the two disagree.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // No layout on the server, so nothing matches.
    () => false,
  );
}

/** The breakpoint where the board switches from tabs to the four-column grid. */
export const DESKTOP_BOARD_QUERY = "(min-width: 768px)";

/** True on devices whose primary input cannot hover, where the card grows its
 *  tap targets, a tap anywhere opens it, and a long press takes over from the
 *  mouse's short drag. */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
