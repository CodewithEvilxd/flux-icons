"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Copy, Terminal, ChevronDown, Check, Sparkles } from "@/components/icons"
import { CodeBlock } from "@/components/agents/code-block"
import { ScrollProgress, type ScrollProgressSection } from "@/components/ui/scroll-progress"
import { SPRING_SWAP } from "@/lib/ease"
import { cn } from "@/lib/utils"

export { ScrollProgress, type ScrollProgressSection, CodeBlock }

const PM_COMMANDS = {
  pnpm: {
    pkg: "pnpm add @flux-icons/react",
    shadcn: "pnpm dlx shadcn@latest add",
    manualDeps: "pnpm add @flux-icons/react motion clsx tailwind-merge",
  },
  npm: {
    pkg: "npm i @flux-icons/react",
    shadcn: "npx shadcn@latest add",
    manualDeps: "npm i @flux-icons/react motion clsx tailwind-merge",
  },
  bun: {
    pkg: "bun add @flux-icons/react",
    shadcn: "bunx --bun shadcn@latest add",
    manualDeps: "bun add @flux-icons/react motion clsx tailwind-merge",
  },
  yarn: {
    pkg: "yarn add @flux-icons/react",
    shadcn: "npx shadcn@latest add",
    manualDeps: "yarn add @flux-icons/react motion clsx tailwind-merge",
  },
} as const

type PackageManager = keyof typeof PM_COMMANDS

const LIB_EASE_CODE = `// Shared motion tokens. Easing curves mirror the CSS custom properties in
// globals.css; springs are the canonical physics used across components.
// Strong custom variants — defaults like \`ease-in\`/\`ease-out\` feel weak.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** CSS string form of EASE_OUT for inline style transitions. */
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

/** Content swaps — label/icon slots trading places inside a control. */
export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

/** Overlay panel entrances — modals and sheets summoned by pointer. */
export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

/** Shared-layout glides — pills, indicators and panels morphing between positions. */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

/** Cursor-follow physics for decorative mouse tracking (magnetic, tilt, dock). */
export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
} as const;

/** Dragged handles and fills (sliders) — critically damped \`useSpring\` config,
 * so the value follows the pointer butterily and never rebounds off an end. */
export const SPRING_GLIDE = {
  stiffness: 700,
  damping: 50,
  mass: 0.5,
} as const;`

const LIB_UTILS_CODE = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`

const FLUX_ICON_WRAPPER_CODE = `import * as React from "react"
import { cn } from "@/lib/utils"

export type IconStyle = "stroke" | "two-tone" | "duotone" | "fill"
export type IconCorner = "regular" | "sharp"

export interface FluxIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  strokeWidth?: number | string
  corner?: IconCorner
  className?: string
}

export function FluxIcon({
  size = 24,
  strokeWidth = 2,
  className,
  children,
  ...props
}: FluxIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}`

const SCROLL_PROGRESS_SOURCE_CODE = `"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

export type ScrollProgressSection = { id: string; label: string }

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
const EASE_OUT = [0.22, 1, 0.36, 1] as const
const SIZE_SPRING = { type: "spring", bounce: 0.16, duration: 0.5 } as const
const LABEL_CROSSFADE = { duration: 0.22, ease: EASE_OUT } as const
const LAYER_FADE = { duration: 0.24, ease: EASE_IN_OUT } as const

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export type ScrollProgressProps = React.ComponentProps<"div"> & {
  sections?: ScrollProgressSection[]
  containerRef?: React.RefObject<HTMLElement | null>
  offset?: number
}

