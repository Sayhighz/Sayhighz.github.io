"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { COBEOptions } from "cobe";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import Magnet from "@/components/Magnet";
import { Globe } from "@/components/ui/globe";
import { BlurFade } from "@/components/ui/blur-fade";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { SectionHeading } from "@/components/sections/section-heading";
import { profile } from "@/lib/content";

const schema = z.object({
  name: z.string().min(2, "Please tell me your name."),
  email: z.string().email("That doesn't look like an email address."),
  message: z.string().min(12, "A little more detail helps me reply usefully."),
});

type FormValues = z.infer<typeof schema>;

/** Full cobe options — `Globe` swaps out its defaults when `config` is passed. */
const globeConfig: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.28,
  // Unlit sphere with a high mapBrightness: the landmass dots read as light
  // points against the dark body, matching the rest of the dark theme.
  dark: 1,
  diffuse: 3,
  mapSamples: 16000,
  mapBrightness: 12,
  baseColor: [0.25, 0.27, 0.3],
  markerColor: [0.62, 0.94, 0.29],
  glowColor: [0.1, 0.1, 0.12],
  markers: [{ location: [profile.coordinates.lat, profile.coordinates.lng], size: 0.12 }],
};

export function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // No server-side handler yet — hand the message off to the visitor's mail
      // client, prefilled, so nothing is silently dropped. Swap this for a route
      // handler (Resend, Formspree) when one exists.
      const subject = `Portfolio enquiry from ${values.name}`;
      const body = `${values.message}\n\n—\n${values.name}\n${values.email}`;
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      toast.success("Opening your email app", {
        description: `Your message to me is prefilled and ready to send, ${values.name.split(" ")[0]}.`,
      });
      form.reset();
    } catch {
      toast.error("Something went wrong", { description: `Email me directly at ${profile.email}.` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="section-shell pb-40" aria-labelledby="contact-title">
      <SectionHeading
        index="05"
        kicker="Contact"
        title="Let's build something"
        id="contact-title"
        description="Open to engineering roles and interesting problems across the build–deploy–intelligence stack."
      />

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <BlurFade delay={0.1} inView>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Message
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="What are you working on?" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Magnet padding={70} magnetStrength={5} wrapperClassName="inline-block">
                <Button type="submit" size="lg" disabled={submitting} className="group font-medium">
                  {submitting ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />Sending…</>
                  ) : (
                    <>Send message
                      <Send className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </Magnet>
            </form>
          </Form>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-border/60 pt-7">
            <a href={`mailto:${profile.email}`} className="contact-link">
              <Mail className="size-4" aria-hidden="true" />{profile.email}
            </a>
            <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="contact-link">
              <GithubIcon className="size-4" />GitHub
            </a>
            <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link">
              <LinkedinIcon className="size-4" />LinkedIn
            </a>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView className="relative">
          <div className="relative flex h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card/40">
            <div className="absolute left-7 top-7 z-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Based in</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{profile.location}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{profile.timezone}</p>
            </div>
            {/* `config` replaces cobe's defaults wholesale, so every field is
                supplied here. One marker only: Bangkok. */}
            <Globe className="!top-24 scale-[1.15]" config={globeConfig} />
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
