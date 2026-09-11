"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/animate-ui/components/radix/accordion";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/sections/section-heading";
import { experience } from "@/lib/content";

export function Experience() {
  return (
    <section id="experience" className="section-shell" aria-labelledby="experience-title">
      <SectionHeading
        index="04"
        kicker="Track record"
        title="Where I've shipped"
        id="experience-title"
      />

      <Accordion type="single" collapsible defaultValue="item-0" className="relative">
        {/* The timeline rail — the pipeline metaphor, rotated vertical. */}
        <div
          className="absolute bottom-4 left-[7px] top-4 w-px bg-gradient-to-b from-signal/60 via-border to-transparent"
          aria-hidden="true"
        />

        {experience.map((job, i) => (
          <BlurFade key={job.company} delay={0.08 + i * 0.1} inView>
            <AccordionItem value={`item-${i}`} className="border-border/60 pl-8">
              <span
                className="absolute left-0 mt-6 size-[15px] rounded-full border-2 border-signal bg-background"
                aria-hidden="true"
              />
              <AccordionTrigger className="py-6 hover:no-underline">
                <div className="flex flex-1 flex-col gap-1 pr-4 text-left sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">{job.role}</h3>
                    <p className="mt-0.5 text-sm text-signal">{job.company}</p>
                  </div>
                  <p className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {job.period} · {job.location}
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-7">
                <p className="max-w-[64ch] text-sm leading-relaxed text-muted-foreground">{job.summary}</p>
                <ul className="mt-4 space-y-2.5">
                  {job.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                      <span className="max-w-[62ch]">{highlight}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {job.stack.map((tech) => (
                    <li key={tech}>
                      <Badge variant="secondary" className="bg-secondary/60 font-mono text-[10px] font-normal">
                        {tech}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </BlurFade>
        ))}
      </Accordion>
    </section>
  );
}
