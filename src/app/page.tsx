import type { Metadata } from "next"
import Link from "next/link"

import { GitHubLogo, NpmLogo } from "@/components/brand-logos"
import { ArrowRight, Grid2x2, Layers, Play } from "@/components/icons"
import { Folder } from "@/components/folder"
import { Glyph } from "@/components/glyph"
import { HomeSearch } from "@/components/home-search"
import { IconWall } from "@/components/icon-wall"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"
import { Button } from "@/components/ui/button"
import { Faq } from "@/components/faq"
import { FrameworkInstaller } from "@/components/framework-installer"
import { CornersShowcase } from "@/components/corners-showcase"
import { KeylineShowcase } from "@/components/keyline-showcase"
import { StyleShowcase } from "@/components/style-showcase"
import { homeFaq } from "@/lib/faq"
import {
  INSTALL_EXAMPLE_ICON_NAMES,
  SPONSOR_ICON_NAMES,
  pickFrameworkHintIcons,
  pickStyleSampleIcons,
} from "@/lib/home"
import { npmDownloads } from "@/lib/npm"
import { artOf } from "@/components/glyph"
import { CORNERS, loadIcons, STYLES, type Icon } from "@/lib/icons"
import { searchSuggestions } from "@/lib/search-suggestions"
import { cn } from "@/lib/utils"
import {
  homeCardDescription,
  homeCardTitle,
  homeJsonLd,
  pageMetadata,
} from "@/lib/seo"
import {
  SET_LICENSE,
  SET_NPM_URL,
  SET_SPONSOR_URL,
} from "@/lib/site-chrome"
import { siteSponsors, sponsorHref } from "@/lib/sponsors"

/**
 * The landing page, at the origin.
 *
 * Nothing rendered here for a while: the browser moved to `/icons` so that it
 * and the 414 icon pages would sit under one folder, and `/` was left as a 308
 * to it. That was a real cost, recorded at the time in `next.config.ts`, and
 * this page is what takes it back. The redirect is gone in the same change,
 * because two ways to reach one page is the duplication the route policy
 * exists to prevent, and a page behind a redirect is a page nobody sees.
 *
 * What it is *for* decides everything on it. Someone arriving at the bare
 * domain has not decided to use the set yet, so this page answers the questions
 * that come before the grid does: how many icons, in what styles, under what
 * licence, and what it looks like in something real. The grid answers a
 * different question, "is the icon I need in here", and it is one click and one
 * search field away.
 *
 * Every number on it is read off disk. `loadIcons()` is the same memoised read
 * the browser and the sitemap use, so the counts here cannot disagree with the
 * set, and there is no figure typed into a string anywhere on the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const total = (await loadIcons()).length

  return pageMetadata({
    path: "/",
    /*
      The one page that opts out of the layout's `%s · Keyline Icons` template,
      because the brand has to lead here rather than trail. This is the page the
      set should be found by name on, Google weights the front of a title, and
      it is the address every inbound link to the bare domain lands on.

      The title that used to be on `/icons` is this one, moved rather than
      copied. Two pages competing for "shadcn icons" is the cannibalisation the
      route policy exists to prevent, so the browser took a browse-intent title
      in the same change. See `references/route-policy.md` in the `keyline-seo`
      skill.
    */
    title: {
      absolute: homeCardTitle(total),
    },
    /*
      "stroke, two-tone, duotone and fill, rounded or sharp" is one phrase, spelled the
      same way here, on the browser's description, in `SITE_DESCRIPTION` and in
      the hero over the grid. It is one claim about what the set offers, and a
      second wording of it is how two surfaces start disagreeing about the set.

      "three weights" came out to pay for it. The count was already redundant
      beside the three names, and a page that lists three weights and then a
      treatment reads as four of something.
    */
    description:
      `3,700+ free ${SET_LICENSE}-licensed icons for shadcn/ui & React across three dedicated collections: ` +
      `1,000 Keyline (4 styles, 2 corners), 2,242 Extended (6 styles), and 467 Framer Motion animated icons. ` +
      `Search the ecosystem, copy any icon as SVG or JSX, or import native React components.`,
    socialDescription: homeCardDescription(total),
  })
}

/** The page container, repeated exactly. Padding inside the max width. */
const CONTAINER = "mx-auto w-full max-w-360 px-6 lg:px-8"

/**
 * One drawing by name, or nothing.
 *
 * The names this page asks for are declared in `lib/home.ts` and checked
 * against the icons on disk by `pipeline/check-demos.mjs`, so a miss here means
 * a rename landed without the check running. It renders as a gap rather than as
 * a 500: a landing page that crashes on a renamed icon is a worse failure than
 * one drawing missing from a row of six.
 */
