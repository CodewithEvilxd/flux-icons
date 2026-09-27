"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Check,
  Compass,
  Copy,
  Layers,
  Sparkles,
} from "@/components/icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PackageManager = "pnpm" | "npm" | "bun" | "yarn"

export interface SiteHeroProps {
  /** How many icons the directory holds. Read off disk or passed as count. */
  total: number
  /** Which collection this hero represents. */
  variant?: "keyline" | "extended" | "motion"
}

const PM_COMMANDS_BY_VARIANT: Record<"keyline" | "extended" | "motion", Record<PackageManager, string>> = {
  keyline: {
    pnpm: "pnpm add @flux-icons/react",
    npm: "npm i @flux-icons/react",
    bun: "bun add @flux-icons/react",
    yarn: "yarn add @flux-icons/react",
  },
  extended: {
    pnpm: "pnpm add @flux-icons/react",
    npm: "npm i @flux-icons/react",
    bun: "bun add @flux-icons/react",
    yarn: "yarn add @flux-icons/react",
  },
  motion: {
    pnpm: "pnpm add motion",
    npm: "npm i motion",
    bun: "bun add motion",
    yarn: "yarn add motion",
  },
}

/**
 * The Studio Cockpit Hero: asymmetric layout with identity, keyline specs,
 * interactive optical CAD chamber and multi-package install console.
 */
