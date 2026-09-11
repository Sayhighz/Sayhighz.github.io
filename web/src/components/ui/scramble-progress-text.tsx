"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+/\\<>[]{}=";

export type ScrambleProgressTextProps = {
  text: string;
  /**
   * Scrub position in 0..1. Characters resolve left-to-right as it rises and
   * re-scramble as it falls, so the effect reads the same scrubbing backwards.
   */
  progress: number;
  /** Fraction of the character span still scrambling at any one progress value. */
  spread?: number;
  className?: string;
  scrambledClassName?: string;
};

/**
 * A progress-driven adaptation of React Bits' DecryptedText.
 *
 * The original resolves on a `setInterval` once triggered; here the reveal is a
 * pure function of a scrub value, because the hero is pinned and the reader's
 * scroll — not a timer — owns the playhead. That also makes it reversible for
 * free, which the timer version is not.
 *
 * The real string is always present for assistive tech; only the visual layer
 * scrambles.
 */
export function ScrambleProgressText({
  text,
  progress,
  spread = 0.28,
  className = "",
  scrambledClassName = "",
}: ScrambleProgressTextProps) {
  const chars = useMemo(() => text.split(""), [text]);
  /**
   * A bag of random glyphs, one slot per character, refreshed on a rAF while
   * the text is mid-reveal. Rolling them here rather than during render keeps
   * the component pure: render is a function of (progress, noise).
   */
  const [noise, setNoise] = useState<string[]>(() => chars.map(() => GLYPHS[0]));
  const frame = useRef(0);
  const settled = progress <= 0 || progress >= 1;

  useEffect(() => {
    if (settled) return;
    const tick = () => {
      setNoise(chars.map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [settled, chars]);

  const rendered = useMemo(() => {
    // The reveal front sweeps past the end by `spread` so the final character
    // resolves exactly at progress 1 rather than one step short.
    const front = progress * (1 + spread);
    return chars.map((char, index) => {
      if (char === " ") return { char: " ", resolved: true };
      const position = chars.length > 1 ? index / (chars.length - 1) : 0;
      const resolved = position <= front - spread;
      if (resolved) return { char, resolved: true };
      // Ahead of the front entirely: nothing has arrived yet.
      if (position > front) return { char: " ", resolved: false };
      return { char: noise[index] ?? GLYPHS[0], resolved: false };
    });
  }, [chars, progress, spread, noise]);

  return (
    <span className="inline-block whitespace-pre-wrap">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {rendered.map((item, index) => (
          <span key={index} className={item.resolved ? className : scrambledClassName}>
            {item.char}
          </span>
        ))}
      </span>
    </span>
  );
}
