"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import { toast } from "sonner";

import { IconLibraryPanel } from "@/components/icon-page/panels/icon-library";
import { ToolRail } from "@/components/icon-page/panels/outline";
import { PropertiesPanel } from "@/components/icon-page/panels/properties";
import { useConfigPersistence } from "@/components/icon-page/panels/properties/hooks/use-config-persistence";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { useWorkspaceState } from "@/hooks/use-workspace-state";
import { getIconDataById, getIconsForType, resolveLibraryIconType, type StateIconType } from "@/lib/rune-icons/icons";
import { fetchSvgInnerContentRaw, generateStandaloneSvg } from "@/lib/svg-export-utils";
import type { IconCategory, IconData, VaultId } from "@/lib/types";
import { fetchVaultIcons } from "@/lib/vaults";

import { WorkspaceActionBar } from "./components/WorkspaceActionBar";
import { useWorkspaceSelection } from "./hooks/use-workspace-selection";
import { WorkspacePanel } from "./WorkspacePanel";

const CATEGORIES: IconCategory[] = [
  "all",
  "action",
  "accessibility",
  "commerce",
  "communication",
  "dev",
  "feedback",
  "files",
  "hardware",
  "layout",
  "media",
  "metrics",
  "misc",
  "navigation",
  "time",
  "users",
  "weather",
  "custom",
];

const ICON_TYPES: StateIconType[] = ["normal", "duotone", "fill", "pixelated", "glass"];

/**
 * The /icons workspace: library selection, tray, preview and shortcuts. It
 * returns props for the shared side panels plus its own centre, so the
 * workspace layout can keep the panels mounted while the user changes icons.
 */
