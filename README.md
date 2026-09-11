# Portfolio

Personal portfolio site for Pratan Nilson — [sayhighz.github.io](https://sayhighz.github.io)

## Stack

Next.js 16 (static export) · TypeScript · Tailwind CSS v4 · GSAP · Playwright

## Development

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Content

All site copy lives in [`web/src/lib/content.ts`](web/src/lib/content.ts) — profile, projects,
experience and skills. Nothing else in the codebase hardcodes copy, so editing
that one file updates the whole site.

## Commands

```bash
npm run build      # static export to web/out
npm run typecheck  # tsc --noEmit
npm run test:e2e   # Playwright, runs against the exported site
```

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the static export and publishes it to GitHub Pages.

## The portrait sequence

The hero animation plays pre-rendered webp frames on a canvas: a 96-frame idle
loop that ping-pongs, and a 240-frame transform sequence scrubbed by scroll.
Frames are fetched on demand and held in a bounded LRU cache, so reverse
scrubbing stays smooth without pinning every bitmap in memory.
