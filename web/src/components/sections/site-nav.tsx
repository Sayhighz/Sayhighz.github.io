"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Home, User, Layers, FolderGit2, Briefcase, Mail, FileText, Search,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { Dock, DockIcon } from "@/components/ui/dock";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useMediaQuery } from "@/hooks/use-media-query";
import { navItems, profile } from "@/lib/content";

const icons = { top: Home, about: User, skills: Layers, work: FolderGit2, experience: Briefcase, contact: Mail };

/**
 * Navigating past the hero cannot use native smooth scrolling. While the hero's
 * ScrollTrigger is pinned it runs a `scrub`, which writes the scroll position on
 * every tick to follow its eased playhead; those writes fight an in-flight smooth
 * scroll and clamp it at the pin's end, leaving every later section unreachable.
 * An instant jump lands correctly because it completes before the next tick.
 *
 * So the scroll is animated here as a `requestAnimationFrame` loop of instant
 * jumps: each frame sets a position GSAP cannot interrupt, while the eased curve
 * keeps the motion smooth.
 */
function scrollToSection(id: string) {
  if (id === "top") {
    animateScrollTo(() => 0);
    return;
  }
  const el = document.getElementById(id);
  if (el) animateScrollTo(() => Math.round(el.getBoundingClientRect().top + window.scrollY));
}

/**
 * Eased scroll built from instant jumps, so a pinned ScrollTrigger cannot clamp
 * it. The destination is a callback re-read every frame rather than a fixed
 * number: starting the scroll is itself what arms the hero's trigger, and the
 * pin-spacer it inserts shifts every section below it down by the pin's height
 * on the very next frame. A target measured before that — the only time it can
 * be measured — is already stale by the time the first step runs.
 */
function animateScrollTo(target: () => number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Settle on the post-pin position, which needs a second frame to appear.
    window.scrollTo({ top: target(), behavior: "instant" });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo({ top: target(), behavior: "instant" })),
    );
    return;
  }

  const from = window.scrollY;
  const start = performance.now();
  const duration = 700;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const step = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    window.scrollTo({ top: from + (target() - from) * ease(t), behavior: "instant" });
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("top");
  const { resolvedTheme, setTheme } = useTheme();
  // The dock holds 8 icons plus a separator; at full size that is wider than a
  // 390px viewport, so the icons step down rather than overflow the screen.
  const isCompact = useMediaQuery("(max-width: 430px)");
  // Server renders the dark icon; the client swaps once hydrated. Using a
  // store subscription (rather than a mount effect) keeps this out of render.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  // Cmd/Ctrl+K opens the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Highlight the dock icon for whichever section owns the viewport.
  useEffect(() => {
    const sections = navItems
      .map(({ id }) => (id === "top" ? null : document.getElementById(id)))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
        else if (window.scrollY < window.innerHeight * 0.5) setActiveSection("top");
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0.1, 0.5] },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const runCommand = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <>
      <ScrollProgress className="fixed top-0 z-[60] h-[2px] bg-gradient-to-r from-signal via-pillar-deploy to-ember" />

      <nav
        aria-label="Section navigation"
        className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 md:bottom-7"
      >
        <Dock
          iconSize={isCompact ? 30 : 40}
          iconMagnification={isCompact ? 46 : 62}
          iconDistance={isCompact ? 90 : 130}
          className="max-w-full rounded-2xl border-border/60 bg-card/70 px-1.5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:px-2"
        >
          {navItems.map(({ id, label }) => {
            const Icon = icons[id];
            const isActive = activeSection === id;
            return (
              <DockIcon key={id}>
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => scrollToSection(id)}
                    aria-label={label}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex size-full items-center justify-center rounded-full transition-colors ${
                      isActive ? "bg-signal/15 text-signal" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent sideOffset={10}>{label}</TooltipContent>
                </Tooltip>
              </DockIcon>
            );
          })}

          <DockIcon className="!w-4">
            <Separator orientation="vertical" className="mx-auto h-6" />
          </DockIcon>

          <DockIcon>
            <Tooltip>
              <TooltipTrigger
                onClick={() => setOpen(true)}
                aria-label="Open command palette"
                className="flex size-full items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <Search className="size-[18px]" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>Search — ⌘K</TooltipContent>
            </Tooltip>
          </DockIcon>

          <DockIcon>
            <Tooltip>
              {/* The toggler keeps an internal ref to its own <button> and
                  measures it to origin the view transition. `asChild` would
                  overwrite that ref with Radix's own — under React 19 `ref` is
                  a plain prop, so the clone wins and the measurement returns
                  null, silently swallowing every click. The span gives Radix an
                  element of its own to hold instead. */}
              <TooltipTrigger asChild>
                <span className="flex size-full items-center justify-center">
                  {/* Controlled by next-themes so the class and storage stay in sync. */}
                  <AnimatedThemeToggler
                    variant="circle"
                    theme={mounted && resolvedTheme === "light" ? "light" : "dark"}
                    onThemeChange={setTheme}
                    aria-label="Toggle colour theme"
                    className="flex size-full items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground [&>svg]:size-[18px]"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>Toggle theme</TooltipContent>
            </Tooltip>
          </DockIcon>
        </Dock>
      </nav>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Jump to a section or open a link">
        <CommandInput placeholder="Jump to a section, or open a link…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {navItems.map(({ id, label }) => {
              const Icon = icons[id];
              return (
                <CommandItem key={id} value={label} onSelect={() => runCommand(() => scrollToSection(id))}>
                  <Icon className="mr-2 size-4" aria-hidden="true" />
                  {label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Links">
            <CommandItem value="GitHub" onSelect={() => runCommand(() => window.open(profile.socials.github, "_blank", "noopener"))}>
              <GithubIcon className="mr-2 size-4" />GitHub
            </CommandItem>
            <CommandItem value="LinkedIn" onSelect={() => runCommand(() => window.open(profile.socials.linkedin, "_blank", "noopener"))}>
              <LinkedinIcon className="mr-2 size-4" />LinkedIn
            </CommandItem>
            <CommandItem value="Resume CV" onSelect={() => runCommand(() => window.open(profile.resumeUrl, "_blank", "noopener"))}>
              <FileText className="mr-2 size-4" aria-hidden="true" />Download CV
            </CommandItem>
            <CommandItem value="Email" onSelect={() => runCommand(() => { window.location.href = `mailto:${profile.email}`; })}>
              <Mail className="mr-2 size-4" aria-hidden="true" />Email me
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
