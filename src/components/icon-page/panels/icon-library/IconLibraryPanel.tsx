"use client";
import { IconLibraryPanelProps } from "./types";
import { useIconLibrary } from "./hooks/use-icon-library";
import { IconLibraryHeader } from "./components/IconLibraryHeader";
import { IconGrid } from "./components/IconGrid";
import { EmptyState } from "./components/EmptyState";

export function IconLibraryPanel({
  onIconSelect,
  selectedIconId,
  selectedCategory,
  onCategoryChange,
  customIcons = [],
  iconType,
  customizationState,
  activeVault = "keyline",
  onVaultChange,
}: IconLibraryPanelProps) {
  const {
    searchQuery,
    setSearchQuery,
    filteredIcons,
    handleIconClick,
    clearSearch,
    searchInputRef,
    categories,
    isLoadingVault,
  } = useIconLibrary(
    selectedCategory,
    iconType,
    onIconSelect,
    customIcons,
    activeVault,
    onVaultChange
  );
  const isSearching = searchQuery.length > 0;

  return (
    <div className="h-full flex flex-col bg-workspace-pattern border-r border-border relative group/panel overflow-hidden">
      <div className="absolute inset-0 bg-background/80 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <IconLibraryHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          clearSearch={clearSearch}
          searchInputRef={searchInputRef}
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {
            clearSearch();
            onCategoryChange(cat);
          }}
          activeVault={activeVault}
          onVaultChange={(vault) => {
            clearSearch();
            onCategoryChange("all");
            onVaultChange?.(vault);
          }}
          categories={categories}
          totalCount={filteredIcons.length}
        />
        <div
          className="flex-1 overflow-y-auto scrollbar-hide relative"
          role="tabpanel"
          aria-label="Assets"
        >
          {isLoadingVault && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs font-mono text-xs text-muted-foreground">
              <span className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
              <span>Loading folder icons...</span>
            </div>
          )}
          <IconGrid
            icons={filteredIcons}
            selectedIconId={selectedIconId ?? null}
            onIconClick={handleIconClick}
            isSearching={isSearching}
            iconType={iconType}
            customizationState={customizationState}
          />
          <EmptyState isVisible={!isLoadingVault && filteredIcons.length === 0} onClearSearch={clearSearch} />
        </div>
      </div>
    </div>
  );
}
