"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface EnergyMetaItem {
  name: string
  slug: string
  category: string
  categoryId: string
  keywords: string[]
  variants: string[]
}

interface SvgVariant {
  fill: string
  inner: string
}

type ChunkData = Record<string, Record<string, SvgVariant>>

const chunkCache = new Map<string, ChunkData>()
const chunkPromises = new Map<string, Promise<ChunkData>>()

function getChunkKey(slug: string): string {
  const first = slug.charAt(0).toLowerCase()
  return /^[0-9]/.test(first) ? "num" : first
}

async function loadChunk(chunkKey: string): Promise<ChunkData> {
  if (chunkCache.has(chunkKey)) return chunkCache.get(chunkKey)!
  if (chunkPromises.has(chunkKey)) return chunkPromises.get(chunkKey)!

  const p = fetch(`/energy-icons/chunks/${chunkKey}.json`)
    .then((r) => {
      if (!r.ok) throw new Error("Network error")
      return r.json()
    })
    .then((data: ChunkData) => {
      chunkCache.set(chunkKey, data)
      chunkPromises.delete(chunkKey)
      return data
    })
    .catch((err) => {
      console.warn("Failed to load energy icon chunk:", chunkKey, err)
      chunkPromises.delete(chunkKey)
      return {}
    })

  chunkPromises.set(chunkKey, p)
  return p
}

function toPascal(slug: string): string {
  return slug
    .split("-")
    .map((p) => (/^\d/.test(p) ? "_" + p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("")
}

export function EnergyIconSvg({
  svgData,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  variant = "linear",
  className = "",
}: {
  svgData?: SvgVariant | null
  size?: number | string
  color?: string
  strokeWidth?: number
  variant?: "linear" | "twotone" | "solid"
  className?: string
}) {
  if (!svgData) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={variant === "solid" ? color : "none"}
      strokeWidth={strokeWidth}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: svgData.inner }}
    />
  )
}

