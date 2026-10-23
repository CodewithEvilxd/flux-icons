"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

import { useSearchParams } from "next/navigation"

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { IconLibraryPanel } from "@/components/icon-page/panels/icon-library"
import { ToolRail } from "@/components/icon-page/panels/outline"
import { KeyboardShortcutsModal } from "@/components/icon-page/panels/outline/components/keyboard-shortcuts-modal"
import { PropertiesPanel } from "@/components/icon-page/panels/properties"
import { useIconsWorkspace } from "@/components/icon-page/panels/workspace/use-icons-workspace"
import { useWorkspaceState } from "@/hooks/use-workspace-state"
import type { VaultId } from "@/lib/types"

const DESKTOP_MEDIA = "(min-width: 64rem)"

type LayoutMode = "both" | "desktop" | "mobile"

function subscribeLayout(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_MEDIA)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function getLayoutMode(): LayoutMode {
  return window.matchMedia(DESKTOP_MEDIA).matches ? "desktop" : "mobile"
}

function getServerLayoutMode(): LayoutMode {
  return "both"
}

function isValidVault(v: string | null): v is VaultId {
  return v === "keyline" || v === "extended" || v === "motion" || v === "energy"
}

/**
 * The icon browser keeps its panels mounted together so changing styles and
 * collections does not discard the current workspace state.
 */
export function WorkspaceApp() {
  const searchParams = useSearchParams()

  const vaultParam = searchParams.get("vault")
  const [activeVault, setActiveVault] = useState<VaultId>(() => {
    return isValidVault(vaultParam) ? vaultParam : "keyline"
  })

  const handleVaultChange = useCallback((nextVault: VaultId) => {
    setActiveVault(nextVault)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("vault", nextVault)
      window.history.replaceState(null, "", url.toString())
    }
  }, [])

  const workspace = useWorkspaceState({ enableKeyboardShortcuts: false })
  const icons = useIconsWorkspace(workspace, true, activeVault, handleVaultChange)
  const layout = useSyncExternalStore(
    subscribeLayout,
    getLayoutMode,
    getServerLayoutMode
  )
  const showMobile = layout !== "desktop"
  const showDesktop = layout !== "mobile"

  return (
    <ErrorBoundary>
      {showMobile && (
          <div className="flex min-h-0 flex-1 flex-col lg:hidden">
            <div className="relative flex min-h-0 flex-1">
              <aside className="w-12 shrink-0" aria-label="Icon style">
                <ToolRail {...icons.toolRail} />
              </aside>
              <div
                className="min-w-0 flex-1 overflow-y-auto"
                aria-label="Icon library"
              >
                <IconLibraryPanel
                  {...icons.library}
                  activeVault={activeVault}
                  onVaultChange={handleVaultChange}
                />
              </div>
              {icons.mobileActionBar}
            </div>
          </div>
      )}

      {showDesktop && (
        <div className="hidden min-h-0 flex-1 overflow-x-auto overflow-y-hidden lg:flex">
          <aside
            className="relative z-[100] w-12 shrink-0"
            aria-label="Tool rail"
          >
            <ToolRail {...icons.toolRail} />
          </aside>

          <aside className="w-[320px] shrink-0" aria-label="Icon library">
            <IconLibraryPanel
              {...icons.library}
              activeVault={activeVault}
              onVaultChange={handleVaultChange}
            />
          </aside>

          <div
            className="flex min-w-0 flex-1"
          >
            {icons.center}
          </div>

          <aside
            className="bg-icon-workspace-pattern relative w-[341px] shrink-0 overflow-y-auto border-l border-border"
            aria-label="Customization controls"
          >
            <div className="pointer-events-none absolute inset-0 bg-background/80" />
            <div className="relative z-10">
              <PropertiesPanel {...icons.properties} />
            </div>
          </aside>

          <KeyboardShortcutsModal
            isOpen={icons.showHelp}
            onClose={() => icons.setShowHelp(false)}
          />
        </div>
      )}
    </ErrorBoundary>
  )
}
