import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorker } from "@/components/service-worker";
import { profile } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${profile.name} — Software Engineer · Full-Stack Development`,
  description: profile.tagline,
  openGraph: {
    title: `${profile.name} — Software Engineer · Full-Stack Development`,
    description: profile.tagline,
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <TooltipProvider delayDuration={200}>
            {/* First element in the body so it is the first tab stop, ahead of
                the fixed navigation dock. */}
            <a href="#about" className="skip-link">Skip introduction</a>
            {children}
            <Toaster position="bottom-right" />
            <ServiceWorker />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