export function EnergyIconBrowser() {
  const [metaList, setMetaList] = useState<EnergyMetaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeVariant, setActiveVariant] = useState<"linear" | "twotone" | "solid">("linear")
  const [iconSize, setIconSize] = useState(28)
  const [visibleCount, setVisibleCount] = useState(96)
  const [selectedIcon, setSelectedIcon] = useState<EnergyMetaItem | null>(null)
  const [selectedSvgData, setSelectedSvgData] = useState<Record<string, SvgVariant> | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Record<string, ChunkData>>({})

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl+K / '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === "Escape") {
        if (selectedIcon) {
          setSelectedIcon(null)
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIcon])

  // Load meta
  useEffect(() => {
    fetch("/energy-icons/meta.json")
      .then((r) => r.json())
      .then((data: EnergyMetaItem[]) => {
        setMetaList(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load energy-icons meta:", err)
        setIsLoading(false)
      })
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase())
      setVisibleCount(96)
    }, 120)
    return () => clearTimeout(t)
  }, [search])

  // Categories count
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of metaList) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1)
    }
    return map
  }, [metaList])

  const categories = useMemo(() => {
    const list = Array.from(categoryStats.entries()).map(([name, count]) => ({
      name,
      count,
      id: name,
    }))
    list.sort((a, b) => b.count - a.count)
    return [{ name: "All Energy", count: metaList.length, id: "all" }, ...list]
  }, [categoryStats, metaList.length])

  // Filtered list
  const filteredList = useMemo(() => {
    return metaList.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false
      }
      if (!debouncedSearch) return true

      return (
        item.slug.toLowerCase().includes(debouncedSearch) ||
        item.name.toLowerCase().includes(debouncedSearch) ||
        item.keywords.some((k) => k.toLowerCase().includes(debouncedSearch))
      )
    })
  }, [metaList, activeCategory, debouncedSearch])

  const visibleIcons = useMemo(() => {
    return filteredList.slice(0, visibleCount)
  }, [filteredList, visibleCount])

  // Preload chunks for visible icons
  useEffect(() => {
    const neededChunkKeys = Array.from(
      new Set(visibleIcons.map((i) => getChunkKey(i.slug)))
    )
    neededChunkKeys.forEach((key) => {
      if (!loadedChunks[key]) {
        loadChunk(key).then((data) => {
          setLoadedChunks((prev) => ({ ...prev, [key]: data }))
        })
      }
    })
  }, [visibleIcons, loadedChunks])

  const handleCloseModal = () => {
    setSelectedIcon(null)
    setSelectedSvgData(null)
  }

  // When an icon is selected, load its SVG chunk
  useEffect(() => {
    if (!selectedIcon) return

    let isSubscribed = true
    const chunkKey = getChunkKey(selectedIcon.slug)
    loadChunk(chunkKey).then((data) => {
      if (isSubscribed && data[selectedIcon.slug]) {
        setSelectedSvgData(data[selectedIcon.slug])
      }
    })

    return () => {
      isSubscribed = false
    }
  }, [selectedIcon])

  const handleCopyReact = (item: EnergyMetaItem) => {
    const compName = toPascal(item.slug)
    const code = `import { ${compName} } from "@flux-icons/react/energy"`
    navigator.clipboard.writeText(code)
    toast.success(`Copied React snippet for ${item.name}!`)
  }

  const handleCopySvg = (item: EnergyMetaItem) => {
    const chunkKey = getChunkKey(item.slug)
    const chunk = loadedChunks[chunkKey] || chunkCache.get(chunkKey)
    const data = chunk?.[item.slug]?.[activeVariant]
    if (data) {
      const fullSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="${
        activeVariant === "solid" ? "currentColor" : "none"
      }" xmlns="http://www.w3.org/2000/svg">${data.inner}</svg>`
      navigator.clipboard.writeText(fullSvg)
      toast.success(`Copied SVG for ${item.name}!`)
    } else {
      toast.error("SVG still loading...")
    }
  }

  const handleDownloadSvg = (item: EnergyMetaItem) => {
    const chunkKey = getChunkKey(item.slug)
    const chunk = loadedChunks[chunkKey] || chunkCache.get(chunkKey)
    const data = chunk?.[item.slug]?.[activeVariant]
    if (data) {
      const fullSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="${
        activeVariant === "solid" ? "currentColor" : "none"
      }" xmlns="http://www.w3.org/2000/svg">${data.inner}</svg>`
      const blob = new Blob([fullSvg], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${item.slug}-${activeVariant}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${item.slug}-${activeVariant}.svg`)
    } else {
      toast.error("SVG still loading...")
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/70 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 2,063+ clean energy, solar, wind, grid & climate icons... (Ctrl + K)"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 pl-10 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-emerald-500 dark:focus:bg-neutral-900"
          />
          <svg
            className="absolute left-3.5 top-3 size-4 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 rounded-md px-1.5 py-0.5 text-xs text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Style & Size Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Variant Switcher */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-100/80 p-1 dark:border-neutral-800 dark:bg-neutral-950">
            {(["linear", "twotone", "solid"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveVariant(v)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-semibold capitalize transition",
                  activeVariant === v
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-neutral-800 dark:text-emerald-400"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Size Slider */}
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100/80 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {iconSize}px
            </span>
            <input
              type="range"
              min="20"
              max="48"
              value={iconSize}
              onChange={(e) => setIconSize(Number(e.target.value))}
              className="h-1.5 w-20 cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Open the current collection */}
          </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const isActive =
            (c.id === "all" && activeCategory === "all") ||
            activeCategory === c.name

          return (
            <button
              key={c.name}
              onClick={() => setActiveCategory(c.id === "all" ? "all" : c.name)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
                  : "border border-neutral-200 bg-white/60 text-neutral-600 hover:border-emerald-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
              )}
            >
              <span>{c.name}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                  isActive
                    ? "bg-emerald-700 text-emerald-100 dark:bg-emerald-600"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                )}
              >
                {c.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid of Icons */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/50 dark:border-neutral-800 dark:bg-neutral-900/50"
            />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-800">
          <p className="text-base font-medium text-neutral-800 dark:text-neutral-200">
            No energy icons found matching &ldquo;{search}&rdquo;
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Try searching for solar, wind, battery, grid, hydrogen, pump, or EV.
          </p>
          <button
            onClick={() => {
              setSearch("")
              setActiveCategory("all")
            }}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {visibleIcons.map((item) => {
            const chunkKey = getChunkKey(item.slug)
            const chunk = loadedChunks[chunkKey] || chunkCache.get(chunkKey)
            const svgData = chunk?.[item.slug]?.[activeVariant]

            return (
              <div
                key={item.slug}
                onClick={() => setSelectedIcon(item)}
                className="group relative flex flex-col items-center justify-between rounded-2xl border border-neutral-200/80 bg-white/70 p-3 text-center backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5 dark:border-neutral-800/80 dark:bg-neutral-900/70 dark:hover:border-emerald-500/50 dark:hover:bg-neutral-900"
              >
                {/* SVG Canvas Area */}
                <div
                  className="flex flex-1 items-center justify-center py-2 transition group-hover:scale-110"
                  style={{ minHeight: "56px" }}
                >
                  <EnergyIconSvg
                    svgData={svgData}
                    size={iconSize}
                    variant={activeVariant}
                    className="text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  />
                </div>

                {/* Name Label */}
                <div className="w-full truncate px-1 text-[11px] font-medium text-neutral-600 transition group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100">
                  {item.name}
                </div>

                {/* Quick Action Overlay */}
                <div className="absolute right-1.5 top-1.5 flex opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyReact(item)
                    }}
                    title="Copy React import"
                    className="rounded-md bg-neutral-100 p-1 text-neutral-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                  >
                    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Infinite Scroll / Load More */}
      {visibleIcons.length < filteredList.length && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + 96)}
            className="rounded-xl border border-neutral-300 bg-white px-6 py-2.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
          >
            Load More Icons ({visibleIcons.length} of {filteredList.length})
          </button>
        </div>
      )}

      {/* Modal / Inspector Drawer */}
      {selectedIcon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <svg className="size-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header Info */}
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-inner dark:border-neutral-800 dark:bg-neutral-950">
                <EnergyIconSvg
                  svgData={selectedSvgData?.[activeVariant]}
                  size={36}
                  variant={activeVariant}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedIcon.name}
                </h3>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {selectedIcon.category}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedIcon.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Snippets */}
            <div className="mt-6 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  React Import
                </label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-950">
                  <span className="truncate text-neutral-700 dark:text-neutral-300">
                    import &#123; {toPascal(selectedIcon.slug)} &#125; from &quot;@flux-icons/react/energy&quot;
                  </span>
                  <button
                    onClick={() => handleCopyReact(selectedIcon)}
                    className="ml-2 shrink-0 rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Raw SVG (20×20 Native Master)
                </label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-950">
                  <span className="truncate text-neutral-700 dark:text-neutral-300">
                    &lt;svg width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 20 20&quot; ...&gt;
                  </span>
                  <div className="ml-2 flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleCopySvg(selectedIcon)}
                      className="rounded bg-neutral-200 px-2 py-1 text-[10px] font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      Copy SVG
                    </button>
                    <button
                      onClick={() => handleDownloadSvg(selectedIcon)}
                      className="rounded bg-neutral-200 px-2 py-1 text-[10px] font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      Download
                    </button>
                    <Link
                      href={`/energy&icon=${selectedIcon.slug}&variant=${activeVariant}`}
                      className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 flex items-center gap-1"
                    >
                      <svg className="size-3 fill-current" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span>Browse icons</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
