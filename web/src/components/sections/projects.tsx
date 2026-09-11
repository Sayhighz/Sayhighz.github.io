"use client";

import { useState } from "react";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/brand-icons";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/radix/tabs";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { Safari } from "@/components/ui/safari";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SectionHeading } from "@/components/sections/section-heading";
import { projects, pillars, type Project, type PillarId } from "@/lib/content";

const pillarLabel: Record<PillarId, string> = { build: "Build", deploy: "Deploy", ai: "Intelligence" };
const pillarColor: Record<PillarId, string> = {
  build: "var(--pillar-build)",
  deploy: "var(--pillar-deploy)",
  ai: "var(--pillar-ai)",
};

// Only offer a pillar as a filter when something sits under it — an empty tab
// is a dead end, and which pillars have work shifts as projects come and go.
const filters = [
  { id: "all", label: "All work" },
  ...pillars
    .filter((p) => projects.some((project) => project.pillar === p.id))
    .map((p) => ({ id: p.id, label: p.title })),
];

function ProjectCard({ project, onOpen, index }: { project: Project; onOpen: () => void; index: number }) {
  const color = pillarColor[project.pillar];
  return (
    <BlurFade delay={0.08 + index * 0.07} inView className="h-full">
      <div className="group relative h-full overflow-hidden rounded-xl">
        <MagicCard
          gradientSize={240}
          gradientFrom={color}
          gradientTo="oklch(0.80 0.13 205)"
          gradientColor="color-mix(in oklab, var(--foreground) 8%, transparent)"
          gradientOpacity={0.12}
          className="h-full rounded-xl border border-border/60 bg-card/60 p-0"
        >
          {/* Whole card is one button so keyboard users get a single stop. */}
          <button
            type="button"
            onClick={onOpen}
            className="flex h-full w-full flex-col p-6 text-left"
            aria-label={`Open case study: ${project.title}`}
          >
            <div className="flex items-center justify-between gap-3">
              <Badge
                variant="outline"
                className="border-border/60 font-mono text-[10px] font-normal"
                style={{ color }}
              >
                {pillarLabel[project.pillar]}
              </Badge>
              <span className="font-mono text-[10px] text-muted-foreground">{project.year}</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-tight transition-colors group-hover:text-signal">
              {project.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>

            {/* Fixed two-column grid: flex-wrap let a long label push the
                second metric onto its own row, so sibling cards disagreed. */}
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
              {project.impact.slice(0, 2).map((item) => (
                <div key={item.label} className="min-w-0">
                  <dd className="text-base font-semibold tabular-nums" style={{ color }}>{item.metric}</dd>
                  <dt className="font-mono text-[10px] uppercase leading-snug tracking-[0.1em] text-muted-foreground">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>

            <ul className="mt-auto flex flex-wrap gap-1.5 pt-6">
              {project.stack.slice(0, 4).map((tech) => (
                <li key={tech}>
                  <Badge variant="secondary" className="bg-secondary/60 font-mono text-[10px] font-normal">
                    {tech}
                  </Badge>
                </li>
              ))}
              {project.stack.length > 4 && (
                <li>
                  <Badge variant="secondary" className="bg-secondary/60 font-mono text-[10px] font-normal">
                    +{project.stack.length - 4}
                  </Badge>
                </li>
              )}
            </ul>

            <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-signal">
              Read case study <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </button>
        </MagicCard>

        {/* Beam only on hover so idle cards stay visually quiet. */}
        <BorderBeam
          size={140}
          duration={7}
          colorFrom={color}
          colorTo="oklch(0.80 0.13 205)"
          className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>
    </BlurFade>
  );
}

export function Projects() {
  const [active, setActive] = useState<Project | null>(null);
  const color = active ? pillarColor[active.pillar] : undefined;

  return (
    <section id="work" className="section-shell" aria-labelledby="work-title">
      <SectionHeading
        index="03"
        kicker="Selected work"
        title="Proof, not promises"
        id="work-title"
        description="Six projects across the three disciplines. Each one lists the problem, what I built, and what measurably changed."
      />

      <Tabs defaultValue="all" className="w-full">
        {/* Scrolls rather than overflowing: four filters do not fit a 390px
            viewport, and every filter must stay reachable. */}
        <TabsList className="mb-9 h-auto w-full max-w-full justify-start overflow-x-auto rounded-full border border-border/60 bg-card/50 p-1 sm:w-fit">
          {filters.map((filter) => (
            <TabsTrigger
              key={filter.id}
              value={filter.id}
              className="shrink-0 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] data-[state=active]:text-signal"
            >
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContents>
          {filters.map((filter) => {
            const list = filter.id === "all" ? projects : projects.filter((p) => p.pillar === filter.id);
            return (
              <TabsContent key={filter.id} value={filter.id}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {list.map((project, i) => (
                    <ProjectCard key={project.slug} project={project} index={i} onOpen={() => setActive(project)} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </TabsContents>
      </Tabs>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-border/60 font-mono text-[10px] font-normal" style={{ color }}>
                    {pillarLabel[active.pillar]}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">{active.year}</span>
                </div>
                <DialogTitle className="mt-2 text-2xl tracking-tight">{active.title}</DialogTitle>
                <DialogDescription className="text-[15px] leading-relaxed">{active.summary}</DialogDescription>
              </DialogHeader>

              {active.image && (
                <Safari url={active.links.live ?? "example.com"} imageSrc={active.image} className="w-full" />
              )}

              <div className="space-y-6">
                <section>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Problem</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.problem}</p>
                </section>
                <section>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Solution</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.solution}</p>
                </section>

                <section>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Impact</h4>
                  <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {active.impact.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border/60 bg-card/50 p-3">
                        <dd className="text-xl font-semibold tabular-nums" style={{ color }}>{item.metric}</dd>
                        <dt className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                          {item.label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                </section>

                <section>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Stack</h4>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {active.stack.map((tech) => (
                      <li key={tech}>
                        <Badge variant="secondary" className="bg-secondary/60 font-mono text-[10px] font-normal">
                          {tech}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>

                {(active.links.github || active.links.live) && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {active.links.github && (
                      <Button asChild variant="outline" size="sm">
                        <a href={active.links.github} target="_blank" rel="noopener noreferrer">
                          <GithubIcon className="mr-1.5 size-4" />Source
                        </a>
                      </Button>
                    )}
                    {active.links.live && (
                      <Button asChild size="sm">
                        <a href={active.links.live} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 size-4" aria-hidden="true" />Live site
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
