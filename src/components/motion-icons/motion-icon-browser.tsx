"use client"

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  Activity,
  Check,
  Code,
  Compass,
  Copy,
  Download,
  File,
  Mail,
  Menu,
  Minus,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Wallet,
  X,
  Zap,
} from "@/components/icons"
import { cn } from "@/lib/utils"
import { PhoneToggle } from "@/components/phone-toggle"
import { CodeBlock } from "@/components/agents/code-block"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Import authentic 467 motion icon components and map
import { ICON_LIST, ICON_MAP } from "./icons"

export interface MotionIconMeta {
  name: string
  slug: string
  componentName: string
  category: string
  animationType: string
  keywords: string[]
}

export interface IconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

export const CATEGORIES = [
  "All Categories",
  "General & UI",
  "Arrows & Navigation",
  "Media & Audio",
  "Communication & Social",
  "System & Devices",
  "Finance & Commerce",
  "Weather & Nature",
  "Health & Wellness",
  "Editing & Design",
  "Files & Documents",
] as const

export const DENSITY_CONFIGS = {
  compact: {
    gridClass: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2.5",
    cardPadding: "p-3",
    iconSize: 24,
  },
  comfortable: {
    gridClass: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5",
    cardPadding: "p-4",
    iconSize: 32,
  },
  spacious: {
    gridClass: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4.5",
    cardPadding: "p-5",
    iconSize: 38,
  },
}

export const CATEGORY_DEFS = [
  { id: "All Categories", label: "All", icon: Menu },
  { id: "General & UI", label: "General & UI", icon: Check },
  { id: "Arrows & Navigation", label: "Arrows", icon: Compass },
  { id: "Media & Audio", label: "Media", icon: Play },
  { id: "Communication & Social", label: "Communication", icon: Mail },
  { id: "System & Devices", label: "Devices", icon: Smartphone },
  { id: "Finance & Commerce", label: "Commerce", icon: Wallet },
  { id: "Weather & Nature", label: "Weather", icon: Sun },
  { id: "Health & Wellness", label: "Health", icon: Activity },
  { id: "Editing & Design", label: "Design", icon: Palette },
  { id: "Files & Documents", label: "Files", icon: File },
] as const

export const COLOR_PRESETS = [
  { label: "Default", value: null, bg: "currentColor" },
  { label: "Charcoal", value: "#334155", bg: "#334155" },
  { label: "Amber", value: "#F59E0B", bg: "#F59E0B" },
  { label: "Emerald", value: "#10B981", bg: "#10B981" },
  { label: "Cyan", value: "#06B6D4", bg: "#06B6D4" },
  { label: "Violet", value: "#8B5CF6", bg: "#8B5CF6" },
  { label: "Rose", value: "#F43F5E", bg: "#F43F5E" },
] as const

const SUGGESTIONS = [
  "bell",
  "heart",
  "wifi",
  "sparkles",
  "battery-charging",
  "activity",
  "shield-check",
  "sun",
  "volume-2",
  "zap",
]

const GRID_CLASSES: Record<number, string> = {
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  8: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
  10: "grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10",
  12: "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12",
  16: "grid-cols-4 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16",
}