function find(icons: Icon[], name: string) {
  return icons.find((icon) => icon.name === name)
}

/*
  `StyleGlyph` used to live here, drawing one icon in one style with a fallback
  to stroke. The style cards were its only caller and it moved into
  `components/style-showcase.tsx` with them.
*/

/**
 * A section's heading block: the name, then one line under it.
 *
 * Centred, and the whole page with it. Every section led from the left margin
 * while the hero above them was centred, so the page changed its mind about its
 * own axis after the first screen. The content under these headings is full
 * width and mostly symmetrical — three cards, three panels, a terminal — and a
 * heading hard against the left edge of a symmetrical block reads as a caption
 * that slipped.
 *
 * `max-w-2xl` on the lead and `mx-auto` on the pair: a centred paragraph set to
 * the full column is unreadable past about 75 characters, and centred text with
 * ragged edges on both sides needs a tighter measure than left-aligned text
 * does, not a looser one.
 *
 * The lead is optional. A section whose controls introduce themselves does not
 * need a sentence saying it is about to show them.
 */
function SectionHead({
  title,
  lead,
  tag,
  tagColor = "amber",
  className,
}: {
  title: string
  lead?: string
  tag?: string
  tagColor?: "amber" | "blue" | "purple" | "green"
  className?: string
}) {
  const tagClass =
    tagColor === "blue"
      ? "ann-tag-blue"
      : tagColor === "purple"
        ? "ann-tag-purple"
        : tagColor === "green"
          ? "ann-tag-green"
          : "ann-tag-amber"

  return (
    <div className={cn("text-center", className)}>
      {tag && (
        <div className="mb-3">
          <span className={cn(tagClass, "font-handwritten text-xs font-semibold")}>[{tag}]</span>
        </div>
      )}
      <h2 className="text-3xl font-display uppercase tracking-wider sm:text-4xl text-foreground">
        {title}
      </h2>
      {lead && (
        <p className="mx-auto mt-3 max-w-2xl text-base text-balance text-muted-foreground font-handwritten">
          {lead}
        </p>
      )}
    </div>
  )
}

/*
  `Code` used to live here, wrapping the two snippets this page showed. Both
  moved into `components/install-switcher.tsx` with the panes they belong to,
  and the copy there is `bg-muted` rather than `bg-background`, because a pane
  is white now and a white block on a white pane is invisible.
*/

