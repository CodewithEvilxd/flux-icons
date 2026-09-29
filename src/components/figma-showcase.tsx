import { DesignFileTabs } from "@/components/design-file-tabs"
import { Glyph } from "@/components/glyph"
import type { Icon } from "@/lib/icons"
import {
  DESIGN_NOTE_ICON_NAMES,
  PAPER_NOTE_ICON_NAMES,
  PLUGIN_NOTE_ICON_NAMES,
} from "@/lib/home"
import { PAPER_FILES } from "@/lib/paper-files"
import { SET_FIGMA_PLUGIN_URL, SET_FIGMA_URL } from "@/lib/site-chrome"

/**
 * Where the set comes from, which is now two design files rather than one.
 * Figma is where the icons are drawn; Paper is generated from icons/.
 */
const MOCKUP = {
  title: "Figma Community Component Sets",
  subtitle: "Full Vector System · Interactive Component Properties · Single Source of Truth",
  badge: "Figma Library",
  tab: "figma" as const,
  alt: "The Flux Icons file open in Figma",
}

const PLUGIN_MOCKUP = {
  title: "Flux Icons Figma Community Plugin",
  subtitle: "Instant Search · Vector Canvas Drag & Drop · 4 Styles & 2 Corner Treatments",
  badge: "Figma Plugin",
  tab: "plugin" as const,
  alt: "The Flux Icons plugin open in Figma",
}

const PAPER_MOCKUP = {
  title: "Paper.design Vector Catalog",
  subtitle: "Category Artboards · Live Verification · Downstream Production Proof",
  badge: "Paper Boards",
  tab: "paper" as const,
  alt: "The Flux Icons file open in Paper",
}

/**
 * A sleek vector editor frame mockup.
 */
