import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { IconCategory, IconData, VaultId } from "@/lib/types";
import { getIconsForType, type IconType } from "@/lib/rune-icons/icons";
import { fetchVaultIcons, extractCategoriesFromIcons, getCachedVaultIcons } from "@/lib/vaults";

export function useIconLibrary(
  selectedCategory: IconCategory,
  iconType: IconType,
  onIconSelect?: (icon: IconData) => void,
  customIcons: Array<{ id: string; name: string; url: string }> = [],
  activeVault: VaultId = "keyline",
  onVaultChange?: (vault: VaultId) => void
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [vaultIcons, setVaultIcons] = useState<IconData[]>(() => {
    const cached = getCachedVaultIcons(activeVault, iconType);
    if (cached) return cached;
    return activeVault === "keyline"
      ? getIconsForType(iconType).map((i) => ({ ...i, vault: "keyline" as VaultId }))
      : [];
  });
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedVaultIcons(activeVault, iconType);
    if (cached) {
      setVaultIcons(cached);
      setIsLoadingVault(false);
      return;
    }

    setVaultIcons([]);
    setIsLoadingVault(true);
    fetchVaultIcons(activeVault, iconType)
      .then((icons) => {
        if (!cancelled) {
          setVaultIcons(icons);
          setIsLoadingVault(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load vault icons:", err);
        if (!cancelled) setIsLoadingVault(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeVault, iconType]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 120);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allIcons = useMemo(() => [
    ...vaultIcons,
    ...customIcons.map((ci) => ({
      id: ci.id,
      name: ci.name,
      url: ci.url,
      category: "custom" as const,
      iconType: "normal" as const,
      tags: ["custom", "upload"],
      vault: activeVault,
    })),
  ], [vaultIcons, customIcons, activeVault]);

  const categories = useMemo(() => {
    return extractCategoriesFromIcons(allIcons);
  }, [allIcons]);

  const filteredIcons = useMemo(() => {
    let icons = allIcons;
    if (selectedCategory !== "all" && allIcons.some((i) => i.category === selectedCategory)) {
      icons = icons.filter((icon) => icon.category === selectedCategory);
    }
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    return icons;
  }, [allIcons, debouncedQuery, selectedCategory]);

  const handleIconClick = useCallback(
    (icon: IconData) => {
      onIconSelect?.(icon);
    },
    [onIconSelect],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredIcons,
    handleIconClick,
    clearSearch,
    searchInputRef,
    categories,
    isLoadingVault,
  };
}
