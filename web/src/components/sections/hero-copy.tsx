"use client";

import { ArrowUpRight } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { WordRotate } from "@/components/ui/word-rotate";
import { ScrambleProgressText } from "@/components/ui/scramble-progress-text";
import { HeroTerminal } from "@/components/sections/hero-terminal";
import { heroTransformCopy, profile } from "@/lib/content";

/**
 * The hero's left column, in two phases.
 *
 * Phase A (intro copy) and phase B (the transform thesis) are both mounted and
 * stacked; the parent drives which one is visible through the `--hero-phase`
 * custom property, scrubbed by the same ScrollTrigger that moves the portrait.
 * Keeping both mounted is what lets the swap reverse cleanly — a conditional
 * render would re-run the terminal's typing sequence on every scrub back.
 *
 * `progress` is passed down only for the scramble effect, which needs the raw
 * value; everything else is pure CSS off the phase variable, so scrubbing does
 * not re-render this tree.
 */
export function HeroCopy({ progress }: { progress: number }) {
  return (
    <div className="hero-copy">
      <div className="hero-phase hero-phase-a">
        <h1 id="hero-title" className="hero-title">
          <span className="line line-a">{profile.shortName.toLowerCase()} nilson —</span>
          {/* Each word carries its own separator so the line can wrap between
              words on narrow screens instead of clipping mid-word. */}
          <span className="line line-b">
            <span className="whitespace-nowrap">build<span className="line-accent">.</span></span>
            <span className="whitespace-nowrap">ship<span className="line-accent">.</span></span>
            <span className="line-accent whitespace-nowrap">think.</span>
          </span>
          <span className="line line-c">
            <WordRotate
              className="inline-block text-[0.9em] font-medium lowercase"
              words={[...profile.roles]}
              duration={2400}
            />
          </span>
        </h1>

        <p className="hero-description">{profile.tagline}</p>

        <div className="hero-terminal-slot">
          <HeroTerminal />
        </div>
      </div>

      <div className="hero-phase hero-phase-b" aria-hidden="true">
        <p className="hero-title">
          <span className="line line-a">{heroTransformCopy.kicker}</span>
          <span className="line line-b">
            <span className="whitespace-nowrap">{heroTransformCopy.headlineLead} </span>
            <span className="line-strike whitespace-nowrap">{heroTransformCopy.headlineStrike}</span>{" "}
            <span className="line-accent whitespace-nowrap">{heroTransformCopy.headline}</span>
          </span>
        </p>

        <p className="hero-description">{heroTransformCopy.tagline}</p>

        <ul className="hero-readout">
          {heroTransformCopy.readout.map((line, index) => (
            <li key={line}>
              <span className="hero-readout-mark">✓</span>
              <ScrambleProgressText
                // Each line resolves over its own slice of the back half of the
                // scrub, so they land in sequence instead of all at once.
                progress={sliceProgress(progress, 0.55 + index * 0.12, 0.82 + index * 0.06)}
                text={line}
                className="hero-readout-char"
                scrambledClassName="hero-readout-char is-scrambled"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Shared across both phases — the calls to action never leave. */}
      <div className="hero-actions">
        <ShimmerButton
          shimmerColor="oklch(0.86 0.19 124)"
          background="oklch(0.22 0.012 240)"
          className="text-sm font-medium"
          onClick={() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })}
        >
          View the work
          <ArrowUpRight className="ml-2 size-4" aria-hidden="true" />
        </ShimmerButton>
        <a href="#contact" className="hero-ghost-link">
          Get in touch
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

/** Remaps `value` so that [start, end] becomes a full 0..1 ramp. */
function sliceProgress(value: number, start: number, end: number) {
  if (end <= start) return value >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}
