"use client"

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react"
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Code,
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
  Shapes,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Square,
  Sun,
  User,
  Wallet,
  X,
} from "@/components/icons"
import { cn } from "@/lib/utils"
import { PhoneToggle } from "@/components/phone-toggle"
import { CodeBlock } from "@/components/agents/code-block"
import { motion } from "motion/react"
import { SPRING_LAYOUT } from "@/lib/ease"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface IconMeta {
  name: string
  slug: string
  category: string
  variants: string[]
}

export interface SvgData {
  fill: string
  inner: string
}

export const VARIANTS = [
  { id: "linear", label: "Linear", desc: "1.5px clean contour stroke" },
  { id: "bold", label: "Bold", desc: "Solid filled glyph silhouette" },
  { id: "twotone", label: "Two-Tone", desc: "Dual opacity depth layer" },
  { id: "bulk", label: "Bulk", desc: "Rounded solid volumetric fill" },
  { id: "broken", label: "Broken", desc: "Modern fragmented stroke paths" },
  { id: "outline", label: "Outline", desc: "Refined architectural outer edge" },
] as const

export type VariantId = (typeof VARIANTS)[number]["id"]
export type CornerType = "regular" | "sharp"

const SHAPES = [
  { value: "all", label: "All", hint: "All glyph shapes", icon: Shapes },
  { value: "regular", label: "Regular", hint: "No shape boundary", icon: Minus },
  { value: "square", label: "Square", hint: "Square / boxed container", icon: Square },
  { value: "circle", label: "Circle", hint: "Circle container", icon: Circle },
] as const

type ShapeFilter = (typeof SHAPES)[number]["value"]

export const COLOR_PRESETS = [
  { label: "Default", value: null, bg: "currentColor" },
  { label: "Charcoal", value: "#334155", bg: "#334155" },
  { label: "Amber", value: "#F59E0B", bg: "#F59E0B" },
  { label: "Emerald", value: "#10B981", bg: "#10B981" },
  { label: "Cyan", value: "#06B6D4", bg: "#06B6D4" },
  { label: "Violet", value: "#8B5CF6", bg: "#8B5CF6" },
  { label: "Rose", value: "#F43F5E", bg: "#F43F5E" },
] as const

export const PALETTES = COLOR_PRESETS

const STYLE_SPECS = [
  {
    id: "linear" as const,
    label: "Linear",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "bold" as const,
    label: "Bold",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "twotone" as const,
    label: "Two-Tone",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.75" strokeDasharray="2 1.5" className="opacity-60" />
      </svg>
    ),
  },
  {
    id: "bulk" as const,
    label: "Bulk",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2.5" width="11" height="11" rx="3.5" fill="currentColor" fillOpacity="0.35" />
        <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "broken" as const,
    label: "Broken",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M13.5 6V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v8A1.5 1.5 0 0 0 4 13.5h8a1.5 1.5 0 0 0 1.5-1.5V10" />
      </svg>
    ),
  },
  {
    id: "outline" as const,
    label: "Outline",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <rect x="2" y="2" width="12" height="12" rx="3" strokeWidth="1.2" />
        <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
]

const CORNER_SPECS = [
  {
    id: "regular" as const,
    label: "Rounded",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2.5" y="2.5" width="11" height="11" rx="4" />
      </svg>
    ),
  },
  {
    id: "sharp" as const,
    label: "Sharp",
    badge: "NEW",
    specimen: (
      <svg className="size-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2.5" y="2.5" width="11" height="11" rx="0" />
      </svg>
    ),
  },
]

export const PKG_MANAGERS = [
  { id: "npm", cmd: "npm i @flux-icons/react" },
  { id: "pnpm", cmd: "pnpm add @flux-icons/react" },
  { id: "yarn", cmd: "yarn add @flux-icons/react" },
  { id: "bun", cmd: "bun add @flux-icons/react" },
] as const

const SUGGESTIONS = [
  "calendar",
  "wallet",
  "arrow",
  "user",
  "settings",
  "chart",
  "card",
  "shield",
  "heart",
  "bell",
  "mail",
  "device",
]

// Global cache for chunked SVG data
const chunkCache = new Map<string, Record<string, Record<string, SvgData>>>()
const chunkPromises = new Map<string, Promise<Record<string, Record<string, SvgData>>>>()

function getChunkKey(slug: string): string {
  const first = slug.charAt(0).toLowerCase()
  return /^[0-9]/.test(first) ? "num" : first
}

async function loadChunk(chunkKey: string) {
  if (chunkCache.has(chunkKey)) return chunkCache.get(chunkKey)!
  if (chunkPromises.has(chunkKey)) return chunkPromises.get(chunkKey)!

  const p = fetch(`/extended-icons/chunks/${chunkKey}.json`)
    .then((r) => {
      if (!r.ok) throw new Error("Network error")
      return r.json()
    })
    .then((data) => {
      chunkCache.set(chunkKey, data)
      chunkPromises.delete(chunkKey)
      return data
    })
    .catch((err) => {
      console.warn("Failed to load extended icon chunk:", chunkKey, err)
      chunkPromises.delete(chunkKey)
      return {}
    })

  chunkPromises.set(chunkKey, p)
  return p
}

