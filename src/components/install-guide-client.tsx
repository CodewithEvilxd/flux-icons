"use client"

import * as React from "react"
import { Check, Copy, Terminal, ChevronDown, Check as CheckIcon } from "@/components/icons"
import { ScrollProgress, type ScrollProgressSection } from "@/components/ui/scroll-progress"
import { cn } from "@/lib/utils"

export { ScrollProgress, type ScrollProgressSection }

/**
 * Copyable code snippet with copy feedback, language badge, and paper styling.
 */
export function CopyableCodeBlock({
  children,
  language = "bash",
  filename,
  className,
}: {
  children: string
  language?: string
  filename?: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-xl border border-dashed border-border/80 bg-card shadow-xs transition-colors hover:border-border", className)}>
      <div className="flex items-center justify-between border-b border-dashed border-border/60 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          {filename ?? language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground">
        <code>{children}</code>
      </pre>
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

  // Construct CLI command path:
  // stroke regular: @flux/name
  // other style regular: @flux/<style>/name
  // stroke sharp: @flux/sharp/name
  // other style sharp: @flux/sharp/<style>/name
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
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-amber-500/40 bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-amber-500/10"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3 text-emerald-500" />
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

/**
 * Lucide vs Flux Icons comparison card with copyable snippets.
 */
export function LucideComparisonCard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-dashed border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-dashed border-border/60">
          <span className="size-2 rounded-full bg-red-500/80" />
          <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
            Before: lucide-react
          </span>
        </div>
        <pre className="font-mono text-[12.5px] leading-relaxed text-muted-foreground">
          <code>{`import { Check, Settings, Bell } from "lucide-react"

<Check className="size-4" />
<Settings size={16} />
<Bell strokeWidth={1.5} />`}</code>
        </pre>
      </div>

      <div className="rounded-xl border border-dashed border-emerald-500/40 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-dashed border-emerald-500/30">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
            After: @flux-icons/react (Zero Markup Changes)
          </span>
        </div>
        <pre className="font-mono text-[12.5px] leading-relaxed text-foreground">
          <code>{`import { Check, Settings, Bell } from "@flux-icons/react"

<Check className="size-4" />
<Settings size={16} />
<Bell strokeWidth={1.5} />`}</code>
        </pre>
      </div>
    </div>
  )
}
