"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FRAME_COUNTS, PortraitFrames, type PortraitSequence } from "@/lib/portrait-frames";
import { HeroCopy } from "@/components/sections/hero-copy";
import { LANDING_ATTR, readLandingRect } from "@/lib/portrait-landing";
import { profile } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

/**
 * The signature piece of the site: a looping idle portrait that transforms
 * into a humanoid as the visitor scrolls.
 * Frames decode off the main thread and are held in a bounded LRU cache, so
 * reverse scrubbing stays smooth without pinning hundreds of bitmaps in memory.
 */
export function PortraitHero() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  /**
   * Scrub position of the pinned hero, mirrored into React for the left column.
   * Quantised to 40 steps: the scramble only needs enough resolution to look
   * continuous, and re-rendering that subtree on every scroll frame is what
   * would cost the portrait its budget.
   */
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const root = section.current!;
    const surface = canvas.current!;
    const ctx = surface.getContext("2d", { alpha: true });
    if (!ctx) return;
    const media = gsap.matchMedia();
    media.add(
      { mobile: "(max-width: 767px)", desktop: "(min-width: 768px)", reduced: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const { mobile, reduced } = context.conditions!;
        root.dataset.motion = reduced ? "off" : "on";
        surface.dataset.ready = "false";
        surface.dataset.sequence = "";
        surface.dataset.frame = "";
        // Reduced motion keeps the static poster image and skips all frame work.
        if (reduced) {
          // Phase A is the accessible resting state: no cross-fade, full copy,
          // and the About card is simply present — there is no flight to wait
          // for, so it must never be left hidden.
          root.style.setProperty("--hero-phase", "0");
          document
            .querySelector<HTMLElement>(`[${LANDING_ATTR}]`)
            ?.setAttribute("data-handoff", "done");
          setPhase(0);
          return;
        }

        // The cross-fade itself is CSS off this variable, written straight to
        // the DOM so it tracks the scrub at full frame rate. Only the scramble
        // needs a React round-trip, and it takes the quantised value.
        let publishedStep = -1;
        const publishPhase = (raw: number) => {
          // Act one's own progress runs past 1 once the flight starts; the copy
          // is finished by then and must stay put.
          const progress = Math.min(1, Math.max(0, raw));
          root.style.setProperty("--hero-phase", String(progress));
          const step = Math.round(progress * 40);
          if (step === publishedStep) return;
          publishedStep = step;
          setPhase(step / 40);
        };
        surface.width = mobile ? 640 : 960;
        surface.height = mobile ? 360 : 540;
        let activeSequence: PortraitSequence = "idle";
        let target = 0;
        let drawn = "";
        let drawRequest = 0;
        let disposed = false;
        const render = () => {
          drawRequest = 0;
          const frames = activeSequence === "idle" ? idleFrames : transformFrames;
          const bitmap = frames.get(target);
          const frameKey = `${activeSequence}:${target}`;
          if (!bitmap || frameKey === drawn) return;
          ctx.clearRect(0, 0, surface.width, surface.height);
          ctx.drawImage(bitmap, 0, 0, surface.width, surface.height);
          drawn = frameKey;
          surface.dataset.ready = "true";
          surface.dataset.sequence = activeSequence;
          surface.dataset.frame = String(target);
        };
        const schedule = () => {
          if (!disposed && !drawRequest) drawRequest = requestAnimationFrame(render);
        };
        const onError = () => {
          if (!disposed) {
            surface.dataset.ready = "false";
            setError(true);
          }
        };
        const startIdle = () => {
          if (disposed || idleStarted || !idleFrames.get(0)) return;
          idleStarted = true;
          activeSequence = "idle";
          target = 0;
          schedule();
          idleTween.play(0);
        };
        const onIdleFrameReady = () => {
          schedule();
          startIdle();
        };
        const idleFrames = new PortraitFrames("idle", mobile ? "mobile" : "desktop", onIdleFrameReady, onError);
        const transformFrames = new PortraitFrames("transform", mobile ? "mobile" : "desktop", schedule, onError);
        const playhead = { frame: 0 };
        let scrubbing = false;
        let canScrub = false;
        const beginTransform = () => {
          if (scrubbing || disposed) return;
          scrubbing = true;
          idleTween.kill();
          activeSequence = "transform";
          target = Math.round(playhead.frame);
          transformFrames.request(target);
          schedule();
        };
        const updateTransform = () => {
          if (disposed || !canScrub) return;
          if (playhead.frame > 0) beginTransform();
          if (!scrubbing) return;
          activeSequence = "transform";
          target = Math.round(playhead.frame);
          transformFrames.request(target);
          schedule();
        };

        /**
         * Act two: the portrait flies from the hero into the About card.
         *
         * The frame playhead runs backwards over the same transform sequence,
         * so the humanoid unwinds into the person — no second asset needed, and
         * the sequence's own frame 0 is exactly the still the card shows, which
         * is what makes the handoff invisible.
         *
         * Geometry is measured, never hardcoded: `flightFrom` is where the
         * portrait sits at rest in the hero and `flightTo` is the card's box, so
         * the flight stays correct across breakpoints and layout changes.
         */
        const stage = root.querySelector<HTMLElement>(".portrait-stage")!;
        /**
         * The stage's resting box, expressed as an offset from the hero rather
         * than from the viewport. `position: fixed` resolves against the nearest
         * transformed ancestor and GSAP's pin leaves a transform on `.hero`, so
         * the hero — not the viewport — is what the flying stage is positioned
         * against. Storing the offset instead of an absolute box keeps the two
         * ends of the flight in the same coordinate space as the hero moves.
         */
        let flightFrom: { top: number; left: number; width: number; height: number } | null = null;
        const measureFlight = () => {
          const wasFlying = root.dataset.flight === "on";
          root.dataset.flight = "off";
          gsap.set(stage, { clearProps: "position,top,left,width,height,transform" });
          const box = stage.getBoundingClientRect();
          const origin = root.getBoundingClientRect();
          flightFrom = {
            top: box.top - origin.top, left: box.left - origin.left,
            width: box.width, height: box.height,
          };
          if (wasFlying) root.dataset.flight = "on";
        };
        const applyFlight = (progress: number) => {
          const to = readLandingRect();
          if (!flightFrom?.width || !to?.width) return;
          const eased = gsap.parseEase("power2.inOut")(progress);
          /**
           * Scale runs ahead of position on its own curve. On narrow screens the
           * hero stage is close to full-bleed while the card is a 320px column,
           * so a portrait that shrinks in step with its descent spends the middle
           * of the flight both oversized and on top of the About heading. Pulling
           * the size down first means the portrait is already card-shaped by the
           * time it crosses the copy, and only then travels the remaining
           * distance.
           */
          const sizeEased = gsap.parseEase("power2.out")(Math.min(1, progress * 1.35));
          // Everything below is hero-relative (see `flightFrom`). The hero's box
          // is re-read every frame because it keeps moving with the page, and
          // the landing card moves with it — only the difference is stable.
          const origin = root.getBoundingClientRect();
          const toTop = to.top - origin.top;
          const toLeft = to.left - origin.left;
          gsap.set(stage, {
            position: "fixed",
            top: flightFrom.top, left: flightFrom.left,
            width: flightFrom.width, height: flightFrom.height,
            x: gsap.utils.interpolate(0, toLeft - flightFrom.left, eased),
            y: gsap.utils.interpolate(0, toTop - flightFrom.top, eased),
            // Scaled per axis rather than uniformly: the hero stage and the card
            // have different aspect ratios, so a single scale can only ever match
            // one edge and would leave the other short at the landing. The canvas
            // is `object-fit: cover`, so it absorbs the aspect change by cropping
            // instead of stretching.
            scaleX: gsap.utils.interpolate(1, to.width / flightFrom.width, sizeEased),
            scaleY: gsap.utils.interpolate(1, to.height / flightFrom.height, sizeEased),
            transformOrigin: "0% 0%",
            force3D: true,
          });
          root.style.setProperty("--hero-flight", String(progress));
        };
        const clearFlight = () => {
          gsap.set(stage, { clearProps: "position,top,left,width,height,transform" });
          root.style.setProperty("--hero-flight", "0");
        };
        const landing = document.querySelector<HTMLElement>(`[${LANDING_ATTR}]`);
        // Hidden from the start: the card's image is the flight's destination,
        // and showing it early would spoil the arrival.
        if (landing) landing.dataset.handoff = "pending";
        const updateFlight = (progress: number) => {
          if (disposed || !canScrub) return;
          // Frames unwind 239 -> 0 across the flight.
          activeSequence = "transform";
          target = Math.round((1 - progress) * (FRAME_COUNTS.transform - 1));
          transformFrames.request(target);
          schedule();
          // In flight the stage escapes the hero's clip and rides above the
          // page; at rest it is an ordinary part of the hero again.
          root.dataset.flight = progress > 0 ? "on" : "off";
          if (progress > 0) applyFlight(progress);
          else clearFlight();
          // The handoff: once the flight is all but complete the canvas and the
          // card show the same frame, so the card takes over and the canvas
          // steps back. Swapping just short of 1 keeps the exchange hidden
          // behind a frame that is already identical.
          // The soft edges are traded for the card's hard crop on approach, not
          // at take-off, so the portrait keeps its feathered mask over the open
          // page it crosses. By this point it is close enough to card-shaped
          // that the exchange does not register.
          stage.dataset.landing = progress > 0.8 ? "true" : "false";
          const landed = progress > 0.985;
          if (landing) landing.dataset.handoff = landed ? "done" : "pending";
          stage.dataset.landed = landed ? "true" : "false";
        };

        const idlePlayhead = { frame: 0 };
        let idleStarted = false;
        const idleTween = gsap.to(idlePlayhead, {
          frame: FRAME_COUNTS.idle - 1,
          ease: "none",
          duration: 4,
          repeat: -1,
          // Ping-pong rather than restart: the sequence's last frame does not
          // meet its first, so looping forward snaps visibly at the seam.
          // Unwinding back through the same frames makes the rest continuous.
          yoyo: true,
          onUpdate: () => {
            if (disposed || scrubbing) return;
            activeSequence = "idle";
            target = Math.round(idlePlayhead.frame);
            idleFrames.request(target);
            schedule();
          },
          paused: true,
        });
        idleFrames.request(0);
        idleFrames.preload(Array.from({ length: 12 }, (_, i) => i + 1));
        transformFrames.preload([0]);

        let tween: gsap.core.Timeline | null = null;
        let scrollTriggerInstance: ScrollTrigger | null = null;
        let flightTrigger: ScrollTrigger | null = null;
        const armScroll = () => {
          if (tween) return;
          playhead.frame = 0;

          // Creating the tween inserts the pin-spacer, growing the document by
          // the pin's full length in one go. The browser's scroll anchoring then
          // keeps the viewport tied to the content that moved, pushing scrollY
          // down by that same amount. Arming from the top is what keeps this
          // harmless (see the pre-arm below), but a resize can rebuild the
          // context mid-page, so the position is restored across the refresh.
          const yBefore = window.scrollY;

          tween = gsap.timeline({
            scrollTrigger: {
              trigger: root, start: "top top", end: () => `+=${window.innerHeight * (mobile ? 1.6 : 2)}`,
              pin: true, scrub: 0.25, invalidateOnRefresh: true,
              onUpdate: (self) => publishPhase(self.progress),
            },
          });
          tween.to(playhead, {
            frame: FRAME_COUNTS.transform - 1, ease: "none", onUpdate: updateTransform,
          });
          scrollTriggerInstance = tween.scrollTrigger ?? null;

          // The flight is a second, separate trigger that runs *after* the pin
          // releases. It cannot ride the pin: while the hero is pinned the
          // About card is still a screenful below the fold, so a portrait
          // flying to it would simply exit downwards out of view. Keying it to
          // the card's own arrival means the landing box is on screen for the
          // whole descent, which is the only way the move reads as one
          // continuous object rather than something leaving and something else
          // appearing.
          flightTrigger = ScrollTrigger.create({
            trigger: landing ?? root,
            // From the card entering the viewport until it reaches a
            // comfortable reading position — the portrait arrives with it.
            start: "top bottom", end: "center center",
            scrub: 0.3, invalidateOnRefresh: true,
            onRefresh: measureFlight,
            onUpdate: (self) => updateFlight(self.progress),
          });
          // Refresh every trigger, not just this one: the pin-spacer shifts every
          // section below the hero, so their start/end values are stale.
          ScrollTrigger.refresh();

          if (window.scrollY !== yBefore) {
            window.scrollTo(0, yBefore);
            ScrollTrigger.update();
          }
          canScrub = true;
          if (yBefore > 0) beginTransform();
        };

        // Kept as a safety net: if anything scrolls before the pre-arm below
        // runs, the trigger still comes up on the first intent.
        const onScroll = () => {
          armScroll();
        };
        const onScrollIntent = () => {
          armScroll();
          beginTransform();
        };
        window.addEventListener("scroll", onScroll, { passive: true, once: true });
        window.addEventListener("wheel", onScrollIntent, { passive: true, once: true });
        window.addEventListener("touchmove", onScrollIntent, { passive: true, once: true });

        // Arming had been deferred to the first scroll, which is what broke the
        // hero on reload: the spacer then appeared under a reader who was already
        // interacting, and scroll anchoring pushed them the pin's whole length
        // down — past `end`, so the scrub was born finished and the portrait sat
        // frozen until a trip to the bottom and back forced a refresh. Correcting
        // that shift afterwards is not possible either, because a deliberate jump
        // to a section is the same scroll event.
        //
        // So arm while the page is still untouched at the top, where inserting
        // the spacer moves nothing the reader can see. The idle loop keeps the
        // playhead until a real scroll takes over, so the opening seconds look
        // exactly as before.
        const preArmTimer = window.setTimeout(() => {
          if (disposed || tween || window.scrollY > 0) return;
          armScroll();
        }, 0);

        return () => {
          disposed = true;
          clearTimeout(preArmTimer);
          cancelAnimationFrame(drawRequest);
          idleFrames.dispose();
          transformFrames.dispose();
          idleTween.kill();
          tween?.kill();
          scrollTriggerInstance?.kill();
          flightTrigger?.kill();
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("wheel", onScrollIntent);
          window.removeEventListener("touchmove", onScrollIntent);
          surface.dataset.ready = "false";
          root.style.removeProperty("--hero-phase");
          root.style.removeProperty("--hero-flight");
          delete root.dataset.flight;
          delete stage.dataset.landed;
          delete stage.dataset.landing;
          clearFlight();
          // Never leave the card hidden behind a flight that no longer exists —
          // a breakpoint change rebuilds this context from scratch.
          if (landing) landing.dataset.handoff = "done";
        };
      },
    );
    return () => media.revert();
  }, [attempt]);

  return (
    <section ref={section} className="hero" aria-labelledby="hero-title">
      {/* Grid field replaces the old WebGL plasma: the portrait canvas is the
          only heavy visual in the hero, per the one-heavy-effect budget. */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-glow" />
      </div>

      <HeroCopy progress={phase} />

      <div className="portrait-stage" role="img" aria-label={`${profile.name}, transforming into a humanoid as you scroll`}>
        <div className="portrait-media">
          <Image
            className="portrait-poster"
            src="/portrait/idle/desktop/000.webp"
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 60vw"
            priority
            unoptimized
          />
          <canvas ref={canvas} aria-hidden="true" />
        </div>
      </div>

      {error && (
        <div className="media-error" role="status">
          Showing a still image.
          <button onClick={() => { setError(false); setAttempt(attempt + 1); }}>Retry</button>
        </div>
      )}

      <a className="scroll-cue" href="#about">
        <span>SCROLL TO INSPECT</span>
        <ArrowDown className="size-3.5 animate-bounce" aria-hidden="true" />
      </a>
    </section>
  );
}