export function ScrollProgress({
  className,
  sections = [],
  containerRef,
  offset = 120,
  ...props
}: ScrollProgressProps) {
  const layoutId = React.useId()
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll(
    containerRef ? { container: containerRef } : undefined
  )
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  })

  const [activeId, setActiveId] = React.useState(sections[0]?.id)
  const [open, setOpen] = React.useState(false)

  // Section observer & squircle spring expansion logic...
  return (
    <div data-slot="scroll-progress" className={cn("fixed bottom-6 left-1/2 z-50 -translate-x-1/2", className)} {...props}>
      {/* Floating squircle pill with progress indicator */}
    </div>
  )
}`

/**
 * Universal CodeBlock wrapper with syntax tokens, line numbers, status badge, and expandable toggle.
 */
export function CopyableCodeBlock({
  children,
  language = "bash",
  filename,
  className,
  maxHeight = 260,
  defaultExpanded = false,
  expandable,
}: {
  children: string
  language?: "bash" | "diff" | "json" | "text" | "tsx" | "typescript"
  filename?: React.ReactNode
  className?: string
  maxHeight?: number | string
  defaultExpanded?: boolean
  expandable?: boolean
}) {
  return (
    <CodeBlock
      code={children.trim()}
      language={language}
      filename={filename}
      maxHeight={maxHeight}
      defaultExpanded={defaultExpanded}
      expandable={expandable}
      className={className}
    />
  )
}

/**
 * Interactive Installation Header & Mode Switcher: CLI vs Manual.
 * Matches the beui.dev pattern with smooth springs and rich detail.
 */
export function InstallTabs() {
  const [mode, setMode] = React.useState<"cli" | "manual">("cli")
  const [pm, setPm] = React.useState<PackageManager>("pnpm")

  return (
    <div className="w-full space-y-6">
      {/* Top Header with title and segmented mode toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Install
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add it with the shadcn CLI, or copy the source manually.
          </p>
        </div>

        {/* CLI / Manual Segmented Toggle */}
        <div className="inline-flex h-9 items-center rounded-xl bg-muted/70 p-1 border border-border/60">
          <button
            type="button"
            onClick={() => setMode("cli")}
            className={cn(
              "relative px-4 py-1 text-xs font-semibold transition-colors cursor-pointer select-none",
              mode === "cli" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === "cli" && (
              <motion.div
                layoutId="install-mode-pill"
                className="absolute inset-0 rounded-lg bg-background shadow-xs"
                transition={SPRING_SWAP}
              />
            )}
            <span className="relative z-10">CLI</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "relative px-4 py-1 text-xs font-semibold transition-colors cursor-pointer select-none",
              mode === "manual" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === "manual" && (
              <motion.div
                layoutId="install-mode-pill"
                className="absolute inset-0 rounded-lg bg-background shadow-xs"
                transition={SPRING_SWAP}
              />
            )}
            <span className="relative z-10">Manual</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === "cli" ? (
          <motion.div
            key="cli"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING_SWAP}
            className="space-y-6"
          >
            {/* Package Manager Selector for CLI */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Package Manager:
              </span>
              <div className="inline-flex rounded-lg bg-muted/60 p-0.5 border border-border/50">
                {(["pnpm", "npm", "bun", "yarn"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPm(item)}
                    className={cn(
                      "px-2.5 py-1 font-mono text-xs font-medium rounded-md transition-colors cursor-pointer",
                      pm === item
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Install React Icon Package
              </p>
              <CodeBlock
                code={PM_COMMANDS[pm].pkg}
                language="bash"
                filename={`TERMINAL (${pm})`}
                maxHeight={90}
                expandable={false}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Add Individual Icons Via shadcn Registry
              </p>
              <CodeBlock
                code={`${PM_COMMANDS[pm].shadcn} https://www.fluxicons.site/r/bell.json`}
                language="bash"
                filename={`SHADCN REGISTRY (${pm})`}
                maxHeight={90}
                expandable={false}
              />
            </div>

            {/* Interactive icon builder */}
            <ShadcnCommandBuilder />
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING_SWAP}
            className="space-y-8"
          >
            {/* Theme notice card */}
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-xs text-foreground/80">
              <Sparkles className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-foreground">
                  Needs the theme tokens once.
                </span>{" "}
                Already ran shadcn init? You are set. See{" "}
                <a
                  href="#styles"
                  className="font-semibold text-foreground underline underline-offset-2 hover:text-amber-500"
                >
                  Theme setup
                </a>{" "}
                for custom CSS variables and color palettes.
              </div>
            </div>

            {/* Step 1: Install dependencies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  1. Install dependencies
                </h3>
                <div className="inline-flex rounded-lg bg-muted/60 p-0.5 border border-border/50">
                  {(["pnpm", "npm", "bun", "yarn"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPm(item)}
                      className={cn(
                        "px-2.5 py-0.5 font-mono text-[11px] font-medium rounded-md transition-colors cursor-pointer",
                        pm === item
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <CodeBlock
                code={PM_COMMANDS[pm].manualDeps}
                language="bash"
                filename={`INSTALL DEPENDENCIES (${pm})`}
                maxHeight={90}
                expandable={false}
              />
            </div>

            {/* Step 2: Add util files */}
            <div className="space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                2. Add util files
              </h3>
              <div className="space-y-4">
                <CodeBlock
                  code={LIB_EASE_CODE}
                  language="typescript"
                  filename="lib/ease.ts"
                  maxHeight={200}
                  expandable={true}
                  defaultExpanded={false}
                />
                <CodeBlock
                  code={LIB_UTILS_CODE}
                  language="typescript"
                  filename="lib/utils.ts"
                  maxHeight={160}
                  expandable={false}
                />
              </div>
            </div>

            {/* Step 3: Copy the source code */}
            <div className="space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                3. Copy the source code
              </h3>
              <div className="space-y-4">
                <CodeBlock
                  code={FLUX_ICON_WRAPPER_CODE}
                  language="tsx"
                  filename="components/ui/flux-icon.tsx"
                  maxHeight={220}
                  expandable={true}
                  defaultExpanded={false}
                />
                <CodeBlock
                  code={SCROLL_PROGRESS_SOURCE_CODE}
                  language="tsx"
                  filename="components/ui/scroll-progress.tsx"
                  maxHeight={220}
                  expandable={true}
                  defaultExpanded={false}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Interactive shadcn CLI command generator for any icon, style, and corner treatment.
 */
