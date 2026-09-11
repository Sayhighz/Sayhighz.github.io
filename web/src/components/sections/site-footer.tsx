import { profile } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-[4.5vw] py-8">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>{profile.name} — {profile.location}</span>
        <span>Built with Next.js · Deployed on Vercel</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
