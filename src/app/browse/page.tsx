import Link from "next/link"
import type { Metadata } from "next"

import { pageMetadata } from "@/lib/seo"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Folder } from "@/components/folder"
import { ArrowRight, Sparkles } from "@/components/icons"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "All Icon Types & Collections",
    description:
      "Explore all icon styles, dimensions, and collections in the Flux ecosystem. Choose a collection folder to browse its complete catalog.",
    path: "/browse",
  })
}

const CONTAINER = "mx-auto max-w-5xl px-4 sm:px-6"

export default function BrowsePage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-background text-foreground bg-paper-grid relative overflow-hidden pb-20">
        {/* Specular ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-100 bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-full"
        />

        {/* HERO HEADER */}
        <section className="relative pt-10 pb-10 sm:pt-14 sm:pb-12 text-center">
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 inline-flex flex-wrap items-center justify-center gap-2">
                <span className="ann-tag-amber font-mono text-[11px] font-semibold uppercase tracking-wider">
                  [ MULTI-STYLE ECOSYSTEM ]
                </span>
                <span className="ann-tag-green font-mono text-[11px] font-semibold uppercase tracking-wider">
                  [ 5 DISTINCT PARADIGMS ]
                </span>
                <span className="ann-tag-purple font-mono text-[11px] font-semibold uppercase tracking-wider">
                  [ EXPANDABLE DIRECTORY ]
                </span>
              </div>

              <h1 className="text-3xl font-display uppercase tracking-wide text-balance sm:text-4xl lg:text-5xl text-foreground">
                BROWSE ALL ICON <span className="ann-underline-amber text-primary">TYPES</span> & FAMILIES.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm text-balance text-muted-foreground font-handwritten sm:text-base leading-relaxed">
                Every style and collection has its dedicated space. Hover or click on any folder below to inspect live icon specimens and explore full collections.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Button size="default" render={<Link href="/icons" />} nativeButton={false}>
                  Direct 1,000 Icons Library
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="default" variant="outline" render={<Link href="/install" />} nativeButton={false}>
                  Install Package
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FOLDERS GRID SECTION */}
        <section className="relative py-4">
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

              {/* FOLDER 1: KEYLINE 24x24 (CORE LIVE SYSTEM) */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-4 sm:p-5 shadow-md hover:border-amber-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
                {/* Header status bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      LIVE & PRODUCTION READY
                    </span>
                  </div>
                  <span className="ann-tag-amber font-mono text-[10px] font-bold">
                    [ 1,000 ICONS ]
                  </span>
                </div>

                {/* Interactive 3D Folder (Click or hover to open collection!) */}
                <div className="my-2 flex items-center justify-center">
                  <Folder
                    color="amber"
                    size="md"
                    variant="keyline"
                    href="/icons"
                  />
                </div>

                {/* Details and Action */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                      Keyline 24×24 Grid System
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      8,000 SVGs
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-handwritten leading-relaxed line-clamp-2">
                    Flagship precision icon suite drawn on a strict 24×24 grid with a 2px keyline. Includes Stroke, Two-Tone, Duotone and Fill weights with rounded &amp; sharp corners.
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Stroke</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Two-Tone</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Duotone</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Fill</span>
                    </div>

                    <Link
                      href="/icons"
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline group-hover:translate-x-1 transition-transform"
                    >
                      Open Collection <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* FOLDER 2: FLUX EXTENDED SYSTEM (2,242 ICONS · 6 STYLES) */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-card/85 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-blue-500/5 hover:border-blue-500/70 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      LIVE &amp; EXPLORABLE
                    </span>
                  </div>
                  <span className="ann-tag-blue font-mono text-[10px] font-bold">
                    [ 2,242 ICONS ]
                  </span>
                </div>

                <div className="my-2 flex items-center justify-center">
                  <Folder
                    color="blue"
                    size="md"
                    variant="extended"
                    href="/extended"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Link href="/extended" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                        Flux Extended System
                      </h3>
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      13,450+ SVGs
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-handwritten leading-relaxed line-clamp-2">
                    Extended ecosystem of 2,242 icons across 6 distinct visual styles: Linear, Bold, Two-Tone, Bulk, Broken, and Outline. Unified 24×24 grid with shadcn/ui and React support.
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Linear</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Bold</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Two-Tone</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Bulk</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Broken</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Outline</span>
                    </div>

                    <Link
                      href="/extended"
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group-hover:translate-x-1 transition-transform"
                    >
                      Open Collection <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* FOLDER 3: FLUX MOTION SYSTEM (467 ANIMATED ICONS) */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-purple-500/40 bg-card/85 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-purple-500/5 hover:border-purple-500/80 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/15 cursor-pointer">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      LIVE &amp; ANIMATED
                    </span>
                  </div>
                  <span className="ann-tag-purple font-mono text-[10px] font-bold">
                    [ 467 ICONS ]
                  </span>
                </div>

                <div className="my-2 flex items-center justify-center">
                  <Folder
                    color="motion"
                    size="md"
                    variant="motion"
                    href="/motion"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Link href="/motion" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                        Flux Motion System
                      </h3>
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Framer Motion
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-handwritten leading-relaxed line-clamp-2">
                    467 micro-interactive animated icons built with Framer Motion. Smooth hover triggers, continuous loop modes, physics-based springs, and clean React component code.
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Spin</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Bounce</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Ring</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Draw</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Pop</span>
                    </div>

                    <Link
                      href="/motion"
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline group-hover:translate-x-1 transition-transform"
                    >
                      Open Collection <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* FOLDER 4: ORGANIC & HANDCRAFTED VECTORS */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-4 sm:p-5 shadow-md hover:border-foreground/40 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-2 rounded-full bg-amber-500" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      DESIGN LABS EXPERIMENTAL
                    </span>
                  </div>
                  <span className="ann-tag-amber font-mono text-[10px] font-bold">
                    [ HANDCRAFTED ]
                  </span>
                </div>

                <div className="my-2 flex items-center justify-center">
                  <Folder
                    color="white"
                    size="md"
                    variant="organic"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                      Organic &amp; Hand-Drawn
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Experimental
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-handwritten leading-relaxed line-clamp-2">
                    Artisanal vector sketches with subtle pressure variance, pencil grain and human warmth for expressive editorial storytelling.
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Pencil Dynamics</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Organic Curves</span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground">
                      Labs Prototype
                    </span>
                  </div>
                </div>
              </div>

              {/* FOLDER 4: MICRO 16x16 DENSE SYSTEM */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-4 sm:p-5 shadow-md hover:border-purple-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-2 rounded-full bg-purple-500" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      PLANNED ROADMAP
                    </span>
                  </div>
                  <span className="ann-tag-purple font-mono text-[10px] font-bold">
                    [ 16×16 DENSITY ]
                  </span>
                </div>

                <div className="my-2 flex items-center justify-center">
                  <Folder
                    color="black"
                    size="md"
                    variant="micro"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                      Micro System 16px
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      High Density
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-handwritten leading-relaxed line-clamp-2">
                    Sub-pixel aligned micro icons tuned for tight table cells, code editors, file trees, and compact SaaS utility bars.
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">16×16 Snapped</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 border border-border/50">Zero Blur</span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground">
                      Planned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM FEATURE CARDS */}
        <section className="relative py-14">
          <div className={CONTAINER}>
            <div className="rounded-3xl border border-dashed border-amber-500/40 bg-amber-500/5 p-8 sm:p-12 text-center max-w-4xl mx-auto backdrop-blur-md">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-4">
                <Sparkles className="size-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-foreground">
                Want to suggest or contribute a new icon family?
              </h2>
              <p className="mt-3 text-muted-foreground font-handwritten text-base max-w-xl mx-auto">
                Flux Icons is fully open source under MIT. If you have requests for new styles, collections, or missing drawings, let us know directly on GitHub.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" render={<Link href="/icons" />} nativeButton={false}>
                  Open Keyline Icons (1,000)
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/install" />} nativeButton={false}>
                  Install &amp; Setup Guide
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