export function ShadcnCommandBuilder({
  sampleIcons = ["bell", "check", "user", "settings", "search", "heart"],
}: {
  sampleIcons?: string[]
}) {
  const [selectedIcon, setSelectedIcon] = React.useState("bell")
  const [selectedStyle, setSelectedStyle] = React.useState<"stroke" | "two-tone" | "duotone" | "fill">("stroke")
  const [selectedCorners, setSelectedCorners] = React.useState<"regular" | "sharp">("regular")
  const [copied, setCopied] = React.useState(false)

  const iconPath = React.useMemo(() => {
    const parts: string[] = ["@flux"]
    if (selectedCorners === "sharp") parts.push("sharp")
    if (selectedStyle !== "stroke") parts.push(selectedStyle)
    parts.push(selectedIcon)
    return parts.join("/")
  }, [selectedCorners, selectedStyle, selectedIcon])

  const command = `npx shadcn add ${iconPath}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border/90 bg-card p-4 sm:p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-dashed border-border/70">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-amber-500" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            shadcn CLI Command Generator
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Pick a drawing & treatment</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Icon selector */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Icon Name
          </label>
          <div className="relative">
            <select
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              className="w-full appearance-none rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
            >
              {sampleIcons.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Style selector */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Style Weight
          </label>
          <div className="relative">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as typeof selectedStyle)}
              className="w-full appearance-none rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="stroke">stroke (outline default)</option>
              <option value="two-tone">two-tone (40% wash plate)</option>
              <option value="duotone">duotone (tinted region)</option>
              <option value="fill">fill (solid silhouette)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Corner selector */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Corner Geometry
          </label>
          <div className="relative">
            <select
              value={selectedCorners}
              onChange={(e) => setSelectedCorners(e.target.value as typeof selectedCorners)}
              className="w-full appearance-none rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="regular">regular (rounded caps)</option>
              <option value="sharp">sharp (technical square caps)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Generated Command Output */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3.5 py-2.5 font-mono text-xs sm:text-[13px]">
        <code className="text-foreground">
          <span className="text-muted-foreground select-none">$ </span>
          {command}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-amber-500/40 bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-amber-500/10 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3 text-muted-foreground" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

const BEFORE_LUCIDE = `import { Check, Settings, Bell } from "lucide-react"

<Check className="size-4" />
<Settings size={16} />
<Bell strokeWidth={1.5} />`

const AFTER_FLUX = `import { Check, Settings, Bell } from "@flux-icons/react"

<Check className="size-4" />
<Settings size={16} />
<Bell strokeWidth={1.5} />`

/**
 * Lucide vs Flux Icons comparison card with copyable snippets.
 */
export function LucideComparisonCard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-500/80" />
          <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
            Before: lucide-react
          </span>
        </div>
        <CodeBlock
          code={BEFORE_LUCIDE}
          language="tsx"
          filename="lucide-react"
          maxHeight={140}
          expandable={false}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
            After: @flux-icons/react (Zero Markup Changes)
          </span>
        </div>
        <CodeBlock
          code={AFTER_FLUX}
          language="tsx"
          filename="@flux-icons/react"
          maxHeight={140}
          expandable={false}
        />
      </div>
    </div>
  )
}

/**
 * API Reference Table showing properties, types, defaults, and descriptions.
 */
export function ApiReferenceTable({
  items,
}: {
  items: Array<{
    prop: string
    type: string
    default?: string
    description: string
  }>
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-dashed border-border/80 bg-card text-xs shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-dashed border-border/80 bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 pl-4 pr-3">Property</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Default</th>
              <th className="py-2.5 pl-3 pr-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-border/60 font-mono">
            {items.map((row) => (
              <tr key={row.prop} className="hover:bg-muted/20 transition-colors">
                <td className="py-2.5 pl-4 pr-3 font-semibold text-foreground">
                  <code>{row.prop}</code>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground/80">
                    {row.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {row.default ?? "—"}
                </td>
                <td className="py-2.5 pl-3 pr-4 font-sans text-xs text-foreground/85">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Component Composition Tree Diagram.
 */
export function CompositionTree({
  title,
  description,
  tree,
}: {
  title?: string
  description?: string
  tree: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
      {title && (
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          {title}
        </h4>
      )}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3.5 font-mono text-xs leading-relaxed text-foreground/90 border border-border/40">
        <code>{tree}</code>
      </pre>
    </div>
  )
}