export function ExtendedIconSvg({
  svgData,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
  accentOpacity = 0.5,
  corners = "regular",
  className = "",
}: {
  svgData?: SvgData | null
  size?: number | string
  color?: string
  strokeWidth?: number
  accentOpacity?: number
  corners?: CornerType
  className?: string
}) {
  if (!svgData) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn("animate-pulse opacity-15 text-muted-foreground", className)}
      >
        <rect width="24" height="24" rx={corners === "sharp" ? 0 : 5} fill="currentColor" />
      </svg>
    )
  }

  // Rewrite inner paths to support live strokeWidth, accentOpacity, and corner sharpness
  let modifiedInner = svgData.inner
  if (strokeWidth !== 1.5) {
    modifiedInner = modifiedInner.replace(
      /stroke-width="1\.5"/g,
      `stroke-width="${strokeWidth}"`
    )
  }
  if (accentOpacity !== 0.5) {
    modifiedInner = modifiedInner.replace(
      /opacity="0\.5"/g,
      `opacity="${accentOpacity}"`
    )
  }
  if (corners === "sharp") {
    modifiedInner = modifiedInner
      .replace(/stroke-linecap="round"/g, `stroke-linecap="square"`)
      .replace(/stroke-linejoin="round"/g, `stroke-linejoin="miter"`)
      .replace(/rx="[0-9.]+"/g, `rx="0"`)
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={svgData.fill}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: modifiedInner }}
    />
  )
}

function buildSvgString(
  svgData: SvgData,
  size: number | string = 24,
  color: string = "currentColor",
  strokeWidth: number = 1.5,
  accentOpacity: number = 0.5,
  corners: CornerType = "regular"
) {
  let inner = svgData.inner
  if (strokeWidth !== 1.5) {
    inner = inner.replace(/stroke-width="1\.5"/g, `stroke-width="${strokeWidth}"`)
  }
  if (accentOpacity !== 0.5) {
    inner = inner.replace(/opacity="0\.5"/g, `opacity="${accentOpacity}"`)
  }
  if (corners === "sharp") {
    inner = inner
      .replace(/stroke-linecap="round"/g, `stroke-linecap="square"`)
      .replace(/stroke-linejoin="round"/g, `stroke-linejoin="miter"`)
      .replace(/rx="[0-9.]+"/g, `rx="0"`)
  }

  const fillAttr = svgData.fill !== "none" ? ` fill="${svgData.fill}"` : ` fill="none"`
  const strokeAttr = svgData.fill === "none" ? ` stroke="${color}"` : ""

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"${fillAttr}${strokeAttr} xmlns="http://www.w3.org/2000/svg">\n  ${inner}\n</svg>`
}

function toComponentName(slug: string, style?: string): string {
  const parts = slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  const base = parts.join("")
  if (!style || style === "linear") return base
  return `${base}${style.charAt(0).toUpperCase() + style.slice(1)}`
}

export type SortOrder = "random" | "az" | "za"

