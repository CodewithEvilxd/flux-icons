import Link from "next/link"

import { installFaq } from "@/lib/faq"
import { ICONIFY_PREFIX, ICONIFY_URL, importPath } from "@/lib/icon-code"
import { artOf, CORNERS } from "@/components/glyph"
import { loadIcons, STYLES } from "@/lib/icons"
import { faqJsonLd, pageMetadata } from "@/lib/seo"
import { SET_REPO_URL } from "@/lib/site-chrome"
import { Faq } from "@/components/faq"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"
import { Button } from "@/components/ui/button"
import {
  ArrowUpRight,
  Bell,
  Bin,
  Check,
  ChevronDown,
  Download,
  Layers,
  Plus,
  Settings,
  Sparkle,
  Terminal,
  User,
} from "@/components/icons"
import { InstallTerminal } from "@/components/install-terminal"
import {
  CopyableCodeBlock,
  LucideComparisonCard,
  ScrollProgress,
  type ScrollProgressSection,
  ShadcnCommandBuilder,
} from "@/components/install-guide-client"

export const metadata = pageMetadata({
  path: "/install",
  title: "Install the icons in React or shadcn/ui",
  description:
    "How to add Flux Icons to a shadcn/ui project: copy an SVG, import " +
    "the React components, size them inside Button and Sidebar, and swap out " +
    "lucide without touching your markup.",
  socialDescription:
    "Add Flux Icons to a shadcn/ui project: copy an SVG, import the components, and swap out lucide.",
})

const SECTIONS: ScrollProgressSection[] = [
  { id: "quickstart", label: "Quickstart" },
  { id: "install", label: "React Package" },
  { id: "registry", label: "shadcn CLI" },
  { id: "copy", label: "Raw SVG Copy" },
  { id: "frameworks", label: "Other Frameworks" },
  { id: "sizing", label: "Component Sizing" },
  { id: "weight", label: "Stroke Weights" },
  { id: "lucide", label: "Lucide Swap" },
  { id: "styles", label: "Styles & Geometry" },
  { id: "faq", label: "Setup FAQ" },
]