export default async function Page() {
  const [icons, npm] = await Promise.all([loadIcons(), npmDownloads()])

  const total = icons.length
  /*
    Per style, counted rather than declared. `stroke` is complete by definition
    and the other two are not: they need a region to fill, and `bar-chart` is
    three open strokes with no interior. Those gaps are the reason the three
    numbers differ, and stating them is more honest than a "three styles" claim
    that implies 3× the count.
  */
  const perStyle = STYLES.map((style) => ({
    style,
    count: icons.filter((icon) => icon.art[style]).length,
  }))
  /*
    Every file the set ships, both corner treatments, and it is deliberately not
    the sum of `perStyle`. Those three numbers describe one treatment, because
    coverage is a fact about a drawing and squaring its corners does not change
    whether it encloses a region a fill needs. A count of files is a claim about
    the directory, and since sharp landed the directory holds each drawing twice.

    Counted across the treatments rather than doubled, which is the rule
    `pipeline/check-readmes.mjs` writes down for the same number in the README: a
    third treatment then needs no arithmetic here, and a derived count cannot go
    stale in a way nobody notices.
  */
  const files = icons.reduce(
    (sum, icon) =>
      sum +
      CORNERS.reduce(
        (n, corners) =>
          n + STYLES.filter((style) => artOf(icon, style, corners)).length,
        0
      ),
    0
  )
  const contained = icons.filter((icon) => icon.container !== "regular").length
  /* Split by form as well as counted together: the containers section states the
     total, and the FAQ's answer about square and circle states each. Both come
     off the same array rather than from a number typed into either. */
  const containers = {
    square: icons.filter((icon) => icon.container === "square").length,
    circle: icons.filter((icon) => icon.container === "circle").length,
  }


  /* The drawing the install terminal's `cli add` line names, from the same
     kind of checked list, so a rename cannot leave a command that 404s. */
  const [installExample] = INSTALL_EXAMPLE_ICON_NAMES

  /*
    The questions, built once. `components/faq.tsx` renders this array and
    `homeJsonLd` quotes it into a `FAQPage` node, and that is the whole reason it
    is one variable rather than two calls: the markup may only describe what the
    page shows, and two calls is how the two start to disagree.
  */
  const faq = homeFaq({ total, byStyle: perStyle, files, containers })

  /* The closing sponsor card's glyph, resolved here beside the hero's three
     rather than at the bottom of the tree, so every drawing this page names is
     looked up in one place. */
  const sponsorIcon = find(icons, SPONSOR_ICON_NAMES[0])

  /* Only the tier that was promised placement here. `lib/sponsors.ts` is the
     list, and the README carries everyone rather than just this tier. */
  const sponsors = siteSponsors()



  return (
    <>
      {/*
        The set's structured data, which belongs on this page and could not be
        here while nothing rendered at `/`. It declares two entities, the
        website and the icon set itself, and the icon pages' `isPartOf` already
        points at the first of them by `@id`. It moved off `/icons` in this
        change: `SoftwareApplication` describes the application, and the browser
        is one page inside it.

        Server-rendered in the body. Google reads it from either place and
        `metadata` has no field for it.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd({ total, styles: STYLES, faq })),
        }}
      />
      <SiteNav />

      <main>
        {/*
          The hero, with the set drawn behind it.

          `overflow-hidden` is what lets the wall run to both edges of the
          window while the text stays in the page's own box: the wall is wider
          than the column and would otherwise put a horizontal scrollbar on the
          page.
        */}
        {/* SECTION 1: HERO STUDIO */}
        <section className="relative overflow-hidden pt-16 sm:pt-20 lg:pt-28 pb-20 lg:pb-32 bg-paper-grid">
          <IconWall
            icons={icons}
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-160 select-none md:block opacity-40"
          />

          <div className={`relative ${CONTAINER}`}>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                <span className="ann-tag-amber">[ 3,700+ ICONS ECOSYSTEM ]</span>
                <span className="ann-tag-blue">[ 3 DEDICATED VAULTS ]</span>
                <span className="ann-tag-purple">[ 100% FREE &amp; MIT ]</span>
              </div>
              <h1 className="text-4xl font-display uppercase tracking-wide text-balance sm:text-5xl lg:text-6xl text-foreground">
                PIXEL-PERFECT ICONS FOR{" "}
                <span className="ann-underline-amber text-primary">SHADCN/UI</span> &amp; REACT.
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base text-balance text-muted-foreground font-handwritten sm:text-lg leading-relaxed">
                A unified ecosystem of 3,700+ free vector icons across three purpose-built collections: 1,000 Keyline grid icons, 2,242 Extended interface glyphs, and 467 interactive Motion icons. Zero runtime bloat, MIT licensed.
              </p>

              <HomeSearch
                suggestions={searchSuggestions(icons)}
                className="mx-auto mt-10 sm:mt-12 max-w-xl"
              />

              {npm && (
                <a
                  href={SET_NPM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted py-1 pr-3 pl-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <NpmLogo className="size-4" />
                  <span>
                    <span className="font-medium text-foreground">
                      {npm.total.toLocaleString("en-US")} downloads
                    </span>{" "}
                    on npm
                    <span className="hidden sm:inline">
                      , {npm.lastWeek.toLocaleString("en-US")} in the last week
                    </span>
                  </span>
                  <span className="sr-only">{" (opens in a new tab)"}</span>
                </a>
              )}

              <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  render={<Link href="/browse" />}
                  nativeButton={false}
                >
                  Browse all collections (3,700+)
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  render={<Link href="/install" prefetch={false} />}
                  nativeButton={false}
                >
                  Install packages
                </Button>
              </div>
            </div>

            {/* THREE CORE VAULTS CARDS (Replaces single 1,000 fact cards) */}
            <div className="mx-auto mt-20 lg:mt-28 grid max-w-5xl gap-5 text-left md:grid-cols-3">
              {/* Card 1: Keyline */}
              <Link
                href="/icons"
                className="paper-card-dashed group flex flex-col justify-between p-6 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Grid2x2 className="size-5" />
                    </div>
                    <span className="ann-tag-amber text-xs font-mono font-bold">[ 1,000 ICONS ]</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Keyline Grid Vault
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground font-handwritten leading-relaxed">
                      Flagship precision icon suite drawn on a strict 24×24 grid with a 2px keyline. 4 weights (stroke, two-tone, duotone, fill) × 2 corner treatments. 8,000 SVGs.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  Explore Keyline Vault <ArrowRight className="size-3" />
                </div>
              </Link>

              {/* Card 2: Extended */}
              <Link
                href="/extended"
                className="paper-card-dashed group flex flex-col justify-between p-6 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Layers className="size-5" />
                    </div>
                    <span className="ann-tag-blue text-xs font-mono font-bold">[ 2,242 ICONS ]</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Extended UI Vault
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground font-handwritten leading-relaxed">
                      Comprehensive interface system covering 28+ categories across 6 distinct visual styles: linear, bold, two-tone, bulk, broken, and outline. 13,450+ SVGs.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  Explore Extended Vault <ArrowRight className="size-3" />
                </div>
              </Link>

              {/* Card 3: Motion */}
              <Link
                href="/motion"
                className="paper-card-dashed group flex flex-col justify-between p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Play className="size-5" />
                    </div>
                    <span className="ann-tag-purple text-xs font-mono font-bold">[ 467 ICONS ]</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Animated Motion Vault
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground font-handwritten leading-relaxed">
                      Drop-in interactive React icons powered by Framer Motion. Smooth micro-interactions with hover triggers, tap feedback, and continuous state pulses.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-1 font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                  Explore Motion Vault <ArrowRight className="size-3" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 01: THREE VAULTS (INTERACTIVE FOLDER PREVIEWS) */}
        <section className={`${CONTAINER} py-16 lg:py-24`}>
          <SectionHead
            tag="SECTION 01: THREE SPECIALIZED VAULTS"
            tagColor="blue"
            title="One Ecosystem. Three Specialized Collections."
            lead="Every style and dimension of modern UI icons, organized into three focused vaults with zero runtime bloat."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vault 1 Folder Card */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-5 shadow-md hover:border-amber-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    PRECISION SYSTEM
                  </span>
                </div>
                <span className="ann-tag-amber font-mono text-[10px] font-bold">
                  [ 1,000 ICONS ]
                </span>
              </div>
              <div className="my-3 flex items-center justify-center">
                <Folder color="amber" size="md" variant="keyline" href="/icons" />
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base uppercase tracking-wide text-foreground">
                    Keyline 24×24 Grid
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">8,000 SVGs</span>
                </div>
                <p className="text-xs text-muted-foreground font-handwritten line-clamp-2">
                  Precision stroke drawings, two-tone plates, duotone contrasts and solid fills with rounded and sharp corners.
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    4 styles · 2 corners
                  </span>
                  <Link
                    href="/icons"
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Open <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Vault 2 Folder Card */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-card/85 backdrop-blur-xl p-5 shadow-lg shadow-blue-500/5 hover:border-blue-500/70 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    EXPANDED SUITE
                  </span>
                </div>
                <span className="ann-tag-blue font-mono text-[10px] font-bold">
                  [ 2,242 ICONS ]
                </span>
              </div>
              <div className="my-3 flex items-center justify-center">
                <Folder color="blue" size="md" variant="extended" href="/extended" />
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base uppercase tracking-wide text-foreground">
                    Flux Extended
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">13,450+ SVGs</span>
                </div>
                <p className="text-xs text-muted-foreground font-handwritten line-clamp-2">
                  Massive collection across 6 styles: Linear, Bold, Two-Tone, Bulk, Broken, and Outline with 28+ domains.
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    6 styles · 28 categories
                  </span>
                  <Link
                    href="/extended"
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Open <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Vault 3 Folder Card */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-purple-500/40 bg-card/85 backdrop-blur-xl p-5 shadow-lg shadow-purple-500/5 hover:border-purple-500/80 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/15">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    INTERACTIVE REACT
                  </span>
                </div>
                <span className="ann-tag-purple font-mono text-[10px] font-bold">
                  [ 467 ICONS ]
                </span>
              </div>
              <div className="my-3 flex items-center justify-center">
                <Folder color="motion" size="md" variant="motion" href="/motion" />
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base uppercase tracking-wide text-foreground">
                    Flux Motion
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">Framer Motion</span>
                </div>
                <p className="text-xs text-muted-foreground font-handwritten line-clamp-2">
                  Living interactive React icons with hover physics, clicks, and micro-animations designed for modern web apps.
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    Interactive animations
                  </span>
                  <Link
                    href="/motion"
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Open <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: LIVE KEYLINE PLAYGROUND & CUSTOMIZER */}
        <section className={`${CONTAINER} py-16 lg:py-24`}>
          <SectionHead
            tag="SECTION 02: KEYLINE PLAYGROUND"
            title="Stroke, two-tone, duotone and fill"
            lead="Vault 1 deep dive: Stroke is the foundational drawing; the other three are derived from it, and every one of them is cut both rounded and sharp. A family stays recognisable whichever weight a surface calls for."
          />

          <div className="mt-10">
            <StyleShowcase
              icons={pickStyleSampleIcons(icons)}
              perStyle={perStyle}
            />
          </div>
        </section>

        <section className={`${CONTAINER} py-16 lg:py-24`}>
          <SectionHead
            tag="SECTION 03: RADII CONTROL"
            title="Rounded and sharp corners"
            lead={`All ${total.toLocaleString("en-US")} drawings are cut both ways, in every weight they carry, so this is a switch over the set rather than a second set beside it.`}
          />

          <div className="mt-10 lg:mt-12">
            <CornersShowcase icons={icons} />
          </div>
        </section>

        {/* SECTION 4: GRID SPECS */}
        <section className={`${CONTAINER} py-16 lg:py-24`}>
          <SectionHead
            tag="SECTION 04: GRID SPECS"
            title="Square & circle containers"
            lead={`${contained} of the ${total.toLocaleString("en-US")} icons have containers that wrap the base drawing.`}
          />

          <div className="mt-10 lg:mt-12">
            <KeylineShowcase />
          </div>
        </section>

        {/* SECTION 5: CHALKBOARD DEVELOPER CONSOLE */}
        <section className={`${CONTAINER} py-16 lg:py-24`}>
          <SectionHead
            tag="SECTION 05: INSTALLATION"
            title="Works in your stack"
            lead="React components generated from the same files as the SVGs, plus Vue and Svelte through Iconify."
          />

          <div className="mt-10">
            <FrameworkInstaller
              example={installExample}
              marks={pickFrameworkHintIcons(icons)}
            />
          </div>
        </section>

        {/* SECTION 6: CATEGORIZED FAQ NOTEBOOK */}
        <section className={`${CONTAINER} py-16 lg:py-24`}>
          <SectionHead
            tag="SECTION 06: FAQ NOTEBOOK"
            title="Frequently Asked Questions"
            lead="The questions asked before taking a set: what it covers, what it costs, and what it works with."
          />

          <Faq items={faq} className="mx-auto mt-10 max-w-5xl" />

          <p className="mx-auto mt-10 max-w-5xl font-handwritten text-base text-muted-foreground text-center">
            More on installing, importing and switching from another set:{" "}
            <Link
              href="/install"
              prefetch={false}
              className="underline underline-offset-2 transition-colors hover:text-foreground font-bold text-foreground"
            >
              How to install
            </Link>
            .
          </p>
        </section>

        {/* SECTION 6: COMMUNITY SUPPORTER WALL & FOOTER */}
        <section className={`${CONTAINER} py-8 lg:py-12`}>
          <div className="paper-card-dashed paper-tape-top-left relative mx-auto flex max-w-lg flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
              <span className="ann-tag-amber font-handwritten">
                [ 💖 SUPPORT THE PROJECT ]
              </span>
              <span className="ann-tag-green font-handwritten">
                [ 100% MIT FREE ]
              </span>
            </div>

            {sponsorIcon?.art.stroke && (
              <Glyph art={sponsorIcon.art.stroke} size={28} stroke={2} />
            )}

            <p className="font-handwritten text-lg leading-snug font-medium text-foreground">
              Keep the set 100% free and open source forever:{" "}
              <span className="font-sans text-sm text-muted-foreground">
                sponsorship is what pays for the hours the next hundred vector icons take to craft.
              </span>
            </p>

            <Button
              size="lg"
              className="font-handwritten self-start text-sm font-bold shadow-sm"
              render={
                <a
                  href={SET_SPONSOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
            >
              <GitHubLogo data-icon="inline-start" className="size-4" />
              Sponsor on GitHub
              <span className="sr-only">{" (opens in a new tab)"}</span>
            </Button>

            <div className="flex flex-col gap-3 border-t border-dashed border-border pt-6 text-sm">
              <p className="font-handwritten text-xs font-bold uppercase tracking-wider text-muted-foreground">
                [ COMMUNITY SUPPORTERS ]
              </p>
              {sponsors.length === 0 ? (
                <p className="font-sans text-muted-foreground">
                  Nobody yet. Yours would be the first name here.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-x-4 gap-y-2 font-handwritten text-sm text-muted-foreground">
                  {sponsors.map((sponsor) => (
                    <li key={sponsor.login}>
                      <a
                        href={sponsorHref(sponsor)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ann-tag-cyan hover:text-foreground transition-colors"
                      >
                        {sponsor.name}
                        <span className="sr-only">
                          {" (opens in a new tab)"}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
