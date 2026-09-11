"use client";

import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { terminalLines } from "@/lib/content";

const toneClass = {
  command: "text-foreground",
  log: "text-signal",
  success: "text-muted-foreground",
} as const;

/**
 * States the Build -> Deploy -> Intelligence thesis as a deploy log.
 * Under reduced motion the same lines render instantly, fully readable.
 *
 * Children are passed as a flat array, never wrapped in a fragment: `Terminal`
 * assigns each *direct* child its sequence index, so a fragment would collapse
 * every line into a single slot and stall the sequence after the first item.
 */
export function HeroTerminal() {
  const reduce = usePrefersReducedMotion();
  const [command, ...output] = terminalLines;
  const shell = "h-auto max-h-none w-full max-w-none border-border/70 bg-card/70 backdrop-blur-md";

  if (reduce) {
    return (
      <Terminal sequence={false} className={shell}>
        <span className="text-sm font-normal tracking-tight text-foreground">
          {"> "}
          {command.text}
        </span>
        {output.map((line) => (
          <span key={line.text} className={`text-sm font-normal tracking-tight ${toneClass[line.type]}`}>
            {line.text}
          </span>
        ))}
      </Terminal>
    );
  }

  return (
    <Terminal
      // The hero terminal sits beside the portrait where the 30% in-view
      // threshold is unreliable, so the sequence starts on mount instead.
      startOnView={false}
      className={shell}
    >
      <TypingAnimation duration={40} startOnView={false} className={toneClass.command}>
        {`> ${command.text}`}
      </TypingAnimation>
      {output.map((line) => (
        <AnimatedSpan key={line.text} className={toneClass[line.type]}>
          {line.text}
        </AnimatedSpan>
      ))}
    </Terminal>
  );
}