export function SiteHero({
  total,
  variant = "keyline",
}: SiteHeroProps) {
  const [copied, setCopied] = React.useState(false)
  const [pm, setPm] = React.useState<PackageManager>("pnpm")

  const copyInstall = async () => {
    const cmd = PM_COMMANDS_BY_VARIANT[variant][pm]
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(true)
      toast.success(`Copied: ${cmd}`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy command")
    }
  }

  const isExtended = variant === "extended"
  const isMotion = variant === "motion"

  const glowColor = isMotion
    ? "bg-purple-500/15"
    : isExtended
      ? "bg-blue-500/15"
      : "bg-amber-500/10"

  const accentColor = isMotion
    ? "text-purple-500"
    : isExtended
      ? "text-blue-500"
      : "text-amber-500"

  const tagClass = isMotion
    ? "ann-tag-purple"
    : isExtended
      ? "ann-tag-blue"
      : "ann-tag-amber"

  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border-1.5 border-dashed border-border/80 bg-card/50 p-6 md:p-8 backdrop-blur-xl shadow-lg shadow-black/5">
      {/* Ambient background glows for optical depth */}
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute -top-24 -left-24 size-80 rounded-full blur-3xl", glowColor)}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        {/* Left Side: System Identity, Display Title & Geometric Specs */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(tagClass, "inline-flex items-center gap-1.5 text-xs font-bold font-mono py-0.5 px-2")}>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isMotion
                ? "FLUX STUDIO // MOTION VAULT"
                : isExtended
                  ? "FLUX STUDIO // EXTENDED SYSTEM"
                  : "FLUX STUDIO // GLYPH REGISTRY"}
            </span>
            <span className="ann-tag-green text-xs font-bold font-mono py-0.5 px-2">
              {isMotion
                ? "467 FRAMER MOTION"
                : isExtended
                  ? "2,242 MULTI-STYLE VAULT"
                  : "24×24 KEYLINE VAULT"}
            </span>
            <span className="ann-tag-purple text-xs font-bold font-mono py-0.5 px-2">
              100% FREE MIT
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase tracking-wider text-foreground leading-[1.1]">
              {isMotion ? (
                <>
                  MOTION ICON{" "}
                  <span className="ann-underline-amber text-purple-600 dark:text-purple-400">
                    REGISTRY
                  </span>
                </>
              ) : isExtended ? (
                <>
                  EXTENDED ICON{" "}
                  <span className="ann-underline-amber text-blue-600 dark:text-blue-400">
                    REGISTRY
                  </span>
                </>
              ) : (
                <>
                  SYSTEM ICON{" "}
                  <span className="ann-underline-amber text-primary">REGISTRY</span>
                </>
              )}
            </h1>
          </div>

          <p className="text-sm sm:text-base font-handwritten leading-relaxed text-muted-foreground max-w-xl">
            {isMotion ? (
              <>
                {total.toLocaleString("en-US")}{" "}
                micro-interactive animated icons engineered for React &amp; Framer Motion.
                Crafted with authentic sub-path micro-interactions, hardware-accelerated spring physics, hover triggers, and continuous loop modes.
              </>
            ) : isExtended ? (
              <>
                {total.toLocaleString("en-US")}{" "}
                multi-style vector glyphs engineered for React &amp; shadcn/ui.
                Drawn on a unified 24×24 grid across 6 cohesive styles and 2 corner geometries with zero external runtime dependencies.
              </>
            ) : (
              <>
                {total.toLocaleString("en-US")}{" "}
                vector glyphs engineered for React &amp; shadcn/ui.
                Crafted on an optical 24×24 keyline grid across 4 styles and 2 corner geometries with zero external runtime dependencies.
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-muted-foreground">
            {isMotion ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-2.5 py-1 bg-muted/40">
                  <Layers className="size-3.5 text-purple-500" />
                  467 COMPONENTS: REACT &amp; FRAMER MOTION
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-2.5 py-1 bg-muted/40">
                  <Compass className="size-3.5 text-cyan-500" />
                  INTERACTIVE: HOVER &amp; CONTINUOUS LOOP
                </span>
              </>
            ) : isExtended ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-2.5 py-1 bg-muted/40">
                  <Layers className="size-3.5 text-blue-500" />
                  6 STYLES: LINEAR · BOLD · TWO-TONE · BULK · BROKEN · OUTLINE
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-2.5 py-1 bg-muted/40">
                  <Compass className="size-3.5 text-cyan-500" />
                  2 RADII: REGULAR &amp; SHARP
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-2.5 py-1 bg-muted/40">
                  <Layers className="size-3.5 text-amber-500" />
                  4 STYLES: STROKE · TWO-TONE · DUOTONE · FILL
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-2.5 py-1 bg-muted/40">
                  <Compass className="size-3.5 text-cyan-500" />
                  2 RADII: ROUNDED &amp; SHARP
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Interactive CAD Specimen Box & Multi-Manager Terminal */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Live Studio Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/80 p-3 text-center transition-transform hover:-translate-y-0.5 shadow-xs">
              <span className={cn("font-mono text-xl font-black tracking-tight", accentColor)}>
                {total.toLocaleString("en-US")}
              </span>
              <span className="font-handwritten text-xs text-muted-foreground font-bold">
                Icons
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/80 p-3 text-center transition-transform hover:-translate-y-0.5 shadow-xs">
              <span className="font-mono text-xl font-black text-emerald-500 tracking-tight">
                {isMotion ? "11" : isExtended ? "6" : "4"}
              </span>
              <span className="font-handwritten text-xs text-muted-foreground font-bold">
                {isMotion ? "Categories" : "Styles"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/80 p-3 text-center transition-transform hover:-translate-y-0.5 shadow-xs">
              <span className="font-mono text-xl font-black text-cyan-500 tracking-tight">
                {isMotion ? "Physics" : "2"}
              </span>
              <span className="font-handwritten text-xs text-muted-foreground font-bold">
                {isMotion ? "Spring" : "Radii"}
              </span>
            </div>
          </div>

          {/* Interactive Multi-Package Install Terminal */}
          <div className={cn(
            "rounded-xl border border-dashed bg-background/90 p-3 shadow-xs flex flex-col gap-2",
            isMotion ? "border-purple-500/50" : isExtended ? "border-blue-500/50" : "border-amber-500/50"
          )}>
            {/* Terminal Tab Bar */}
            <div className="flex items-center justify-between border-b border-dashed border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500/80" />
                <span className="size-2 rounded-full bg-amber-500/80" />
                <span className="size-2 rounded-full bg-emerald-500/80" />
                <span className="ml-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  terminal
                </span>
              </div>

              {/* Package Manager Selector */}
              <div className="flex items-center gap-1 rounded-md bg-muted/60 p-0.5">
                {(["pnpm", "npm", "bun", "yarn"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPm(m)}
                    className={cn(
                      "px-2 py-0.5 font-mono text-[10px] font-bold rounded transition-colors cursor-pointer",
                      pm === m
                        ? isMotion
                          ? "bg-purple-600 text-white shadow-xs"
                          : isExtended
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-amber-500 text-white dark:text-black shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Command Output */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2 overflow-hidden font-mono text-xs">
                <span className={cn("font-bold select-none", accentColor)}>$</span>
                <span className="truncate text-foreground font-medium select-all">
                  {PM_COMMANDS_BY_VARIANT[variant][pm]}
                </span>
              </div>
              <button
                type="button"
                onClick={copyInstall}
                className={cn(
                  "ml-2 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-xs",
                  copied
                    ? "bg-emerald-500 text-white"
                    : isMotion
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25 ring-1 ring-purple-500/30"
                      : isExtended
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 ring-1 ring-blue-500/30"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 ring-1 ring-amber-500/30"
                )}
                title="Copy install command"
              >
                {copied ? (
                  <>
                    <Check className="size-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-xs">
            <span className="inline-flex items-center gap-1 font-handwritten text-muted-foreground">
              <Sparkles className={cn("size-3.5", accentColor)} />
              {isMotion ? "Framer Motion & React 19 native" : "Tailwind CSS v4 & shadcn/ui native"}
            </span>
            <Link
              href="/install"
              className={cn("inline-flex items-center gap-1 font-handwritten font-bold hover:underline", accentColor)}
            >
              Install Guide <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
