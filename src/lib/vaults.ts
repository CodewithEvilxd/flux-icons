import type { IconData, VaultId } from "@/lib/types"

type IconType = "normal" | "duotone" | "fill" | "pixelated" | "glass"

export interface VaultInfo {
  id: VaultId
  name: string
  label: string
  badge: string
  total: number
  description: string
  accentColor: string
  tagClass: string
}

export const VAULT_LIST: VaultInfo[] = [
  {
    id: "keyline",
    name: "Keyline Icons",
    label: "Keyline (1,000)",
    badge: "1,000 ICONS",
    total: 1000,
    description:
      "24×24 keyline grid icons across 4 styles and 2 corner treatments",
    accentColor: "#f59e0b",
    tagClass: "ann-tag-amber",
  },
  {
    id: "extended",
    name: "Extended Icons",
    label: "Extended (2,242)",
    badge: "2,242 ICONS",
    total: 2242,
    description: "2,242 multi-style icons across 6 styles and 28 categories",
    accentColor: "#3b82f6",
    tagClass: "ann-tag-blue",
  },
  {
    id: "motion",
    name: "Motion Icons",
    label: "Motion (467)",
    badge: "467 ANIMATED",
    total: 467,
    description: "467 Framer Motion animated micro-interaction icons",
    accentColor: "#8b5cf6",
    tagClass: "ann-tag-purple",
  },
  {
    id: "energy",
    name: "Clean Energy Icons",
    label: "Clean Energy (2,063)",
    badge: "2,063 CLIMATE",
    total: 2063,
    description: "2,063 clean energy, solar, wind, storage, and climate icons",
    accentColor: "#10b981",
    tagClass: "ann-tag-green",
  },
]

export const VAULTS_MAP = new Map<VaultId, VaultInfo>(
  VAULT_LIST.map((v) => [v.id, v])
)

// In-memory cache for client sessions
const vaultIconsCache = new Map<string, IconData[]>()

export function getCachedVaultIcons(
  vaultId: VaultId,
  iconType: IconType = "normal"
): IconData[] | null {
  const cacheKey = `${vaultId}-${iconType}`
  return vaultIconsCache.get(cacheKey) || null
}

export async function fetchVaultIcons(
  vaultId: VaultId,
  iconType: IconType = "normal"
): Promise<IconData[]> {
  const cacheKey = `${vaultId}-${iconType}`
  const cached = getCachedVaultIcons(vaultId, iconType)
  if (cached) return cached

  if (vaultId === "keyline") {
    try {
      const res = await fetch("/keyline-icons/meta.json")
      if (!res.ok) throw new Error("Failed to load keyline icons meta")
      const meta = await res.json()
      const icons: IconData[] = (Array.isArray(meta) ? meta : []).map(
        (item: {
          name: string
          slug: string
          category: string
          variants: string[]
        }) => ({
          id: `key-${item.slug}`,
          name: item.name,
          category: item.category || "General & Interface",
          tags: [
            item.slug,
            (item.category || "").toLowerCase(),
            ...(item.variants || []),
          ],
          url: `/api/vault-icon?vault=keyline&name=${encodeURIComponent(item.slug)}&variant=${iconType}&v=2`,
          iconType,
          vault: "keyline" as VaultId,
        })
      )
      vaultIconsCache.set(cacheKey, icons)
      return icons
    } catch (error) {
      console.error("Error loading Keyline icons:", error)
      vaultIconsCache.set(cacheKey, [])
      return []
    }
  }

  if (vaultId === "extended") {
    try {
      const res = await fetch("/extended-icons/meta.json")
      if (!res.ok) throw new Error("Failed to load extended icons meta")
      const meta = await res.json()
      const icons: IconData[] = (Array.isArray(meta) ? meta : []).map(
        (item: {
          name: string
          slug: string
          category: string
          variants: string[]
        }) => ({
          id: `ext-${item.slug}`,
          name: item.name,
          category: item.category || "General & UI",
          tags: [
            item.slug,
            (item.category || "").toLowerCase(),
            ...(item.variants || []),
          ],
          url: `/api/vault-icon?vault=extended&name=${encodeURIComponent(item.slug)}&variant=${iconType}&v=2`,
          iconType,
          vault: "extended" as VaultId,
        })
      )
      vaultIconsCache.set(cacheKey, icons)
      return icons
    } catch (err) {
      console.error("Error loading extended icons:", err)
      return []
    }
  }

  if (vaultId === "energy") {
    try {
      const res = await fetch("/energy-icons/meta.json")
      if (!res.ok) throw new Error("Failed to load energy icons meta")
      const meta = await res.json()
      const icons: IconData[] = (Array.isArray(meta) ? meta : []).map(
        (item: {
          name: string
          slug: string
          category: string
          keywords?: string[]
        }) => ({
          id: `nrg-${item.slug}`,
          name: item.name,
          category: item.category || "Generation",
          tags: [
            item.slug,
            (item.category || "").toLowerCase(),
            ...(item.keywords || []),
          ],
          url: `/api/vault-icon?vault=energy&name=${encodeURIComponent(item.slug)}&variant=${iconType}&v=2`,
          iconType,
          vault: "energy" as VaultId,
        })
      )
      vaultIconsCache.set(cacheKey, icons)
      return icons
    } catch (err) {
      console.error("Error loading energy icons:", err)
      return []
    }
  }

  if (vaultId === "motion") {
    try {
      const res = await fetch("/motion-icons/meta.json")
      if (!res.ok) throw new Error("Failed to load motion icons meta")
      const meta = await res.json()
      const icons: IconData[] = (Array.isArray(meta) ? meta : []).map(
        (item: {
          id?: string
          slug?: string
          name?: string
          title?: string
          category?: string
          triggers?: string[]
        }) => {
          const rawId = item.id || item.slug || ""
          const name = item.title || item.name || rawId
          const category = item.category || "General"
          return {
            id: `mot-${rawId}`,
            name,
            category,
            tags: [rawId, category.toLowerCase(), ...(item.triggers || [])],
            url: `/api/vault-icon?vault=motion&name=${encodeURIComponent(rawId)}&variant=${iconType}&v=2`,
            iconType,
            vault: "motion" as VaultId,
          }
        }
      )
      vaultIconsCache.set(cacheKey, icons)
      return icons
    } catch (err) {
      console.error("Error loading motion icons:", err)
      return []
    }
  }

  return []
}

export function extractCategoriesFromIcons(
  icons: IconData[]
): Array<{ value: string; label: string }> {
  const set = new Set<string>()
  for (const icon of icons) {
    if (
      icon.category &&
      icon.category !== "all" &&
      icon.category !== "custom"
    ) {
      set.add(icon.category)
    }
  }
  const sorted = Array.from(set).sort()
  return [
    { value: "all", label: "All Categories" },
    ...sorted.map((cat) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ]
}