function Mockup({
  mockup,
}: {
  mockup: { title: string; subtitle: string; badge: string; tab: "figma" | "plugin" | "paper"; alt: string }
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-neutral-950 p-6 text-neutral-100 shadow-2xl lg:p-8">
      {/* Editor top bar with macOS dots & tab name */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-rose-500/80" />
          <div className="size-3 rounded-full bg-amber-500/80" />
          <div className="size-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 font-mono text-xs text-neutral-400">
            {mockup.tab === "figma"
              ? "Flux Icons — Figma Community File.fig"
              : mockup.tab === "plugin"
              ? "Flux Icons Plugin v1.0.1 — Active"
              : "Flux Icons — Paper Vector Proof.paper"}
          </span>
        </div>
        <span className="rounded-full bg-neutral-800 px-3 py-1 font-mono text-[11px] font-medium text-neutral-300">
          {mockup.badge}
        </span>
      </div>

      {/* Editor body preview */}
      <div className="relative mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/60 p-8 text-center backdrop-blur-xs lg:min-h-80">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800 shadow-inner">
          <svg className="size-7 text-neutral-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
            <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>
            <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>
            <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
          </svg>
        </div>
        <h4 className="mt-4 text-base font-semibold text-neutral-100 lg:text-lg">
          {mockup.title}
        </h4>
        <p className="mt-1 max-w-md text-xs text-neutral-400 lg:text-sm">
          {mockup.subtitle}
        </p>

        {/* Decorative canvas grid indicators */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["Container=regular", "Style=stroke", "Corners=rounded", "24×24 Grid", "2px Keyline"].map((tag) => (
            <span key={tag} className="rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 font-mono text-[10px] text-neutral-400">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * One of the four notes under a picture.
 *
 * A glyph, then a title, then one line. The left rule each of these carried is
 * gone: four vertical rules under a full-width screenshot drew four columns on a
 * block that already reads as four columns, and the rule was the only border in
 * the section on a page whose surfaces are fills.
 *
 * The glyph is the hero fact card's device without the card: the same 2px
 * keyline from the same set, one step down at 24px because the type under it is
 * `sm` rather than `lg`. It is also what replaces the rule as the thing that
 * starts each column: a drawing carries the alignment a hairline was doing, and
 * says something while it is there.
 */
function Note({
  icon,
  title,
  children,
}: {
  icon?: Icon
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-5 transition-all hover:border-primary/50 hover:shadow-xs">
      {icon?.art.stroke && (
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Glyph art={icon.art.stroke} size={20} stroke={2} />
        </div>
      )}
      <h3 className="mt-3 text-sm font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

/**
 * The row of four notes under a picture.
 *
 * Four across at `lg`, two at `sm`, one on a phone. Not four across at `sm`:
 * these are sentences, and a quarter of a 640px screen is a column eleven
 * characters wide.
 *
 * `mt-5 lg:mt-6` on top of the block's own gap, so the two gaps in this section
 * are deliberately unequal: the picker sits tight against the picture it labels,
 * and the notes stand off it, because they are commentary on the picture rather
 * than part of it. One even gap down the whole block made the four glyphs read
 * as a row inside the mat above them.
 */
function Notes({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 grid gap-8 sm:grid-cols-2 lg:mt-6 lg:grid-cols-4">
      {children}
    </div>
  )
}

/**
 * A path, a property or a command inside a sentence.
 *
 * `components/keyline-showcase.tsx` sets prose code the same way. In full-
 * strength ink against the muted paragraph around it, because the point of it is
 * that these are literal names: `raw/` is a directory, `Container` is a property,
 * and a reader should be able to tell which words they could type.
 */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.9em] text-foreground">{children}</code>
  )
}

/**
 * The section's body: a header row, then whichever file's panel is chosen.
 *
 * The row across the top is the two things a reader does with this section —
 * choose the tool, or go and open the file — put at opposite ends of the page
 * column. The button was centred under the notes at the foot of the block, which
 * is where a section ends rather than where a toolbar goes, and it left the
 * picker floating alone above a full-width picture.
 *
 * Each picture runs the full width of the column because it is the evidence and
 * everything else here is annotation. It was a panel in the right-hand half of a
 * two-column block first, with the notes stacked down the left; at half width a
 * screenshot of an editor is a picture of an editor with nothing legible in it.
 *
 * `gap-3 lg:gap-4` down the block, a quarter of what it started at. The picture
 * is a big flat rectangle and the two rows around it are small, so air between
 * them read as three separate blocks that happened to land in one section rather
 * than as one block with a picture in it. The section's own `py-16 lg:py-24` is
 * what holds it off the page; nothing inside needs to repeat that job at half
 * strength.
 */
export function FigmaShowcase({ icons }: { icons: Icon[] }) {
  /* One drawing per note, in the order the notes appear, resolved here so every
     name this component renders comes from the two lists `check-demos` reads. */
  const glyph = (name: string) => icons.find((icon) => icon.name === name)
  const [setGlyph, exportGlyph, searchGlyph, checkGlyph] =
    DESIGN_NOTE_ICON_NAMES.map(glyph)
  const [boardGlyph, layerGlyph, builtGlyph, sheetGlyph] =
    PAPER_NOTE_ICON_NAMES.map(glyph)
  const [findGlyph, dropGlyph, editorGlyph, freshGlyph] =
    PLUGIN_NOTE_ICON_NAMES.map(glyph)

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <DesignFileTabs
        urls={{
          figma: SET_FIGMA_URL,
          /* Two entries, so the button becomes a menu: the set outgrew one
             Paper file and each is named by the shelves it holds. */
          paper: PAPER_FILES.map((file) => ({
            url: file.url,
            label: file.label,
          })),
          plugin: SET_FIGMA_PLUGIN_URL,
        }}
        /*
          Only Paper needs one. It renders a file in Chrome and in its own
          desktop app, and answers Safari with a download card saying view and
          comment is coming "in the future", so a visitor on the Mac default
          browser gets no file at all from a button that promises one. Delete
          this the day Safari renders the file: it is a statement about Paper on
          a date, not about the set.
        */
        caveats={{
          paper: "Opens in Chrome or the Paper desktop app, not Safari.",
          plugin: "Opens the Figma Community listing, in Figma or the browser.",
        }}
        panels={{
          figma: (
            <>
              <Mockup mockup={MOCKUP} />
              <Notes>
                <Note icon={setGlyph} title="One component set per icon">
                  Three variant properties on it, <Code>Container</Code>,{" "}
                  <Code>Style</Code> and <Code>Corners</Code>, and nothing else.
                  The names in Figma are the names on disk.
                </Note>

                <Note icon={exportGlyph} title="Exports land untouched">
                  <Code>raw/</Code> holds what came out of Figma, one file per
                  variant, under the name Figma gives it:{" "}
                  <Code>
                    Container=circle, Style=duotone, Corners=sharp.svg
                  </Code>
                  .
                </Note>

                <Note
                  icon={searchGlyph}
                  title="Search words come from the file"
                >
                  Each set&rsquo;s own description in Figma is the alias list
                  the browser searches, baked out by the keyword step rather
                  than kept in a second table.
                </Note>

                <Note icon={checkGlyph} title="Checked against the repository">
                  <Code>icons:figma</Code> hashes every segment of every variant
                  in the file and diffs it against <Code>raw/</Code>. Twelve
                  blank phones were found that way.
                </Note>
              </Notes>
            </>
          ),
          paper: (
            <>
              <Mockup mockup={PAPER_MOCKUP} />
              <Notes>
                <Note icon={boardGlyph} title="One artboard per category">
                  The canvas is the catalogue: a board per section, split across
                  a few when a section carries more drawings than one board
                  should, and across two files because one file is more than
                  Paper will hold.
                </Note>

                <Note icon={layerGlyph} title="Layers carry the icon's name">
                  Every drawing is named in the layer tree the way it is named
                  on disk, down to the variant:{" "}
                  <Code>circle-check duotone</Code>.
                </Note>

                <Note icon={builtGlyph} title="Generated, not redrawn">
                  <Code>paper:build</Code> composes the whole set out of{" "}
                  <Code>icons/</Code>, so the Paper file is downstream of the
                  same drawings the packages ship.
                </Note>

                <Note icon={sheetGlyph} title="The sheets are checked in CI">
                  <Code>paper:check</Code> re-composes them and fails on any
                  difference, so what the file was built from cannot go stale
                  without the build saying so.
                </Note>
              </Notes>
            </>
          ),
          plugin: (
            <>
              <Mockup mockup={PLUGIN_MOCKUP} />
              <Notes>
                <Note icon={findGlyph} title="The same search, one more place">
                  A query is ranked the way the CLI and the MCP server rank it:
                  exact name, then prefix, then word, then a word someone
                  curated in Figma. Four surfaces, one vocabulary.
                </Note>

                <Note icon={dropGlyph} title="One click puts it on the canvas">
                  Centred in the frame you have selected, or in the middle of
                  the viewport when nothing is. <Code>currentColor</Code> is
                  swapped for real ink on the way in, because Figma&rsquo;s
                  importer cannot resolve it.
                </Note>

                <Note icon={editorGlyph} title="Figma and FigJam both">
                  The same plugin in both editors. An insert becomes a group in
                  FigJam rather than a frame, which is what makes recolouring it
                  there land on the drawing instead of on a wrapper.
                </Note>

                <Note icon={freshGlyph} title="It reads the published set">
                  The icons come over the network from this repository, not from
                  the plugin&rsquo;s own bundle, so a release reaches everyone
                  without a plugin update going through review.
                </Note>
              </Notes>
            </>
          ),
        }}
      />
    </div>
  )
}