function Section({
  id,
  badge,
  title,
  children,
}: {
  id: string
  badge?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-dashed border-border/80 pt-10">
      {badge && (
        <div className="mb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-500">
            {badge}
          </span>
        </div>
      )}
      <h2 className="font-display text-2xl font-bold tracking-wide uppercase text-foreground">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 font-handwritten text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export default async function Page() {
  const faq = installFaq()

  const icons = await loadIcons()
  const lines = CORNERS.flatMap((corners) =>
    STYLES.map((style) => ({
      label: corners === "sharp" ? `sharp ${style}` : style,
      code: `import { Bell } from "${importPath(style, corners)}"`,
      count: icons.filter((icon) => artOf(icon, style, corners)).length,
    }))
  )

  const published = lines.reduce((n, l) => n + l.count, 0)
  const codeWidth = Math.max(...lines.map((l) => l.code.length))
  const labelWidth = Math.max(...lines.map((l) => l.label.length))
  const importSample = lines
    .map(
      ({ label, code, count }) =>
        `${code.padEnd(codeWidth + 2)}// ${`${label},`.padEnd(labelWidth + 1)} ${count.toLocaleString("en-US")}`
    )
    .join("\n")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd({ faq, path: "/install" })),
        }}
      />
      <SiteNav />

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 lg:px-8">
        {/* Header */}
        <header className="pt-6 pb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="ann-tag-amber text-xs font-bold">[ QUICK SETUP GUIDE ]</span>
            <span className="text-xs font-mono text-muted-foreground">React & shadcn/ui</span>
          </div>
          <h1 className="font-display text-4xl font-black tracking-wider uppercase text-foreground sm:text-5xl">
            Install the icons in React or shadcn/ui
          </h1>
          <p className="mt-3 font-handwritten text-lg leading-relaxed text-muted-foreground">
            The set is drawn on the exact same 24×24 grid and 2px keyline that
            shadcn/ui&apos;s defaults assume, so it drops in without any
            adjustment to your components or styling tokens.
          </p>

          {/* 4 Feature Highlights */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-border/80 bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Check className="size-4 text-emerald-500 shrink-0" />
                <span>Zero Configuration Needed</span>
              </div>
              <p className="mt-1 font-handwritten text-xs text-muted-foreground leading-relaxed">
                Uses <code>currentColor</code> for fills and strokes, inheriting any <code>text-*</code> class seamlessly.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-border/80 bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Layers className="size-4 text-blue-500 shrink-0" />
                <span>3 Purpose-Built Vaults</span>
              </div>
              <p className="mt-1 font-handwritten text-xs text-muted-foreground leading-relaxed">
                1,000 Keyline grid glyphs, 2,242 Extended UI icons, and 467 interactive Motion icons.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-border/80 bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Terminal className="size-4 text-amber-500 shrink-0" />
                <span>shadcn CLI Indexed</span>
              </div>
              <p className="mt-1 font-handwritten text-xs text-muted-foreground leading-relaxed">
                Add source components directly with <code>npx shadcn add @flux/name</code> without dependency lock-in.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-border/80 bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Sparkle className="size-4 text-purple-500 shrink-0" />
                <span>1:1 Lucide Drop-in</span>
              </div>
              <p className="mt-1 font-handwritten text-xs text-muted-foreground leading-relaxed">
                Identical 24×24 keyline construction: swap imports without touching component JSX markup.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-12">
          {/* Quickstart Console */}
          <Section id="quickstart" badge="[ STEP 01 ]" title="Quickstart Console">
            <p>
              Choose your package manager below. You can either install the entire component library as a project dependency, or execute the CLI once to drop individual icon source files straight into your repository.
            </p>
            <InstallTerminal example="bell" />
          </Section>

          {/* React Package */}
          <Section id="install" badge="[ STEP 02 ]" title="Install the React package">
            <p>
              Every icon is generated as an independent, fully tree-shakeable React component from the source SVGs, guaranteeing that downstream packages never diverge from the master drawings.
            </p>
            <CopyableCodeBlock language="bash" filename="TERMINAL">
              npm i @flux-icons/react
            </CopyableCodeBlock>
            <p>
              Import glyphs directly by name. All components accept standard SVG props, including <code>className</code>, <code>size</code>, and <code>strokeWidth</code>:
            </p>
            <CopyableCodeBlock language="tsx" filename="APP.TSX">
{`import { Check, Plus, Settings } from "@flux-icons/react"

export function Example() {
  return (
    <div className="flex items-center gap-4 text-foreground">
      <Check className="size-4 text-emerald-500" />
      <Plus size={16} />
      <Settings strokeWidth={1.5} className="text-muted-foreground" />
    </div>
  )
}`}
            </CopyableCodeBlock>
          </Section>

          {/* shadcn CLI */}
          <Section id="registry" badge="[ STEP 03 ]" title="Install with the shadcn CLI">
            <p>
              Flux Icons is officially indexed in shadcn&apos;s registry directory, allowing the CLI to resolve <code>@flux</code> natively with zero pre-configuration. You can generate and install individual icons directly into your component library.
            </p>

            {/* Interactive shadcn CLI generator */}
            <ShadcnCommandBuilder />

            <p className="mt-3">
              Standard CLI commands follow clean path prefixes for alternate weights and corner treatments:
            </p>
            <CopyableCodeBlock language="bash" filename="SHADCN CLI">
{`npx shadcn add @flux/bell               # default stroke outline
npx shadcn add @flux/fill/bell          # solid fill silhouette
npx shadcn add @flux/sharp/fill/bell    # sharp corner treatment
npx shadcn search @flux                 # browse entire collection in terminal`}
            </CopyableCodeBlock>

            <p>
              Any shadcn project already has a <code>components.json</code> file. Each icon arrives at{" "}
              <code>@/components/icons/&lt;name&gt;.tsx</code>, using your project&apos;s configured alias. On older CLIs, you can manually pin the registry in <code>components.json</code>:
            </p>
            <CopyableCodeBlock language="json" filename="COMPONENTS.JSON">
{`{
  "registries": {
    "@flux": "https://fluxicons.vercel.app/r/{name}.json"
  }
}`}
            </CopyableCodeBlock>
            <p>
              This route gives you <strong>source code ownership</strong> rather than a third-party dependency. Each icon arrives as a standalone component that imports nothing from external libraries, letting you freely adjust paths, modify colors, or adapt props.
            </p>
          </Section>

          {/* Copy Single Icon */}
          <Section id="copy" badge="[ STEP 04 ]" title="Copy a single icon (Clipboard)">
            <p>
              The fastest path for quick prototyping, requiring zero package installation. Click any icon on the{" "}
              <Link
                href="/icons"
                className="underline underline-offset-2 hover:text-foreground font-semibold"
              >
                icon browser
              </Link>{" "}
              to copy its clean SVG code directly to your clipboard, formatted at your preferred size and stroke width.
            </p>
            <CopyableCodeBlock language="svg" filename="CLIPBOARD SVG">
{`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
</svg>`}
            </CopyableCodeBlock>
            <p>
              Every drawing takes its colour from <code>currentColor</code>, so
              it inherits whatever <code>text-*</code> utility is in scope and needs no
              custom stroke or fill attribute.
            </p>
          </Section>

          {/* Frameworks */}
          <Section id="frameworks" badge="[ STEP 05 ]" title="Vue, Svelte, Angular and HTML">
            <p>
              The complete set is mirrored on{" "}
              <a
                href={ICONIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground font-semibold"
              >
                Iconify
                <ArrowUpRight className="size-3" />
                <span className="sr-only">{" (opens in a new tab)"}</span>
              </a>{" "}
              under the <code>{ICONIFY_PREFIX}</code> prefix, covering all {published.toLocaleString()}{" "}
              drawings across Vue, Svelte, and non-React stacks.
            </p>
            <CopyableCodeBlock language="tsx" filename="VUE & SVELTE">
{`import { Icon } from "@iconify/vue"    // Vue named export
import Icon from "@iconify/svelte"     // Svelte default export

<Icon icon="${ICONIFY_PREFIX}:bell" />
<Icon icon="${ICONIFY_PREFIX}:bell-fill" width="16" />
<Icon icon="${ICONIFY_PREFIX}:bell-sharp-two-tone" />`}
            </CopyableCodeBlock>
            <p>
              For plain HTML or projects without a build step, the official web component and Tailwind CSS mask plugin are available:
            </p>
            <CopyableCodeBlock language="bash" filename="WEB COMPONENT & TAILWIND">
{`# Web component
npm i iconify-icon
<iconify-icon icon="${ICONIFY_PREFIX}:bell"></iconify-icon>

# Tailwind CSS v4 Plugin
npm i -D @iconify/tailwind4
@plugin "@iconify/tailwind4";
<span class="icon-[${ICONIFY_PREFIX}--bell] size-4"></span>`}
            </CopyableCodeBlock>
          </Section>

          {/* Sizing inside shadcn components */}
          <Section id="sizing" badge="[ STEP 06 ]" title="Sizing inside shadcn components">
            <p>
              shadcn/ui primitives size their own icons automatically. Button applies the rule{" "}
              <code>{`[&_svg:not([class*='size-'])]:size-4`}</code>, which defaults any nested icon to 16px unless an explicit <code>size-*</code> class is applied.
            </p>
            <CopyableCodeBlock language="tsx" filename="BUTTON SIZING">
{`<Button>
  <Plus />                     {/* 16px: automatic default button sizing */}
  <Plus size={32} />           {/* 16px: width prop is overridden by variant CSS class */}
  <Plus className="size-6" />  {/* 24px: explicit size-* class takes precedence */}
</Button>`}
            </CopyableCodeBlock>

            <p className="mt-2">
              Interactive preview of icons nested inside shadcn button variants:
            </p>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border/80 bg-card p-4 text-foreground shadow-xs">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                New Action
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" />
                Export Data
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Settings className="size-3.5" />
                Preferences
              </Button>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Bin className="size-3.5" />
                Delete
              </Button>
            </div>
          </Section>

          {/* Stroke width */}
          <Section id="weight" badge="[ STEP 07 ]" title="Stroke width at small sizes">
            <p>
              The library is authored on a strict 24×24 grid with a 2px keyline. At 16px, this matches standard UI text density without clogging apertures or blurring on high-DPI displays.
            </p>
            <div className="flex flex-wrap items-end gap-6 rounded-xl border border-dashed border-border/80 bg-card p-4 text-foreground shadow-xs">
              {[1, 1.5, 2, 2.5].map((w) => (
                <div key={w} className="flex flex-col items-center gap-2">
                  <Bell size={32} strokeWidth={w} className="text-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">{w}px keyline</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Lucide Migration */}
          <Section id="lucide" badge="[ STEP 08 ]" title="Coming from Lucide">
            <p>
              Because both icon suites share an identical 24×24 boundary box, 2px stroke weight, and <code>currentColor</code> fill/stroke logic, switching is a one-line import replacement:
            </p>
            <LucideComparisonCard />
            <p className="mt-2">
              Names follow consistent semantic standards. Where compound names differ, the family base word leads: <code>mail-check</code> rather than <code>check-mail</code>.
            </p>
          </Section>

          {/* Styles & Corner Treatments */}
          <Section id="styles" badge="[ STEP 09 ]" title="Four styles, two corner treatments">
            <p>
              Every icon is crafted in four distinct weights and two corner treatments (Regular rounded and Sharp square caps).
            </p>
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-dashed border-border/80 bg-card p-4 text-foreground shadow-xs">
              {[
                { icon: User, label: "user" },
                { icon: Check, label: "check" },
                { icon: ChevronDown, label: "chevron-down" },
                { icon: Bell, label: "bell" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={28} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2">
              Each style is exported from its own entry point in the package, guaranteeing dead-code elimination:
            </p>
            <CopyableCodeBlock language="typescript" filename="ENTRY POINTS">
              {importSample}
            </CopyableCodeBlock>
            <p>
              Inspect the drawings directly in SVG format on the{" "}
              <a
                href={SET_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground font-semibold"
              >
                GitHub repository
                <ArrowUpRight className="size-3" />
                <span className="sr-only">{" (opens in a new tab)"}</span>
              </a>
              .
            </p>
          </Section>

          {/* FAQ */}
          <Section id="faq" badge="[ FAQ ]" title="Frequently asked questions">
            <p>
              Concise answers to common integration questions across React and shadcn stacks:
            </p>
            <Faq items={faq} className="gap-y-10 md:grid-cols-1" />
          </Section>
        </div>
      </main>

      {/* Floating ScrollProgress bottom bar with squircle section menu */}
      <ScrollProgress sections={SECTIONS} />

      <SiteFooter />
    </>
  )
}
