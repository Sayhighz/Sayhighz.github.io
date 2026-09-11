"use client";

import { forwardRef, useRef } from "react";
import { Code2, Cloud, BrainCircuit } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Marquee } from "@/components/ui/marquee";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { BlurFade } from "@/components/ui/blur-fade";
import { Badge } from "@/components/ui/badge";
import SpotlightCard from "@/components/SpotlightCard";
import { SectionHeading } from "@/components/sections/section-heading";
import { pillars, techStack } from "@/lib/content";

const pillarIcons = { build: Code2, deploy: Cloud, ai: BrainCircuit };

const Node = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  function Node({ children, className = "" }, ref) {
    return (
      <div
        ref={ref}
        className={`z-10 flex size-12 items-center justify-center rounded-xl border border-border/70 bg-card shadow-lg shadow-black/20 ${className}`}
      >
        {children}
      </div>
    );
  },
);

export function Skills() {
  const container = useRef<HTMLDivElement>(null);
  const buildRef = useRef<HTMLDivElement>(null);
  const deployRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  return (
    <section id="skills" className="section-shell" aria-labelledby="skills-title">
      <SectionHeading
        index="02"
        kicker="Capabilities"
        title="One pipeline, three disciplines"
        id="skills-title"
        description="Most engineers stop at one of these. The value is in the handoffs — code that was written knowing how it deploys, infrastructure built knowing what runs on it."
      />

      {/* The literal pipeline: beams flow Build -> Deploy -> Intelligence. */}
      <div ref={container} className="relative mb-16 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-8 md:p-12">
        <div className="relative flex items-center justify-between gap-4">
          {pillars.map((pillar) => {
            const Icon = pillarIcons[pillar.id];
            const ref = pillar.id === "build" ? buildRef : pillar.id === "deploy" ? deployRef : aiRef;
            return (
              <div key={pillar.id} className="flex flex-col items-center gap-3 text-center">
                <Node ref={ref}>
                  <Icon className="size-5" style={{ color: pillar.colorVar }} aria-hidden="true" />
                </Node>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">{pillar.index}</p>
                  <p className="text-sm font-semibold">{pillar.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatedBeam
          containerRef={container}
          fromRef={buildRef}
          toRef={deployRef}
          curvature={-42}
          duration={4}
          pathWidth={2.5}
          pathColor="var(--border)"
          pathOpacity={0.65}
          gradientStartColor="oklch(0.86 0.19 124)"
          gradientStopColor="oklch(0.80 0.13 205)"
        />
        <AnimatedBeam
          containerRef={container}
          fromRef={deployRef}
          toRef={aiRef}
          curvature={-42}
          duration={4}
          delay={1.2}
          pathWidth={2.5}
          pathColor="var(--border)"
          gradientStartColor="oklch(0.80 0.13 205)"
          gradientStopColor="oklch(0.78 0.16 62)"
          pathOpacity={0.65}
        />
      </div>

      {/* One equal cell per pillar: three disciplines, three columns, so the
          row reads as a set rather than a hierarchy. */}
      <div className="grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
        {pillars.map((pillar, i) => {
          const Icon = pillarIcons[pillar.id];
          return (
            <BlurFade key={pillar.id} delay={0.1 + i * 0.09} inView className="h-full">
              <SpotlightCard
                className="!h-full !border-border/60 !bg-card/50 !p-7 transition-colors hover:!border-border"
                spotlightColor="color-mix(in oklab, var(--pillar-color) 22%, transparent)"
                style={{ "--pillar-color": pillar.colorVar } as React.CSSProperties}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex size-10 items-center justify-center rounded-lg border border-border/60"
                      style={{ background: `color-mix(in oklab, ${pillar.colorVar} 12%, transparent)` }}
                    >
                      <Icon className="size-5" style={{ color: pillar.colorVar }} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                      {pillar.index}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{pillar.title}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: pillar.colorVar }}>
                    {pillar.kicker}
                  </p>
                  <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>

                  <ul className="mt-auto flex flex-wrap gap-1.5 pt-6">
                    {pillar.skills.map((skill) => (
                      <li key={skill}>
                        <Badge variant="secondary" className="border-border/50 bg-secondary/60 font-mono text-[10px] font-normal">
                          {skill}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </SpotlightCard>
            </BlurFade>
          );
        })}
      </div>

      {/* Logo strip + orbit, reinforcing breadth without more text. */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <BlurFade delay={0.36} inView className="md:col-span-2">
          <div className="relative h-full overflow-hidden rounded-xl border border-border/60 bg-card/50 py-7">
            <p className="mb-5 px-7 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Daily drivers
            </p>
            <Marquee pauseOnHover className="[--duration:32s] [--gap:1.5rem]">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-border/50 bg-background/60 px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground"
                >
                  {tech}
                </span>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-card to-transparent" />
          </div>
        </BlurFade>

        <BlurFade delay={0.42} inView>
          <div className="relative flex h-[230px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card/50">
            <span className="pointer-events-none font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              full lifecycle
            </span>
            <OrbitingCircles radius={58} duration={22} iconSize={26}>
              <Code2 className="size-4 text-pillar-build" aria-hidden="true" />
              <Cloud className="size-4 text-pillar-deploy" aria-hidden="true" />
              <BrainCircuit className="size-4 text-pillar-ai" aria-hidden="true" />
            </OrbitingCircles>
            <OrbitingCircles radius={92} duration={30} reverse iconSize={22}>
              <span className="font-mono text-[9px] text-muted-foreground">TS</span>
              <span className="font-mono text-[9px] text-muted-foreground">K8s</span>
              <span className="font-mono text-[9px] text-muted-foreground">Go</span>
              <span className="font-mono text-[9px] text-muted-foreground">RAG</span>
            </OrbitingCircles>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
