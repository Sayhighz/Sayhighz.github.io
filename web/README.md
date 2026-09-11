# Pratan Nilson — Portfolio

A portfolio for a hybrid engineer, built around one idea: **Build → Deploy → Intelligence**.
The page is composed almost entirely from four component libraries, with a scroll-scrubbed
portrait as its centrepiece.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion · GSAP ScrollTrigger

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npx playwright test
```

Deploys to Vercel with no configuration — push the repo and import it.

---

## Editing the content

**Every piece of copy lives in [`src/lib/content.ts`](src/lib/content.ts).** No text is hardcoded
in components. To make the site yours, edit that one file:

| Export | What it drives |
| --- | --- |
| `profile` | Name, roles, tagline, location, timezone, email, social links, map coordinates |
| `stats` | The four counters (About section) |
| `pillars` | The three capability cells and their tech badges |
| `techStack` | The scrolling marquee of daily drivers |
| `projects` | Case studies — problem, solution, stack, impact metrics, links |
| `experience` | Timeline roles, bullets and per-role stacks |
| `terminalLines` | The hero's deploy log |
| `navItems` | Dock items and command-palette entries |

Replace the portrait frames in `public/portrait/` (see *The portrait engine* below) and the
placeholder projects, and the site is fully personalised.

---

## Component inventory

Every component below is installed from one of the four libraries. Where a component is
listed as *(vendored)*, its source lives in this repo because the library ships copy-paste
source rather than a package — that is how these libraries are designed to be used.

### Magic UI — `magicui.design`

| Component | Where it's used | Why |
| --- | --- | --- |
| `Terminal`, `TypingAnimation`, `AnimatedSpan` | Hero | Types out `$ deploy pratan --env=production` — states the whole thesis as a deploy log |
| `WordRotate` | Hero | Cycles the three role titles in one fixed line |
| `ShimmerButton` | Hero | The primary "View the work" call to action |
| `Dock`, `DockIcon` | Global nav | macOS-style magnifying nav, the site's persistent control surface |
| `ScrollProgress` | Global nav | A 2px gradient rail reading build → deploy → intelligence |
| `AnimatedThemeToggler` | Global nav | Circle-wipe theme transition via the View Transitions API |
| `BlurFade` | Every section | The single shared scroll-entry animation — one vocabulary across the page |
| `NumberTicker` | About | Counts the four stats up on entry |
| `AnimatedBeam` | Skills | Draws the literal Build → Deploy → Intelligence pipeline between the three cells |
| `OrbitingCircles` | Skills | Orbiting tech marks around the pipeline hub |
| `Marquee` | Skills | The continuous "daily drivers" ticker |
| `MagicCard` | Projects | Cursor-tracking spotlight on each case-study card |
| `BorderBeam` | Projects | A travelling border highlight on hover |
| `Safari` | Projects | Browser chrome framing each project screenshot |
| `Globe` (cobe) | Contact | Rotating globe with a single Bangkok marker |

### shadcn/ui — `ui.shadcn.com`

| Component | Where it's used | Why |
| --- | --- | --- |
| `Command`, `CommandDialog` | Global | The ⌘K palette — jumps to any section or link |
| `Dialog` | Projects | Full case-study detail view |
| `Form`, `Input`, `Textarea`, `Label` | Contact | Accessible form wiring with react-hook-form + Zod validation |
| `Button` | Throughout | The base button primitive |
| `Badge` | Skills, Projects, Experience | Tech-stack chips |
| `Separator` | Global nav | Divides dock groups |
| `Sonner` | Contact | Toast confirmation on submit |
| `Tooltip` | Global nav | Labels for every dock icon |

### Animate UI — `animate-ui.com`

| Component | Where it's used | Why |
| --- | --- | --- |
| `Tabs` (radix) | Projects | Animated filter with a sliding highlight between pillars |
| `Accordion` (radix) | Experience | Height-animated role expansion |
| `Tooltip` (radix) | Global nav | Spring-animated tooltip used for the dock |
| `Button` | Shared | Animated button primitive |

### React Bits — `reactbits.dev`

| Component | Where it's used | Why |
| --- | --- | --- |
| `SplitText` | Every section heading | Per-character reveal on scroll entry |
| `ScrollReveal` | About | Word-by-word reveal for the longer narrative copy |
| `TiltedCard` | About | 3D-tilt profile card |
| `SpotlightCard` | Skills | Pointer-following spotlight on each pillar |
| `Magnet` | Contact | The submit button pulls toward the cursor |

### Bespoke (deliberately not from a library)

| Component | Why it isn't a library component |
| --- | --- |
| [`portrait-hero.tsx`](src/components/portrait-hero.tsx) | The 192-frame scroll-scrubbed portrait engine — no library ships this |
| [`brand-icons.tsx`](src/components/brand-icons.tsx) | GitHub/LinkedIn marks, to avoid a whole icon package for two glyphs |
| [`use-prefers-reduced-motion.ts`](src/hooks/use-prefers-reduced-motion.ts) | SSR-safe media query (see *Reduced motion* below) |
| [`use-media-query.ts`](src/hooks/use-media-query.ts) | Same pattern, generic |

---

## The portrait engine

The hero scrubs a 192-frame image sequence against scroll position, pinned by GSAP
ScrollTrigger.

- Frames live in `public/portrait/desktop/` (640×600) and `public/portrait/mobile/` (384×360),
  named `000.webp` … `191.webp`. `191.webp` doubles as the static poster.
- Decoded frames are held in an `ImageBitmap` LRU cache, so reverse scrubbing is as smooth
  as forward.
- `gsap.matchMedia()` builds separate desktop, mobile and reduced-motion contexts, and tears
  each down on resize.
- ScrollTrigger is armed on the **first scroll intent**, not on mount, so the page is never
  pinned before the visitor has asked to scroll. Until then an idle tween plays a short loop.
- If a frame fails to load the poster stays up and a **Retry** control appears.

To replace it: export your own sequence at those two sizes, keep the zero-padded filenames,
and set `FRAME_COUNT` in [`src/lib/portrait-frames.ts`](src/lib/portrait-frames.ts) to match.

---

## Performance and accessibility

- **One heavy canvas at a time.** The portrait is the only WebGL/canvas element above the
  fold; the contact globe is far below it and mounts on approach.
- **Reduced motion is a first-class path, not a switch.** Under `prefers-reduced-motion` the
  portrait never fetches a single frame — the poster is served instead — the terminal prints
  instantly, section reveals resolve to their final state, and in-page navigation jumps
  without travel.
- **WCAG AA in both themes.** The accent is a luminous lime that clears AA on the dark ground
  but only reaches ~1.1:1 on the light one, so light mode darkens every token that can render
  as text. `--signal-vivid` keeps the original glow for fills, borders and beams, where
  contrast rules don't apply. Measured: 4.78:1 light, 13.2:1 dark.
- **Keyboard navigation.** A skip link is the first tab stop, ahead of the dock. The ⌘K
  palette reaches every section. All interactive elements are real, focusable controls.
- **No horizontal overflow** at 390 / 414 / 768 / 1024 / 1440px — verified by test.

## Tests

`npx playwright test` — 14 tests covering the portrait engine (scrub, per-breakpoint frame
sizes, reduced-motion fallback, failure recovery, resize rebuilds), plus section rendering,
the project dialog and filters, contact validation, the command palette, the theme toggle,
the skip link, and the overflow invariant above.
