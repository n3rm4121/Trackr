"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { currentUserQuery, useLogout } from "@/lib/auth";
import { useTheme } from "@/lib/use-theme";
import { IconMoon, IconSun } from "@/components/icons";
import { GithubStars } from "@/components/github-stars";
import { config } from "@/lib/config";

export function PaperclipIcon({
  className = "w-5 h-5",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7" />
      <path d="M12 8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
      <path d="M8 13h10" />
    </svg>
  );
}

export function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { data: userData } = useQuery(currentUserQuery());
  const userName = userData?.user?.name;
  const logout = useLogout();
  const { theme, toggle } = useTheme();
  // The board routes own their theme controls (toolbar + menus), so the
  // navbar stays out of their way there.
  const hideTheme =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/stats");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
  ] as const;

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-background/80 backdrop-blur-sm
        transition-all duration-200
        ${scrolled ? "shadow-[0_1px_0_0_var(--border)]" : ""}
      `}
      role="banner"
    >
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-heading font-semibold text-lg text-foreground hover:opacity-80 transition-opacity"
            aria-label={`${config.site.name} - Home`}
          >
            <PaperclipIcon className="w-6 h-6 text-accent" />
            <span className="hidden sm:block">{config.site.name}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  text-sm font-medium transition-colors
                  relative after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-width
                  hover:after:w-full
                  ${
                    location.pathname === link.to
                      ? "text-foreground after:w-full"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {hideTheme ? null : (
              <>
                <GithubStars compact />
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
              </>
            )}
            {userName ? (
              <>
              <Link to="/dashboard">
                <Button size="sm" className="text-sm font-medium bg-accent text-accent-foreground hover:brightness-95 active:brightness-105">
                  Dashboard
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-sm font-medium"
                onClick={() => logout.mutate()}
              >
                Log out
              </Button>
            </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="text-sm font-medium bg-accent text-accent-foreground hover:brightness-95 active:brightness-105"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}