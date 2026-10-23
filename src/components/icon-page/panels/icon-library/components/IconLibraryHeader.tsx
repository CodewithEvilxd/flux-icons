import { RefObject, useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Folder, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IconCategory, VaultId } from "@/lib/types";
import { VAULT_LIST, VAULTS_MAP } from "@/lib/vaults";
import { cn } from "@/lib/utils";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  selectedCategory: IconCategory;
  onCategoryChange: (category: IconCategory) => void;
  activeVault?: VaultId;
  onVaultChange?: (vault: VaultId) => void;
  categories: Array<{ value: string; label: string }>;
  totalCount: number;
}

export function IconLibraryHeader({
  searchQuery,
  setSearchQuery,
  clearSearch,
  searchInputRef,
  selectedCategory,
  onCategoryChange,
  activeVault = "keyline",
  onVaultChange,
  categories,
  totalCount,
}: HeaderProps) {
  const currentVaultInfo = VAULTS_MAP.get(activeVault) || VAULT_LIST[0];
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const folderMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
        setFolderMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col border-b border-border bg-card/40 select-none">
      {/* Folder / Vault Selector Bar */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          <Folder className="size-3 text-primary shrink-0" />
          <span>Folder</span>
        </div>

        {/* Controlled Folder Dropdown */}
        <div className="relative" ref={folderMenuRef}>
          <button
            type="button"
            onClick={() => {
              setFolderMenuOpen((prev) => !prev);
              setCategoryMenuOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98] shadow-2xs cursor-pointer"
            aria-label={`Select icon folder: currently ${currentVaultInfo.name}`}
            aria-expanded={folderMenuOpen}
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: currentVaultInfo.accentColor }}
            />
            <span className="font-medium">{currentVaultInfo.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              ({totalCount > 0 ? totalCount.toLocaleString() : currentVaultInfo.total.toLocaleString()})
            </span>
            <ChevronDown className={cn("size-3 text-muted-foreground shrink-0 opacity-60 transition-transform", folderMenuOpen && "rotate-180")} />
          </button>

          {folderMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-2xl backdrop-blur-md">
              <div className="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Icon Folders
              </div>
              {VAULT_LIST.map((vault) => {
                const isActive = activeVault === vault.id;
                return (
                  <button
                    key={vault.id}
                    type="button"
                    onClick={() => {
                      onVaultChange?.(vault.id);
                      setFolderMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                      isActive
                        ? "bg-accent font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: vault.accentColor }}
                      />
                      <div className="truncate">
                        <div className="font-medium text-foreground">{vault.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{vault.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {vault.total.toLocaleString()}
                      </span>
                      {isActive && <Check className="size-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick 1-Click Folder Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-border/60 bg-muted/20">
        {VAULT_LIST.map((vault) => {
          const isActive = activeVault === vault.id;
          const shortName =
            vault.id === "keyline"
              ? "Keyline"
              : vault.id === "extended"
              ? "Extended"
              : vault.id === "energy"
              ? "Energy"
              : "Motion";
          const shortCount =
            vault.id === "keyline"
              ? isActive && totalCount > 0
                ? String(totalCount)
                : "223"
              : vault.id === "extended"
              ? "2.2k"
              : vault.id === "energy"
              ? "2.1k"
              : "467";

          return (
            <button
              key={vault.id}
              type="button"
              onClick={() => onVaultChange?.(vault.id)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg py-1 px-1 transition-all cursor-pointer relative",
                isActive
                  ? "bg-background text-foreground shadow-xs font-semibold ring-1 ring-border"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
              title={`${vault.name} (${vault.total.toLocaleString()} icons)`}
            >
              <div className="flex items-center gap-1">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: vault.accentColor }}
                />
                <span className="text-[11px] leading-tight truncate">{shortName}</span>
              </div>
              <span className="font-mono text-[9px] text-muted-foreground leading-none mt-0.5">
                {shortCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter Row */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2.5">
        <div className="min-w-0 flex-1">
          <div className="group/search relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${currentVaultInfo.name.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-md border border-border bg-muted/20 pr-12 pl-9 text-xs font-medium text-foreground transition-[background-color,border-color,box-shadow,ring] outline-none placeholder:text-muted-foreground focus:border-brand/40 focus:bg-muted/40 focus:ring-4 focus:ring-brand/10"
              aria-label="Search icons in folder"
            />
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 px-0.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded p-1 text-muted-foreground transition-[scale,color] outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring active:scale-[0.96] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controlled Category Filter Dropdown */}
        <div className="relative flex-none" ref={categoryMenuRef}>
          <button
            type="button"
            onClick={() => {
              setCategoryMenuOpen((prev) => !prev);
              setFolderMenuOpen(false);
            }}
            className="relative flex h-9 min-w-25 items-center gap-2 rounded-md border border-border bg-muted/20 px-3 text-xs font-medium whitespace-nowrap text-foreground transition-[scale,background-color] hover:bg-muted/40 focus:outline-none active:scale-[0.96] cursor-pointer"
            aria-label={`Category filter: ${categories.find((c) => c.value === selectedCategory)?.label || "All"}`}
            aria-expanded={categoryMenuOpen}
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-primary"
            >
              <g>
                <path
                  d="M3.75 5.75C3.75 4.64543 4.64543 3.75 5.75 3.75H8.25C9.35457 3.75 10.25 4.64543 10.25 5.75V8.25C10.25 9.35457 9.35457 10.25 8.25 10.25H5.75C4.64543 10.25 3.75 9.35457 3.75 8.25V5.75Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 15.75C3.75 14.6454 4.64543 13.75 5.75 13.75H8.25C9.35457 13.75 10.25 14.6454 10.25 15.75V18.25C10.25 19.3546 9.35457 20.25 8.25 20.25H5.75C4.64543 20.25 3.75 19.3546 3.75 18.25V15.75Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.75 17C13.75 15.2051 15.2051 13.75 17 13.75C18.7949 13.75 20.25 15.2051 20.25 17C20.25 18.7949 18.7949 20.25 17 20.25C15.2051 20.25 13.75 18.7949 13.75 17Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.75 5.75C13.75 4.64543 14.6454 3.75 15.75 3.75H18.25C19.3546 3.75 20.25 4.64543 20.25 5.75V8.25C20.25 9.35457 19.3546 10.25 18.25 10.25H15.75C14.6454 10.25 13.75 9.35457 13.75 8.25V5.75Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
            <span className="truncate max-w-22.5">
              {categories.find((c) => c.value === selectedCategory)?.label || "All"}
            </span>
            <ChevronDown className={cn("ml-auto h-3.5 w-3.5 shrink-0 opacity-40 transition-transform", categoryMenuOpen && "rotate-180")} />
          </button>

          {categoryMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-2xl backdrop-blur-md">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      onCategoryChange(cat.value);
                      setCategoryMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-200",
                      isSelected
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="truncate">{cat.label}</span>
                    {isSelected && <Check className="size-3 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