export function MotionIconBrowser() {
  const [metaList, setMetaList] = useState<MotionIconMeta[]>([])
  const [sourcesMap, setSourcesMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Controls
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [size, setSize] = useState<number>(32)
  const [color, setColor] = useState<string | null>(null)
  const [columns, setColumns] = useState<number>(8)
  const [showNames, setShowNames] = useState<boolean>(true)
  const [isContinuousPlay, setIsContinuousPlay] = useState<boolean>(false)
  const [visibleCount, setVisibleCount] = useState<number>(48)
  const [suggestionIdx, setSuggestionIdx] = useState(0)

  // Inspected Icon Modal State
  const [inspectedIcon, setInspectedIcon] = useState<MotionIconMeta | null>(null)
  const [modalActiveTab, setModalActiveTab] = useState<"react" | "cli" | "svg">("react")
  const [modalLoop, setModalLoop] = useState<boolean>(false)
  const modalIconRef = useRef<IconHandle>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Cycle search suggestions every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIdx((i) => (i + 1) % SUGGESTIONS.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  // Fetch meta & source code on mount
  useEffect(() => {
    Promise.all([
      fetch("/motion-icons/meta.json").then((r) => r.json()),
      fetch("/motion-icons/sources.json")
        .then((r) => r.json())
        .catch(() => ({})),
    ])
      .then(([metaData, sourcesData]) => {
        setMetaList(metaData)
        setSourcesMap(sourcesData)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load motion icons data:", err)
        // Fallback to ICON_LIST metadata
        const fallbackMeta = ICON_LIST.map((item) => ({
          name: item.name
            .split("-")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" "),
          slug: item.name,
          componentName: `Motion${item.name
            .split("-")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join("")}`,
          category: "General & UI",
          animationType: "custom",
          keywords: item.keywords,
        }))
        setMetaList(fallbackMeta)
        setIsLoading(false)
      })
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase())
      setVisibleCount(48)
    }, 150)
    return () => clearTimeout(timer)
  }, [search])

  // Keyboard shortcuts (Ctrl+K, /, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === "Escape") {
        if (inspectedIcon) {
          setInspectedIcon(null)
        } else if (search) {
          setSearch("")
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [inspectedIcon, search])

  // Continuous loop trigger for modal icon
  useEffect(() => {
    if (!modalLoop || !inspectedIcon) return
    modalIconRef.current?.startAnimation()
    const interval = setInterval(() => {
      modalIconRef.current?.startAnimation()
    }, 1800)
    return () => clearInterval(interval)
  }, [modalLoop, inspectedIcon])

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const icon of metaList) {
      counts[icon.category] = (counts[icon.category] || 0) + 1
    }
    return counts
  }, [metaList])

  // Filtered icons
  const filteredIcons = useMemo(() => {
    let result = metaList

    if (selectedCategory !== "All Categories") {
      result = result.filter((icon) => icon.category === selectedCategory)
    }

    if (debouncedSearch) {
      result = result.filter((icon) => {
        const matchesName = icon.name.toLowerCase().includes(debouncedSearch)
        const matchesSlug = icon.slug.toLowerCase().includes(debouncedSearch)
        const matchesKeywords = icon.keywords.some((k) =>
          k.toLowerCase().includes(debouncedSearch)
        )
        return matchesName || matchesSlug || matchesKeywords
      })
    }

    return result
  }, [metaList, selectedCategory, debouncedSearch])

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${label} to clipboard!`)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  const handleDownloadCode = useCallback((slug: string, code: string) => {
    const blob = new Blob([code], { type: "text/typescript;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug}.tsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${slug}.tsx`)
  }, [])

  const atDefaults =
    !search &&
    selectedCategory === "All Categories" &&
    size === 32 &&
    color === null &&
    columns === 8 &&
    showNames === true &&
    !isContinuousPlay

  const resetAll = () => {
    setSearch("")
    setSelectedCategory("All Categories")
    setSize(32)
    setColor(null)
    setColumns(8)
    setShowNames(true)
    setIsContinuousPlay(false)
    setVisibleCount(48)
    toast.success("Reset studio controls to defaults")
  }

  // --- Sub-components for Command Console ---

  const sizeControl = (
    <div className="flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-2 py-1 backdrop-blur-sm shadow-xs">
      <span className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal className="size-3 text-muted-foreground/80 hidden sm:inline" />
        <span>Size</span>
      </span>

      <button
        type="button"
        onClick={() => setSize((s) => Math.max(16, s - 4))}
        disabled={size <= 16}
        aria-label="Decrease size"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground disabled:opacity-30 cursor-pointer"
      >
        <Minus className="size-3" />
      </button>

      <div className="flex items-baseline justify-center min-w-9.5 px-1 font-mono text-xs font-bold text-foreground bg-background/90 rounded-md border border-border/60 py-0.5 shadow-2xs">
        <span>{size}</span>
        <span className="text-[9px] text-muted-foreground ml-0.5">px</span>
      </div>

      <button
        type="button"
        onClick={() => setSize((s) => Math.min(64, s + 4))}
        disabled={size >= 64}
        aria-label="Increase size"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground disabled:opacity-30 cursor-pointer"
      >
        <Plus className="size-3" />
      </button>

      <div className="flex items-center gap-0.5 border-l border-border/60 pl-1.5 ml-0.5">
        {[16, 20, 24, 32, 40].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            className={cn(
              "h-6 px-1.5 font-mono text-[11px] rounded-md transition-all cursor-pointer",
              size === s
                ? "bg-purple-600 text-white font-black shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )

  const colorPicker = (
    <div className="flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-2.5 py-1 backdrop-blur-sm shadow-xs">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mr-0.5 hidden xl:inline">
        Theme
      </span>
      <div className="flex items-center gap-1.5">
        {COLOR_PRESETS.map((p) => {
          const isSelected = (color === null && p.value === null) || color === p.value
          return (
            <button
              key={p.label}
              type="button"
              title={`Theme: ${p.label}`}
              onClick={() => setColor(p.value)}
              className={cn(
                "size-3.5 rounded-full border transition-all cursor-pointer",
                isSelected
                  ? "scale-125 border-foreground shadow-xs ring-2 ring-purple-500/50"
                  : "border-border/60 opacity-80 hover:opacity-100 hover:scale-110"
              )}
              style={{
                backgroundColor: p.value === null ? "currentColor" : p.bg,
              }}
            />
          )
        })}

        <span className="h-3.5 w-px bg-border/60 mx-0.5" />

        <label
          title={color ? `Custom: ${color}` : "Custom color"}
          className="relative cursor-pointer flex items-center justify-center size-5 rounded-md hover:bg-background/80 transition-colors"
        >
          <Palette className="size-3.5 text-muted-foreground hover:text-foreground" />
          <input
            type="color"
            value={color ?? "#8b5cf6"}
            onChange={(event) => setColor(event.currentTarget.value)}
            aria-label="Icon colour"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )

  const settingsMenu = (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              aria-label="Grid settings"
              className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all cursor-pointer shadow-xs"
            />
          }
        >
          <Settings className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Grid settings</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <div className="flex items-center justify-between gap-4">
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Icon names</span>
            <span className="text-xs text-muted-foreground">
              The label under each glyph
            </span>
          </span>
          <PhoneToggle
            on={showNames}
            label="Show icon names"
            onChange={(next) => setShowNames(next)}
          />
        </div>

        <DropdownMenuSeparator className="my-3" />

        <div className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Grid columns</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {columns} per row
            </span>
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            {[4, 6, 8, 10, 12, 16].map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setColumns(col)}
                className={cn(
                  "flex-1 h-7 rounded-md font-mono text-xs font-bold transition-all cursor-pointer",
                  columns === col
                    ? "bg-purple-600 text-white shadow-xs font-black"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-background"
                )}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const resetButton = (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={resetAll}
            disabled={atDefaults}
            aria-label="Reset to defaults"
            className={cn(
              "flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all cursor-pointer shadow-xs disabled:pointer-events-none disabled:opacity-40"
            )}
          />
        }
      >
        <RotateCcw className="size-4" />
      </TooltipTrigger>
      <TooltipContent>Reset to defaults</TooltipContent>
    </Tooltip>
  )

  const telemetryBadge = (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold tracking-tight shadow-xs whitespace-nowrap">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-purple-500" />
      </span>
      <span>{filteredIcons.length.toLocaleString("en-US")} GLYPHS</span>
    </div>
  )

  const gridColClass = GRID_CLASSES[columns] ?? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"

  return (
    <div className="w-full flex flex-col gap-6 selection:bg-purple-500/20">
      <div className="w-full flex flex-col gap-5">
        {/* ========================================================================= */}
        {/* 1. STUDIO MASTER COMMAND CONSOLE                                          */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 backdrop-blur-2xl p-3.5 md:p-4 shadow-xl shadow-black/10 flex flex-col gap-3">
          {/* Top specular highlight line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500/60 to-transparent"
          />

          {/* Row 1: Integrated Omni-Search & Visual Spec Matrix */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search expands to take all left/center room */}
            <div className="relative flex-1 min-w-65">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search for ${SUGGESTIONS[suggestionIdx]}...`}
                className="w-full rounded-xl border border-border/80 bg-muted/40 pl-10 pr-20 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-sans"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground select-none">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Desktop Spec Matrix: Play All & Mode Toggles */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 py-0.5">
              {/* Continuous Loop / Play All Toggle */}
              <button
                type="button"
                onClick={() => setIsContinuousPlay((prev) => !prev)}
                className={cn(
                  "flex h-8 items-center gap-1.5 px-3 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap",
                  isContinuousPlay
                    ? "bg-purple-600 text-white font-bold shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/70 hover:bg-background/60"
                )}
                title="Continuous loop across all micro-interactions"
              >
                <Play
                  className={cn("size-3.5", isContinuousPlay ? "fill-white animate-spin" : "")}
                />
                <span>{isContinuousPlay ? "Looping All" : "Play All"}</span>
              </button>

              <div className="h-5 w-px bg-border/60 shrink-0" />

              {/* Status Pill */}
              <div className="hidden sm:flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-border/80 bg-muted/40 text-xs font-mono text-muted-foreground">
                <Zap className="size-3 text-amber-500" />
                <span>Hover Physics Active</span>
              </div>
            </div>
          </div>

          {/* Row 2: Precision Engineering Bar (Zero Dead Space!) */}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 overflow-x-auto no-scrollbar pr-1">
            {/* Module 1: Geometry (Size) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {sizeControl}
            </div>

            {/* Module 2: Filtering & Theme (Theme Swatches & Picker) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {colorPicker}
            </div>

            {/* Module 3: System Telemetry & Viewport */}
            <div className="flex items-center gap-1.5 shrink-0">
              {settingsMenu}
              {resetButton}
              {telemetryBadge}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. HORIZONTAL CATEGORY FILTER STRIP                                       */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-purple-500" />
              Filter by Category
            </span>
            {selectedCategory !== "All Categories" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All Categories")
                  setVisibleCount(48)
                }}
                className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Reset to All ({metaList.length.toLocaleString("en-US")})
              </button>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
            {CATEGORY_DEFS.map((c) => {
              const active = selectedCategory === c.id
              const count =
                c.id === "All Categories"
                  ? metaList.length
                  : categoryCounts[c.id] ?? 0

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c.id)
                    setVisibleCount(48)
                  }}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-sans font-medium transition-all border cursor-pointer",
                    active
                      ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs"
                      : "bg-card text-muted-foreground border-border/70 hover:border-border hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <c.icon
                    className={cn(
                      "size-3.5 shrink-0 transition-colors",
                      active ? "text-white" : "text-muted-foreground"
                    )}
                  />
                  <span>{c.label}</span>
                  <span
                    className={cn(
                      "rounded px-1 text-[10px] font-mono tabular-nums",
                      active
                        ? "bg-white/20 text-white font-bold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN MOTION ICONS GRID SECTION                                         */}
      {/* ========================================================================= */}
      <section className="w-full py-2 min-h-125">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="size-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="font-mono text-xs text-muted-foreground">
              Loading authentic Framer Motion icon components...
            </p>
          </div>
        ) : filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border/80 p-8">
            <p className="font-display text-lg text-foreground mb-1">
              No icons match {search ? `\u201C${search}\u201D` : "these filters"}
            </p>
            <p className="text-xs text-muted-foreground font-mono max-w-sm mb-4">
              Try another keyword or click reset to clear your active filter combination.
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 text-white px-4 py-2 font-mono text-xs font-bold shadow-xs hover:bg-purple-500 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        ) : (
          <div className={cn("grid gap-2.5", gridColClass)}>
            {filteredIcons.slice(0, visibleCount).map((icon) => {
              const IconComponent = ICON_MAP.get(icon.slug)
              return (
                <MotionIconCard
                  key={icon.slug}
                  icon={icon}
                  IconComponent={IconComponent}
                  size={size}
                  color={color}
                  showNames={showNames}
                  isContinuousPlay={isContinuousPlay}
                  onInspect={() => {
                    setInspectedIcon(icon)
                    setModalLoop(false)
                  }}
                  onCopyReact={() => {
                    const code =
                      sourcesMap[icon.slug] ||
                      `import { ${icon.componentName}Icon } from "@flux-icons/motion/${icon.slug}";`
                    handleCopy(code, `${icon.name} React Code`)
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {filteredIcons.length > visibleCount && (
          <div className="flex justify-center pt-8 pb-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + 48)}
              className="flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-card/80 px-6 py-2.5 font-mono text-xs font-bold text-foreground shadow-xs hover:bg-purple-500/10 hover:border-purple-500 transition-all cursor-pointer"
            >
              <span>Load More Motion Icons</span>
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-purple-600 dark:text-purple-400 text-[10px]">
                +{filteredIcons.length - visibleCount} remaining
              </span>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. DETAIL INSPECTION MODAL                                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {inspectedIcon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg uppercase tracking-wide text-foreground">
                      {inspectedIcon.name}
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground">
                      &lt;{inspectedIcon.componentName}Icon /&gt; · {inspectedIcon.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setInspectedIcon(null)}
                  className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Large Interactive Animated Stage */}
                <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-purple-500/30 bg-radial from-purple-500/10 via-transparent to-transparent p-6">
                  {/* Hero Specimen */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex size-32 items-center justify-center rounded-2xl border border-border/80 bg-background/90 shadow-inner">
                      {(() => {
                        const ModalComponent = ICON_MAP.get(inspectedIcon.slug)
                        if (!ModalComponent) return null
                        return (
                          <div style={{ color: color ?? undefined }}>
                            <ModalComponent
                              ref={modalIconRef}
                              size={56}
                              className="flex items-center justify-center transition-transform"
                            />
                          </div>
                        )
                      })()}
                    </div>
                    <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      [LIVE ANIMATION]
                    </span>
                  </div>

                  {/* Stage Controls */}
                  <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => modalIconRef.current?.startAnimation()}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 font-mono text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-all active:scale-95 cursor-pointer"
                      >
                        <Play className="size-3.5 fill-white" />
                        <span>Replay Animation</span>
                      </button>

                      <button
                        onClick={() => setModalLoop((l) => !l)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all border cursor-pointer",
                          modalLoop
                            ? "bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400"
                            : "bg-muted border-border/80 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <RotateCcw className={cn("size-3.5", modalLoop ? "animate-spin" : "")} />
                        <span>Continuous Loop</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span>Keywords:</span>
                      {inspectedIcon.keywords.slice(0, 5).map((kw) => (
                        <span key={kw} className="rounded bg-muted px-2 py-0.5 border border-border/60 text-[10px]">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Code Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/80 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModalActiveTab("react")}
                        className={cn(
                          "rounded-lg px-3 py-1 font-mono text-xs font-bold transition-all cursor-pointer",
                          modalActiveTab === "react"
                            ? "bg-purple-600 text-white"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        React Component (.tsx)
                      </button>
                      <button
                        onClick={() => setModalActiveTab("cli")}
                        className={cn(
                          "rounded-lg px-3 py-1 font-mono text-xs font-bold transition-all cursor-pointer",
                          modalActiveTab === "cli"
                            ? "bg-purple-600 text-white"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        CLI / Install
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const code = sourcesMap[inspectedIcon.slug]
                        if (code) handleDownloadCode(inspectedIcon.slug, code)
                      }}
                      className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Download .tsx</span>
                    </button>
                  </div>

                  {modalActiveTab === "react" && (
                    <CodeBlock
                      code={
                        sourcesMap[inspectedIcon.slug] ||
                        `// Loading ${inspectedIcon.slug}.tsx...`
                      }
                      language="tsx"
                      filename={`${inspectedIcon.slug}.tsx`}
                      maxHeight={280}
                    />
                  )}

                  {modalActiveTab === "cli" && (
                    <CodeBlock
                      code={`# Add with shadcn CLI directly
npx shadcn@latest add @flux/motion/${inspectedIcon.slug}

# Or add with Flux Icons CLI
npx @flux-icons/cli add motion-${inspectedIcon.slug}

# Or install the whole motion suite
npm install @flux-icons/motion`}
                      language="bash"
                      filename="terminal"
                      maxHeight={260}
                    />
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-border/80 bg-muted/30 px-6 py-4">
                <span className="font-mono text-xs text-muted-foreground">
                  Press <kbd className="rounded bg-muted px-1.5 py-0.5 border border-border/80 text-[10px]">Esc</kbd> to close
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const cliCmd = `npx shadcn@latest add @flux/motion/${inspectedIcon.slug}`
                      handleCopy(cliCmd, "CLI Command")
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 font-mono text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-all cursor-pointer"
                  >
                    <Terminal className="size-3.5" />
                    <span>Copy CLI</span>
                  </button>

                  <button
                    onClick={() => {
                      const code = sourcesMap[inspectedIcon.slug]
                      if (code) {
                        handleCopy(code, `${inspectedIcon.name} Component Code`)
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 font-mono text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition-all cursor-pointer"
                  >
                    <Code className="size-3.5" />
                    <span>Copy React Component</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * MotionIconCard: Individual Card rendering the REAL animated icon component
 */
function MotionIconCard({
  icon,
  IconComponent,
  size,
  color,
  showNames,
  isContinuousPlay,
  onInspect,
  onCopyReact,
}: {
  icon: MotionIconMeta
  IconComponent?: React.ElementType
  size: number
  color: string | null
  showNames: boolean
  isContinuousPlay: boolean
  onInspect: () => void
  onCopyReact: () => void
}) {
  const iconRef = useRef<IconHandle>(null)

  // Continuous play effect
  useEffect(() => {
    if (!isContinuousPlay) return
    iconRef.current?.startAnimation()
    const interval = setInterval(() => {
      iconRef.current?.startAnimation()
    }, 2000)
    return () => clearInterval(interval)
  }, [isContinuousPlay])

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation()
  }

  const handleMouseLeave = () => {
    if (!isContinuousPlay) {
      iconRef.current?.stopAnimation()
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onInspect}
      className={cn(
        "group relative flex flex-col items-center justify-between rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl transition-all duration-200 select-none cursor-pointer p-3.5",
        "hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 active:translate-y-0"
      )}
    >
      {/* Centered Genuine Icon Component */}
      <div className="flex items-center justify-center my-auto py-3">
        {IconComponent ? (
          <div style={{ color: color ?? undefined }}>
            <IconComponent
              ref={iconRef}
              size={size}
              className="flex items-center justify-center transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="size-8 rounded-full border border-border/60" />
        )}
      </div>

      {/* Name */}
      {showNames && (
        <span className="mt-1 w-full truncate text-center font-mono text-[11px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
          {icon.name}
        </span>
      )}

      {/* Quick Play Trigger & Copy Action on Hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            iconRef.current?.startAnimation()
          }}
          className="rounded-md bg-card/90 border border-border/80 p-1 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 shadow-2xs hover:scale-105 transition-all cursor-pointer"
          title="Play Micro-Animation"
        >
          <Play className="size-3 fill-current" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCopyReact()
          }}
          className="rounded-md bg-card/90 border border-border/80 p-1 text-muted-foreground hover:text-foreground shadow-2xs hover:scale-105 transition-all cursor-pointer"
          title="Copy React Code"
        >
          <Copy className="size-3" />
        </button>
      </div>
    </div>
  )
}
