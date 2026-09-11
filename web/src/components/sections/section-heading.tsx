"use client";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import SplitText from "@/components/SplitText";

type Props = {
  index: string;
  kicker: string;
  title: string;
  id?: string;
  description?: string;
};

/**
 * Consistent section opener. The rule number + hairline echoes the
 * observability-dashboard feel; the title animates in per character.
 */
export function SectionHeading({ index, kicker, title, id, description }: Props) {
  const reduce = usePrefersReducedMotion();

  return (
    <header className="mb-14 md:mb-20">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] tracking-[0.16em] text-signal">{index}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{kicker}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>

      {reduce ? (
        <h2 id={id} className="mt-5 text-[clamp(32px,5vw,60px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          {title}
        </h2>
      ) : (
        // SplitText renders its own tag and does not forward `id`, so the
        // heading element that carries the section's accessible name is ours.
        <h2 id={id} className="mt-5">
          <SplitText
            tag="span"
            text={title}
            className="block text-[clamp(32px,5vw,60px)] font-semibold leading-[1.05] tracking-[-0.03em]"
            splitType="words, chars"
            delay={18}
            duration={0.7}
            ease="power3.out"
            from={{ opacity: 0, y: 44, filter: "blur(6px)" }}
            to={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            threshold={0.2}
            rootMargin="-60px"
          />
        </h2>
      )}

      {description && (
        <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