export function useIconsWorkspace(
  workspace: ReturnType<typeof useWorkspaceState>,
  active: boolean,
  activeVault: VaultId = "keyline",
  onVaultChange?: (vault: VaultId) => void,
) {
  const {
    state,
    handleChange,
    handleReset,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    hasLoadedFromStorage,
  } = workspace;

  const {
    activeCategory,
    setActiveCategory,
    selectedIcon,
    setSelectedIcon,
    trayIcons,
    handleIconSelect,
    handleRemoveFromTray,
    handleRemoveById,
  } = useWorkspaceSelection(
    state.customIcons,
    resolveLibraryIconType(state.iconType),
    hasLoadedFromStorage,
  );

  const selectedIconRef = useRef(selectedIcon);
  selectedIconRef.current = selectedIcon;

  useEffect(() => {
    let cancelled = false;
    fetchVaultIcons(activeVault)
      .then((icons) => {
        if (cancelled || !icons || icons.length === 0) return;
        const current = selectedIconRef.current;
        if (!current || (current.vault || "keyline") !== activeVault) {
          handleIconSelect(icons[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load vault icons for selection:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [activeVault, handleIconSelect]);

  const handleIconSelectWithTypeSync = useCallback(
    (icon: IconData) => {
      if (icon.category === "custom") {
        if (state.iconType !== "normal") {
          handleChange({ iconType: "normal" });
        }
        handleIconSelect({ ...icon, iconType: "normal" });
        return;
      }
      if (icon.iconType && icon.iconType !== state.iconType) {
        handleChange({ iconType: icon.iconType });
      }
      handleIconSelect(icon);
    },
    [handleChange, handleIconSelect, state.iconType],
  );

  const handleTypeChange = useCallback(
    (nextType: StateIconType) => {
      const customIcon = selectedIcon
        ? state.customIcons.find((icon) => icon.id === selectedIcon.id)
        : undefined;
      if (customIcon || selectedIcon?.category === "custom") {
        if (state.iconType !== "normal") {
          handleChange({ iconType: "normal" });
        }
        if (selectedIcon) {
          handleIconSelect({
            ...selectedIcon,
            url: customIcon?.url ?? selectedIcon.url,
            iconType: "normal",
          });
        }
        return;
      }
      handleChange({ iconType: nextType });
      if (!selectedIcon) return;

      const libraryType = resolveLibraryIconType(nextType);
      const nextIcon = getIconDataById(selectedIcon.id, libraryType);
      if (nextIcon) {
        handleIconSelect(nextIcon);
      } else {
        const available = getIconsForType(libraryType);
        if (available.length > 0) {
          handleIconSelect({ ...available[0], vault: "keyline" });
        } else {
          setSelectedIcon(null);
          toast.info("That icon is not available in this style");
        }
      }
    },
    [
      handleChange,
      handleIconSelect,
      selectedIcon,
      setSelectedIcon,
      state.customIcons,
      state.iconType,
    ],
  );

  const [fetchedPathCount, setFetchedPathCount] = useState<{ url: string; count: number } | null>(
    null,
  );
  useEffect(() => {
    const url = selectedIcon?.url;
    if (!url) return;
    let cancelled = false;

    fetchSvgInnerContentRaw(url)
      .then(({ content }) => {
        if (cancelled) return;
        const count =
          content.match(/<(path|circle|rect|ellipse|line|polyline|polygon)\b/gi)?.length ?? 0;
        setFetchedPathCount({ url, count });
      })
      .catch(() => {
        if (!cancelled) setFetchedPathCount({ url, count: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIcon?.url]);
  const selectedPathCount = !selectedIcon?.url
    ? (selectedIcon?.pathCount ?? 0)
    : fetchedPathCount?.url === selectedIcon.url
      ? fetchedPathCount.count
      : 0;

  const selectedIconForPanel = useMemo(
    () => (selectedIcon ? { ...selectedIcon, pathCount: selectedPathCount } : null),
    [selectedIcon, selectedPathCount],
  );

  const [showGrid, setShowGrid] = useState(true);

  const { handleExport } = useConfigPersistence(state, handleChange);

  const handleCopySvg = useCallback(async () => {
    if (!selectedIcon) {
      toast.error("Select an icon first");
      return;
    }
    try {
      const svg = await generateStandaloneSvg(selectedIcon, state);
      await navigator.clipboard.writeText(svg);
      toast.success("SVG copied to clipboard");
    } catch {
      toast.error("Failed to copy SVG");
    }
  }, [selectedIcon, state]);

  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onCopySvg: handleCopySvg,
    onExport: handleExport,
    onReset: handleReset,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onToggleGrid: () => setShowGrid((previous) => !previous),
    onNextCategory: () => {
      const currentIndex = CATEGORIES.indexOf(activeCategory);
      setActiveCategory(CATEGORIES[(currentIndex + 1) % CATEGORIES.length]);
    },
    onPrevCategory: () => {
      const currentIndex = CATEGORIES.indexOf(activeCategory);
      setActiveCategory(CATEGORIES[(currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length]);
    },
    onNextType: () => {
      const currentIndex = ICON_TYPES.indexOf(state.iconType);
      handleTypeChange(ICON_TYPES[(currentIndex + 1) % ICON_TYPES.length]);
    },
    onPrevType: () => {
      const currentIndex = ICON_TYPES.indexOf(state.iconType);
      handleTypeChange(ICON_TYPES[(currentIndex - 1 + ICON_TYPES.length) % ICON_TYPES.length]);
    },
    onSelectTraySlot: (index) => {
      const icon = trayIcons[index];
      if (!icon) return;
      handleIconSelectWithTypeSync(icon);
      toast.success(`Selected ${icon.name}`);
    },
    trayIcons,
    canCopy: !!selectedIcon,
    enabled: active,
  });

  const toolRail: ComponentProps<typeof ToolRail> = {
    activeType: state.iconType,
    onTypeChange: handleTypeChange,
    onHelpClick: () => setShowHelp(true),
  };

  const library: ComponentProps<typeof IconLibraryPanel> = {
    onIconSelect: handleIconSelectWithTypeSync,
    selectedIconId: selectedIcon?.id ?? null,
    selectedCategory: activeCategory,
    onCategoryChange: setActiveCategory,
    customIcons: state.customIcons,
    iconType: resolveLibraryIconType(state.iconType),
    customizationState: state,
    activeVault,
    onVaultChange,
  };

  const properties: ComponentProps<typeof PropertiesPanel> = {
    state,
    selectedIcon: selectedIconForPanel,
    onIconSelect: handleIconSelectWithTypeSync,
    onDeleteIcon: handleRemoveById,
    onChange: handleChange,
    onReset: handleReset,
  };

  const center = (
    <WorkspacePanel
      state={state}
      trayIcons={trayIcons}
      selectedIcon={selectedIcon}
      onSelectIcon={handleIconSelectWithTypeSync}
      onRemoveFromTray={handleRemoveFromTray}
      onReset={handleReset}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={canUndo}
      canRedo={canRedo}
      onChange={handleChange}
      showGrid={showGrid}
      onGridToggle={() => setShowGrid((previous) => !previous)}
    />
  );

  // Below lg there is no preview: the library fills the screen with an
  // export-only action bar over it.
  const mobileActionBar = (
    <WorkspaceActionBar
      exportOnly
      className="absolute bottom-4 left-1/2 z-10 w-fit -translate-x-1/2"
      onReset={handleReset}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={canUndo}
      canRedo={canRedo}
      selectedIcon={selectedIcon}
      state={state}
      onChange={handleChange}
      showGrid={showGrid}
      onGridToggle={() => setShowGrid((previous) => !previous)}
    />
  );

  return { toolRail, library, properties, center, mobileActionBar, showHelp, setShowHelp };
}