/**
 * Deterministic pseudo-random Fisher-Yates shuffle using Mulberry32 PRNG.
 * Ensures consistent SSR/hydration while allowing instant interactive reshuffling on click.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let s = seed
  const nextRandom = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 3h5v5" />
      <path d="M4 20l7.5-7.5" />
      <path d="M21 3l-7.5 7.5" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  )
}

export function ExtendedIconBrowser() {
  const [metaList, setMetaList] = useState<IconMeta[]>([])
  const [aliases, setAliases] = useState<Record<string, string[]>>({})
  const [loadedChunks, setLoadedChunks] = useState<Record<string, Record<string, Record<string, SvgData>>>>({})
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)

  // Search, Filter & Order State
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [activeVariant, setActiveVariant] = useState<VariantId>("linear")
  const [corners, setCorners] = useState<CornerType>("regular")
  const [shape, setShape] = useState<ShapeFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("random")
  const [shuffleSeed, setShuffleSeed] = useState<number>(42)

  // Precision Engineering Parameters
  const [size, setSize] = useState<number>(24)
  const [stroke, setStroke] = useState<number>(1.5)
  const [color, setColor] = useState<string | null>(null)
  const [accentOpacity] = useState<number>(0.5)

  // Viewport & Grid Settings
  const [showNames, setShowNames] = useState<boolean>(true)
  const [columns, setColumns] = useState<number>(8)
  const [visibleCount, setVisibleCount] = useState<number>(96)

  // Inspection & Interaction
  const [selectedIcon, setSelectedIcon] = useState<IconMeta | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedPkgManager, setSelectedPkgManager] = useState<"npm" | "pnpm" | "yarn" | "bun">("npm")
  const [codeSnippetTab, setCodeSnippetTab] = useState<"react" | "svg" | "cli">("react")
  const [isCodeStreaming, setIsCodeStreaming] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  const currentIconConfigKey = `${selectedIcon?.slug}-${activeVariant}-${size}-${stroke}-${corners}-${codeSnippetTab}`
  const [prevIconConfigKey, setPrevIconConfigKey] = useState(currentIconConfigKey)

  if (currentIconConfigKey !== prevIconConfigKey) {
    setPrevIconConfigKey(currentIconConfigKey)
    if (selectedIcon) {
      setIsCodeStreaming(true)
    }
  }

  // Pure timeout effect to conclude live streaming animation
  useEffect(() => {
    if (!isCodeStreaming) return
    const timer = setTimeout(() => setIsCodeStreaming(false), 260)
    return () => clearTimeout(timer)
  }, [isCodeStreaming])

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Rotate search suggestions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % SUGGESTIONS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Global keyboard shortcuts (Ctrl+K to search, Esc to dismiss)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (e.key === "Escape") {
        if (selectedIcon) {
          setSelectedIcon(null)
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur()
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedIcon])

  // Load initial metadata & aliases
  useEffect(() => {
    Promise.all([
      fetch("/extended-icons/meta.json").then((r) => r.json()),
      fetch("/extended-icons/aliases.json")
        .then((r) => r.json())
        .catch(() => ({})),
    ])
      .then(([metaData, aliasesData]) => {
        setMetaList(metaData)
        setAliases(aliasesData)
        setIsLoadingMeta(false)
      })
      .catch((err) => {
        console.error("Failed to load extended icons meta:", err)
        setIsLoadingMeta(false)
      })
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase())
      setVisibleCount(96)
    }, 100)
    return () => clearTimeout(timer)
  }, [search])

  // Shape distribution counts
  const perShape = useMemo(() => {
    let square = 0
    let circle = 0
    let regular = 0
    for (const item of metaList) {
      if (item.slug.includes("square") || item.slug.includes("box")) {
        square++
      } else if (item.slug.includes("circle")) {
        circle++
      } else {
        regular++
      }
    }
    return { all: metaList.length, square, circle, regular }
  }, [metaList])

  // Category counts
  const perCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of metaList) {
      const cat = item.category || "General & UI"
      map.set(cat, (map.get(cat) ?? 0) + 1)
    }
    return map
  }, [metaList])

  // Category list data with associated icon
  const categoriesData = useMemo(() => {
    const allCount = metaList.length
    return [
      { label: "All", value: "All", icon: Menu, count: allCount },
      { label: "General & UI", value: "General & UI", icon: Shapes, count: perCategory.get("General & UI") ?? 0 },
      { label: "Files & Documents", value: "Files & Documents", icon: File, count: perCategory.get("Files & Documents") ?? 0 },
      { label: "Interface & Controls", value: "Interface & Controls", icon: SlidersHorizontal, count: perCategory.get("Interface & Controls") ?? 0 },
      { label: "Arrows & Navigation", value: "Arrows & Navigation", icon: ArrowRight, count: perCategory.get("Arrows & Navigation") ?? 0 },
      { label: "Media & Audio", value: "Media & Audio", icon: Play, count: perCategory.get("Media & Audio") ?? 0 },
      { label: "Communication", value: "Communication", icon: Mail, count: perCategory.get("Communication") ?? 0 },
      { label: "Finance & Payments", value: "Finance & Payments", icon: Wallet, count: perCategory.get("Finance & Payments") ?? 0 },
      { label: "Weather & Nature", value: "Weather & Nature", icon: Sun, count: perCategory.get("Weather & Nature") ?? 0 },
      { label: "Shopping & Ecommerce", value: "Shopping & Ecommerce", icon: ShoppingCart, count: perCategory.get("Shopping & Ecommerce") ?? 0 },
      { label: "Devices & Tech", value: "Devices & Tech", icon: Smartphone, count: perCategory.get("Devices & Tech") ?? 0 },
      { label: "Users & People", value: "Users & People", icon: User, count: perCategory.get("Users & People") ?? 0 },
      { label: "Health & Medical", value: "Health & Medical", icon: Activity, count: perCategory.get("Health & Medical") ?? 0 },
    ]
  }, [metaList.length, perCategory])

  // Filtering and ordering icons based on query, category, shape, variant, and sort order
  const filteredIcons = useMemo(() => {
    if (!metaList.length) return []
    let list = metaList

    // Category filter
    if (activeCategory !== "All") {
      list = list.filter((i) => i.category === activeCategory)
    }

    // Shape filter
    if (shape !== "all") {
      if (shape === "square") {
        list = list.filter((i) => i.slug.includes("square") || i.slug.includes("box"))
      } else if (shape === "circle") {
        list = list.filter((i) => i.slug.includes("circle"))
      } else if (shape === "regular") {
        list = list.filter((i) => !i.slug.includes("square") && !i.slug.includes("box") && !i.slug.includes("circle"))
      }
    }

    // Variant availability check
    list = list.filter((i) => i.variants.includes(activeVariant))

    // Search query with alias expansion and relevance ranking
    if (debouncedSearch) {
      const q = debouncedSearch
      const matchingAliases: string[] = []
      for (const [key, cluster] of Object.entries(aliases)) {
        if (key.includes(q) || cluster.some((alias) => alias.includes(q))) {
          matchingAliases.push(key, ...cluster)
        }
      }

      const matched = list.filter((icon) => {
        if (icon.slug.includes(q) || icon.name.toLowerCase().includes(q)) {
          return true
        }
        return matchingAliases.some((alias) => icon.slug.includes(alias))
      })

      // Relevance sort for search results: exact match first, prefix match next, substring match next
      return [...matched].sort((a, b) => {
        const aSlug = a.slug
        const bSlug = b.slug
        const aExact = aSlug === q || a.name.toLowerCase() === q
        const bExact = bSlug === q || b.name.toLowerCase() === q
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        const aStarts = aSlug.startsWith(q) || a.name.toLowerCase().startsWith(q)
        const bStarts = bSlug.startsWith(q) || b.name.toLowerCase().startsWith(q)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1

        return aSlug.localeCompare(bSlug)
      })
    }

    // When browsing without active search, apply selected display order (Random by default)
    if (sortOrder === "random") {
      return seededShuffle(list, shuffleSeed)
    } else if (sortOrder === "az") {
      return [...list].sort((a, b) => a.slug.localeCompare(b.slug))
    } else {
      return [...list].sort((a, b) => b.slug.localeCompare(a.slug))
    }
  }, [metaList, activeCategory, shape, debouncedSearch, activeVariant, aliases, sortOrder, shuffleSeed])

  // Current page chunk for virtual infinite scroll
  const paginatedIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount)
  }, [filteredIcons, visibleCount])

  // Prefetch SVG chunk data for visible icons
  useEffect(() => {
    if (!paginatedIcons.length) return
    const chunkKeys = new Set<string>()
    for (const icon of paginatedIcons) {
      chunkKeys.add(getChunkKey(icon.slug))
    }

    chunkKeys.forEach((key) => {
      if (!loadedChunks[key]) {
        loadChunk(key).then((chunkData) => {
          setLoadedChunks((prev) => ({ ...prev, [key]: chunkData }))
        })
      }
    })
  }, [paginatedIcons, loadedChunks])

  // Retrieve an icon's SVG data
  const getSvg = useCallback(
    (slug: string, variant: string): SvgData | null => {
      const key = getChunkKey(slug)
      const chunk = loadedChunks[key]
      if (!chunk || !chunk[slug]) return null
      return chunk[slug][variant] || chunk[slug]["linear"] || null
    },
    [loadedChunks]
  )

  // Copy helper
  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }, [])

  // Download SVG helper
  const downloadSvg = useCallback(
    (slug: string, variant: string) => {
      const data = getSvg(slug, variant)
      if (!data) return
      const svgStr = buildSvgString(data, size, color ?? "currentColor", stroke, accentOpacity, corners)
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${slug}-${variant}${corners === "sharp" ? "-sharp" : ""}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [getSvg, size, color, stroke, accentOpacity, corners]
  )

  // Reset all parameters to initial defaults
  const atDefaults =
    size === 24 &&
    stroke === 1.5 &&
    color === null &&
    activeVariant === "linear" &&
    corners === "regular" &&
    shape === "all" &&
    activeCategory === "All" &&
    search === "" &&
    showNames === true &&
    columns === 8 &&
    sortOrder === "random" &&
    shuffleSeed === 42

  const reset = () => {
    setSize(24)
    setStroke(1.5)
    setColor(null)
    setActiveVariant("linear")
    setCorners("regular")
    setShape("all")
    setActiveCategory("All")
    setSearch("")
    setShowNames(true)
    setColumns(8)
    setSortOrder("random")
    setShuffleSeed(42)
  }

  // Column layout grid classes
  const gridColClass = useMemo(() => {
    switch (columns) {
      case 4:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      case 6:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      case 8:
        return "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
      case 10:
        return "grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10"
      case 12:
        return "grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12"
      case 16:
        return "grid-cols-4 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16"
      default:
        return "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
    }
  }, [columns])

  const activePkgCmd = useMemo(() => {
    return PKG_MANAGERS.find((p) => p.id === selectedPkgManager)?.cmd ?? PKG_MANAGERS[0].cmd
  }, [selectedPkgManager])

  // =========================================================================
  // SUB-CONTROLS
  // =========================================================================

  const sizeControl = (
    <div className="flex h-9 items-center gap-1 rounded-xl border border-border/80 bg-muted/50 px-2 py-1 backdrop-blur-sm shadow-xs shrink-0">
      <span className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mr-0.5">
        <SlidersHorizontal className="size-3 text-blue-500" />
        <span className="hidden sm:inline">Size</span>
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

      <div className="flex items-baseline justify-center min-w-9 px-1 font-mono text-xs font-bold text-foreground bg-background/90 rounded-md border border-border/60 py-0.5 shadow-2xs">
        <span>{size}</span>
        <span className="text-[9px] text-muted-foreground ml-0.5">px</span>
      </div>

      <button
        type="button"
        onClick={() => setSize((s) => Math.min(48, s + 4))}
        disabled={size >= 48}
        aria-label="Increase size"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground disabled:opacity-30 cursor-pointer"
      >
        <Plus className="size-3" />
      </button>

      <div className="flex items-center gap-0.5 border-l border-border/60 pl-1 ml-0.5">
        {[16, 20, 24, 32, 40].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            className={cn(
              "h-6 px-1.5 font-mono text-[11px] rounded-md transition-all cursor-pointer",
              (s === 20 || s === 40) && "hidden xl:block",
              size === s
                ? "bg-blue-600 text-white font-black shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )

  const strokeControl = (
    <div className="flex h-9 items-center gap-1 rounded-xl border border-border/80 bg-muted/50 px-2 py-1 backdrop-blur-sm shadow-xs shrink-0">
      <span className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mr-0.5">
        <span className="hidden sm:inline">Stroke</span>
      </span>

      <button
        type="button"
        onClick={() => setStroke((st) => Math.max(1, +(st - 0.25).toFixed(2)))}
        disabled={stroke <= 1}
        aria-label="Decrease stroke width"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground disabled:opacity-30 cursor-pointer"
      >
        <Minus className="size-3" />
      </button>

      <div className="flex items-baseline justify-center min-w-9.5 px-1 font-mono text-xs font-bold text-foreground bg-background/90 rounded-md border border-border/60 py-0.5 shadow-2xs">
        <span>{stroke.toFixed(stroke % 1 === 0 ? 0 : 1)}</span>
        <span className="text-[9px] text-muted-foreground ml-0.5">px</span>
      </div>

      <button
        type="button"
        onClick={() => setStroke((st) => Math.min(3, +(st + 0.25).toFixed(2)))}
        disabled={stroke >= 3}
        aria-label="Increase stroke width"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground disabled:opacity-30 cursor-pointer"
      >
        <Plus className="size-3" />
      </button>

      <div className="flex items-center gap-0.5 border-l border-border/60 pl-1 ml-0.5">
        {[1, 1.5, 2, 2.5].map((w) => {
          const isActive = Math.abs(stroke - w) < 0.1
          return (
            <button
              key={w}
              type="button"
              title={`${w}px stroke`}
              onClick={() => setStroke(w)}
              className={cn(
                "flex flex-col items-center justify-center h-6 px-1 min-w-5 rounded-md transition-all cursor-pointer",
                w === 2.5 && "hidden xl:flex",
                isActive
                  ? "bg-blue-600 text-white font-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
            >
              <span
                className={cn(
                  "w-2.5 rounded-full mb-0.5",
                  isActive ? "bg-white" : "bg-muted-foreground"
                )}
                style={{ height: `${Math.max(1, w)}px` }}
              />
              <span className="font-mono text-[9px] leading-none">{w}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const shapeMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-2.5 text-xs font-semibold tracking-tight backdrop-blur-sm shadow-xs transition-all hover:bg-background/80 hover:text-foreground cursor-pointer shrink-0">
        <span className="text-muted-foreground font-mono uppercase text-[10px]">Shape:</span>
        <span className="font-bold text-foreground">
          {shape === "all" ? "All" : SHAPES.find((s) => s.value === shape)?.label}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup
          value={shape}
          onValueChange={(val) => setShape(val as ShapeFilter)}
        >
          {SHAPES.map((s) => (
            <DropdownMenuRadioItem key={s.value} value={s.value} className="gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <s.icon className="size-4 text-muted-foreground" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span>{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {perShape[s.value].toLocaleString("en-US")}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const colorPicker = (
    <div className="flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-2 py-1 backdrop-blur-sm shadow-xs shrink-0">
      <div className="flex items-center gap-1">
        {COLOR_PRESETS.map((p) => {
          const isSelected = p.value === color || (p.value === null && color === null)
          return (
            <button
              key={p.label}
              type="button"
              title={`Theme: ${p.label}`}
              onClick={() => setColor(p.value)}
              className={cn(
                "size-3 rounded-full border transition-all cursor-pointer",
                isSelected
                  ? "ring-2 ring-blue-500 scale-125 border-background shadow-xs"
                  : "border-border/60 hover:scale-115 opacity-70 hover:opacity-100"
              )}
              style={{ background: p.bg }}
            />
          )
        })}
      </div>

      <span className="h-3.5 w-px bg-border/60 mx-0.5" />

      <label
        title={color ? `Custom: ${color}` : "Custom color"}
        className="relative cursor-pointer flex items-center justify-center size-5 rounded-md hover:bg-background/80 transition-colors"
      >
        <Palette className="size-3.5 text-muted-foreground hover:text-foreground" />
        <input
          type="color"
          value={color ?? "#3b82f6"}
          onChange={(e) => setColor(e.currentTarget.value)}
          aria-label="Icon colour"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  )

  const shuffleButton = (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => {
              setSortOrder("random")
              setShuffleSeed((s) => s + 1)
              setVisibleCount(96)
            }}
            aria-label="Shuffle grid (randomize order)"
            className={cn(
              "flex size-8.5 items-center justify-center rounded-xl border border-border/80 bg-muted/50 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0",
              sortOrder === "random"
                ? "text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
            )}
          />
        }
      >
        <ShuffleIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Shuffle grid (Randomize order)</TooltipContent>
    </Tooltip>
  )

  const settingsMenu = (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              aria-label="Grid settings"
              className="flex size-8.5 items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all cursor-pointer shadow-xs shrink-0"
            />
          }
        >
          <Settings className="size-3.5" />
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
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-background"
                )}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="my-3" />

        <div className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Display order</span>
            <span className="text-xs text-muted-foreground font-mono">
              {sortOrder === "random"
                ? "Random / Diverse"
                : sortOrder === "az"
                ? "Alphabetical"
                : "Reverse"}
            </span>
          </span>
          <div className="flex flex-col gap-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setSortOrder("random")
                setVisibleCount(96)
              }}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                sortOrder === "random"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <ShuffleIcon className="size-3.5 text-blue-500" />
                <span>Random / Diverse (Default)</span>
              </span>
              {sortOrder === "random" && <Check className="size-3.5 text-blue-500" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setSortOrder("az")
                setVisibleCount(96)
              }}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                sortOrder === "az"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-1 py-0.5 rounded bg-muted">A→Z</span>
                <span>Alphabetical</span>
              </span>
              {sortOrder === "az" && <Check className="size-3.5 text-blue-500" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setSortOrder("za")
                setVisibleCount(96)
              }}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                sortOrder === "za"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-1 py-0.5 rounded bg-muted">Z→A</span>
                <span>Reverse</span>
              </span>
              {sortOrder === "za" && <Check className="size-3.5 text-blue-500" />}
            </button>
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
            onClick={reset}
            disabled={atDefaults}
            aria-label="Reset to defaults"
            className="flex size-8.5 items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all cursor-pointer shadow-xs disabled:pointer-events-none disabled:opacity-40 shrink-0"
          />
        }
      >
        <RotateCcw className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Reset to defaults</TooltipContent>
    </Tooltip>
  )

  const telemetryBadge = (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold tracking-tight shadow-xs whitespace-nowrap shrink-0">
      <span className="relative flex size-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-blue-500" />
      </span>
      <span>{filteredIcons.length.toLocaleString("en-US")}</span>
      <span className="text-[10px] font-semibold opacity-85">GLYPHS</span>
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-6 selection:bg-blue-500/20">
      <div className="w-full flex flex-col gap-5">
        {/* ========================================================================= */}
        {/* 1. STUDIO MASTER COMMAND CONSOLE                                          */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 backdrop-blur-2xl p-3.5 md:p-4 shadow-xl shadow-black/10 flex flex-col gap-3">
          {/* Top specular highlight line */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/60 to-transparent" />

          {/* Row 1: Omni-Search & Visual Spec Matrix */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search expands to take all left/center room */}
            <div className="relative flex-1 min-w-65">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search for ${SUGGESTIONS[suggestionIndex]}...`}
                className="w-full rounded-xl border border-border/80 bg-muted/40 pl-10 pr-20 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-sans"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
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

            {/* Desktop Spec Matrix: Visual Glyphs for Style & Corners */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 py-0.5">
              {/* Style Specs */}
              <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/50 p-1 backdrop-blur-sm shadow-xs">
                {STYLE_SPECS.map((spec) => {
                  const isActive = activeVariant === spec.id
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveVariant(spec.id)}
                      className={cn(
                        "flex h-7 items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer whitespace-nowrap",
                        isActive
                          ? "bg-blue-600 text-white shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      )}
                    >
                      {spec.specimen}
                      <span>{spec.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="h-5 w-px bg-border/60 shrink-0" />

              {/* Corner Specs */}
              <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/50 p-1 backdrop-blur-sm shadow-xs shrink-0">
                {CORNER_SPECS.map((spec) => {
                  const isActive = corners === spec.id
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setCorners(spec.id)}
                      className={cn(
                        "relative flex h-7 items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer",
                        isActive
                          ? "bg-blue-600 text-white shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      )}
                    >
                      {spec.specimen}
                      <span>{spec.label}</span>
                      {spec.badge && (
                        <span
                          className={cn(
                            "rounded px-1 py-0.2 text-[9px] font-mono font-black uppercase tracking-wider",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-blue-500/20 text-blue-500"
                          )}
                        >
                          {spec.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Precision Engineering Bar (Zero Dead Space!) */}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 overflow-x-auto no-scrollbar pr-1">
            {/* Module 1: Geometry (Size & Stroke) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {sizeControl}
              {strokeControl}
            </div>

            {/* Module 2: Filtering & Theme (Shape & Color) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {shapeMenu}
              {colorPicker}
            </div>

            {/* Module 3: System Telemetry & Viewport */}
            <div className="flex items-center gap-1.5 shrink-0">
              {shuffleButton}
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
              <span className="size-1.5 rounded-full bg-blue-500" />
              Filter by Category
            </span>
            {activeCategory !== "All" && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All")
                  setVisibleCount(96)
                }}
                className="font-mono text-xs font-bold text-blue-500 hover:underline cursor-pointer"
              >
                Reset to All ({metaList.length.toLocaleString("en-US")})
              </button>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
            {categoriesData.map((c) => {
              const active = activeCategory === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setActiveCategory(c.value)
                    setVisibleCount(96)
                  }}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-sans font-medium transition-all border cursor-pointer",
                    active
                      ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
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
                    {c.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN ICONS GRID SECTION                                                */}
      {/* ========================================================================= */}
      <section className="w-full py-2 min-h-125">
        {isLoadingMeta ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="size-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="font-mono text-xs text-muted-foreground">
              Loading 2,242 icons dataset...
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
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white px-4 py-2 font-mono text-xs font-bold shadow-xs hover:bg-blue-500 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        ) : (
          <div className={cn("grid gap-2.5", gridColClass)}>
            {paginatedIcons.map((icon) => {
              const svgData = getSvg(icon.slug, activeVariant)
              const compName = toComponentName(icon.slug, activeVariant)

              return (
                <div
                  key={`${icon.slug}-${activeVariant}`}
                  className="group relative flex flex-col items-center justify-between rounded-xl border border-border/80 bg-card/70 backdrop-blur-md p-3 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 hover:bg-card cursor-pointer select-none"
                  onClick={() => setSelectedIcon(icon)}
                >
                  {/* Icon Graphic Container */}
                  <div className="my-auto flex size-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                    <ExtendedIconSvg
                      svgData={svgData}
                      size={size}
                      color={color ?? "currentColor"}
                      strokeWidth={stroke}
                      accentOpacity={accentOpacity}
                      corners={corners}
                    />
                  </div>

                  {/* Icon Name Label */}
                  {showNames && (
                    <span className="w-full text-center font-mono text-[11px] font-semibold text-foreground/80 truncate mt-1.5 group-hover:text-blue-500 transition-colors">
                      {icon.slug}
                    </span>
                  )}

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-x-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 bg-card/95 backdrop-blur-md rounded-lg p-0.5 shadow-md border border-border/80">
                    {/* Copy Clean SVG */}
                    <button
                      type="button"
                      title="Copy SVG"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (svgData) {
                          const svgCode = buildSvgString(
                            svgData,
                            size,
                            color ?? "currentColor",
                            stroke,
                            accentOpacity,
                            corners
                          )
                          copyToClipboard(svgCode, `svg-${icon.slug}`)
                        }
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {copiedKey === `svg-${icon.slug}` ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>

                    {/* Copy JSX */}
                    <button
                      type="button"
                      title="Copy JSX Component"
                      onClick={(e) => {
                        e.stopPropagation()
                        const jsxSnippet = `<${compName} size={${size}} color="${color ?? "currentColor"}" />`
                        copyToClipboard(jsxSnippet, `jsx-${icon.slug}`)
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {copiedKey === `jsx-${icon.slug}` ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Code className="size-3" />
                      )}
                    </button>

                    {/* Download SVG */}
                    <button
                      type="button"
                      title="Download SVG"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadSvg(icon.slug, activeVariant)
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Download className="size-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {filteredIcons.length > visibleCount && (
          <div className="mt-10 flex justify-center pb-8">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 96)}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 font-mono text-xs font-bold text-foreground shadow-xs hover:bg-muted hover:border-blue-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Load More Glyphs (+96)</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {(filteredIcons.length - visibleCount).toLocaleString()} remaining
              </span>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. MODAL INSPECTOR & STUDIO SPECIMEN VIEWER                               */}
      {/* ========================================================================= */}
      {selectedIcon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedIcon(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Specular line */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/60 to-transparent" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedIcon(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-border/60">
              <div className="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <ExtendedIconSvg
                  svgData={getSvg(selectedIcon.slug, activeVariant)}
                  size={32}
                  color={color ?? "currentColor"}
                  strokeWidth={stroke}
                  accentOpacity={accentOpacity}
                  corners={corners}
                />
              </div>
              <div>
                <h3 className="font-display text-xl font-extrabold uppercase tracking-wide text-foreground">
                  {selectedIcon.name}
                </h3>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground mt-0.5">
                  <span>{selectedIcon.slug}</span>
                  <span>·</span>
                  <span className="text-blue-500 font-semibold">{selectedIcon.category}</span>
                  <span>·</span>
                  <span className="uppercase text-[10px] font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 border border-blue-500/20">
                    {activeVariant}
                  </span>
                  {corners === "sharp" && (
                    <span className="uppercase text-[10px] font-bold rounded bg-blue-600 text-white px-1.5 py-0.2">
                      Sharp
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 6 Styles Comparison Strip */}
            <div className="my-5">
              <p className="font-mono text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-500" />
                Select Variant:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {VARIANTS.map((v) => {
                  const sData = getSvg(selectedIcon.slug, v.id)
                  const isCur = activeVariant === v.id

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariant(v.id)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all select-none cursor-pointer",
                        isCur
                          ? "border-blue-500 bg-blue-500/10 shadow-sm scale-105"
                          : "border-border/70 hover:border-foreground/40 bg-muted/30"
                      )}
                    >
                      <div className="size-9 flex items-center justify-center mb-1">
                        <ExtendedIconSvg
                          svgData={sData}
                          size={24}
                          color={isCur ? (color ?? "#3B82F6") : "currentColor"}
                          strokeWidth={stroke}
                          accentOpacity={accentOpacity}
                          corners={corners}
                        />
                      </div>
                      <span className={cn("font-mono text-[10px] font-bold", isCur ? "text-blue-500" : "text-muted-foreground")}>
                        {v.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Code Generator & Snippets */}
            {(() => {
              const curSvgData = getSvg(selectedIcon.slug, activeVariant)
              const curCompName = toComponentName(selectedIcon.slug)
              const fullSvgCode = curSvgData
                ? buildSvgString(curSvgData, size, color ?? "currentColor", stroke, accentOpacity, corners)
                : ""

              const reactSnippet = `import { ${curCompName} } from "@/components/extended-icons/icons";

export function Example() {
  return <${curCompName} size={${size}} color="${color ?? "currentColor"}" />;
}`

              const activeCode =
                codeSnippetTab === "react"
                  ? reactSnippet
                  : codeSnippetTab === "svg"
                  ? fullSvgCode
                  : activePkgCmd

              const activeLang: "tsx" | "text" | "bash" =
                codeSnippetTab === "react"
                  ? "tsx"
                  : codeSnippetTab === "svg"
                  ? "text"
                  : "bash"

              const activeFilename =
                codeSnippetTab === "react"
                  ? `${curCompName}.tsx`
                  : codeSnippetTab === "svg"
                  ? `${selectedIcon.slug}.svg`
                  : "Terminal"

              return (
                <div className="space-y-4">
                  {/* Format Switcher Tabs with Animated Spring Pill */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/70 border border-border/50">
                      {(
                        [
                          { id: "react", label: "React (TSX)" },
                          { id: "svg", label: "Clean SVG" },
                          { id: "cli", label: "Install (CLI)" },
                        ] as const
                      ).map((tab) => {
                        const isActive = codeSnippetTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setCodeSnippetTab(tab.id)}
                            className={cn(
                              "relative px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer select-none",
                              isActive
                                ? "text-white font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                            )}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="activeCodeSnippetPill"
                                transition={SPRING_LAYOUT}
                                className="absolute inset-0 rounded-lg bg-blue-600 shadow-xs"
                              />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                      {codeSnippetTab === "react"
                        ? "Component import"
                        : codeSnippetTab === "svg"
                        ? "24×24 vector markup"
                        : "Package manager command"}
                    </span>
                  </div>

                  {/* Modern Agent-Style CodeBlock with Shiki & Spring Animation */}
                  <CodeBlock
                    code={activeCode}
                    language={activeLang}
                    filename={activeFilename}
                    status={isCodeStreaming ? "streaming" : "complete"}
                    showLineNumbers={codeSnippetTab !== "cli"}
                    maxHeight={220}
                    wrap={codeSnippetTab === "svg"}
                    onCopy={() => copyToClipboard(activeCode, `code-${codeSnippetTab}`)}
                    className="shadow-inner"
                  />

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fullSvgCode, "SVG code")}
                        className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold px-4 py-2 shadow-xs transition-all cursor-pointer"
                      >
                        {copiedKey === "SVG code" ? "Copied SVG!" : "Copy Clean SVG"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(reactSnippet, "React JSX")}
                        className="rounded-xl border border-border bg-card hover:bg-muted text-foreground font-mono text-xs font-semibold px-4 py-2 shadow-xs transition-all cursor-pointer"
                      >
                        {copiedKey === "React JSX" ? "Copied JSX!" : "Copy React Code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSvg(selectedIcon.slug, activeVariant)}
                        className="rounded-xl border border-border bg-card hover:bg-muted text-foreground font-mono text-xs font-semibold px-4 py-2 shadow-xs transition-all cursor-pointer"
                      >
                        Download .svg
                      </button>
                    </div>

                    {/* NPM manager pill */}
                    <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <div className="flex items-center rounded-lg bg-muted border border-border/60 p-0.5">
                        {PKG_MANAGERS.map((pm) => (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setSelectedPkgManager(pm.id)}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer",
                              selectedPkgManager === pm.id
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {pm.id}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activePkgCmd, "pkg-copy")}
                        className="hover:text-blue-500 font-semibold cursor-pointer ml-1"
                      >
                        {copiedKey === "pkg-copy" ? "Copied command!" : "Copy Command"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
