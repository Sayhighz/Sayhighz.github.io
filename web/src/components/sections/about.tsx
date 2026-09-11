"use client";

import { MapPin, Clock } from "lucide-react";
import TiltedCard from "@/components/TiltedCard";
import ScrollReveal from "@/components/ScrollReveal";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BlurFade } from "@/components/ui/blur-fade";
import { SectionHeading } from "@/components/sections/section-heading";
import { landingTarget } from "@/lib/portrait-landing";
import { profile, stats } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="section-shell" aria-labelledby="about-title">
      <SectionHeading index="01" kicker="About" title="The shape of the work" id="about-title" />

      <div className="grid gap-14 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-20">
        <BlurFade delay={0.1} inView className="mx-auto w-full max-w-[320px] lg:mx-0">
          {/* The hero portrait flies into this box and hands the image back
              here on landing, so the card holds its own footprint but stays
              invisible until the flight is over (see `.portrait-landing`). */}
          <div {...landingTarget} className="portrait-landing">
          <TiltedCard
            imageSrc="/portrait/idle/desktop/000.webp"
            altText={`${profile.name}, ${profile.roles.join(", ")}`}
            containerHeight="380px"
            containerWidth="100%"
            imageHeight="380px"
            imageWidth="100%"
            rotateAmplitude={9}
            scaleOnHover={1.04}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent
            overlayContent={
              <div className="absolute inset-x-4 bottom-4 rounded-lg border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-md">
                <p className="font-mono text-[10px] tracking-[0.14em] text-signal">AVAILABLE FOR WORK</p>
                <p className="mt-1 text-sm font-medium">{profile.name}</p>
              </div>
            }
          />
          </div>

          <dl className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-signal" aria-hidden="true" />
              <dt className="sr-only">Location</dt>
              <dd>{profile.location}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-signal" aria-hidden="true" />
              <dt className="sr-only">Timezone</dt>
              <dd>{profile.timezone}</dd>
            </div>
          </dl>
        </BlurFade>

        <div>
          {/* ScrollReveal animates word-by-word against scroll position. */}
          <ScrollReveal
            containerClassName="!my-0"
            textClassName="!text-[clamp(20px,2.4vw,30px)] !font-medium !leading-[1.45] tracking-tight"
            baseOpacity={0.12}
            baseRotation={2}
            blurStrength={5}
            enableBlur
          >
            {profile.intro}
          </ScrollReveal>

          <div className="mt-8 max-w-[62ch] space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            {profile.bio.map((paragraph, i) => (
              <BlurFade key={i} delay={0.15 + i * 0.1} inView>
                <p>{paragraph}</p>
              </BlurFade>
            ))}
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <BlurFade key={stat.label} delay={0.2 + i * 0.08} inView>
                <div className="border-l-2 border-signal/40 pl-4">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
                    <NumberTicker
                      value={stat.value}
                      decimalPlaces={"decimals" in stat ? (stat.decimals as number) : 0}
                      className="text-foreground"
                    />
                    <span className="text-signal">{stat.suffix}</span>
                  </dd>
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </BlurFade>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
