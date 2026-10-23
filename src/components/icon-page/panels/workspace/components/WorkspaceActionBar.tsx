"use client";

import { Braces, ChevronDown, Download, FileCode, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import {
  ActionMenuItem,
  HistoryControls,
  SizeGridControls,
} from "@/components/shared/action-bar/action-bar-controls";
import { copyToClipboard, usePending } from "@/components/shared/action-bar/use-pending";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { downloadBlob, iconFileSlug } from "@/lib/download";
import {
  buildComponentName,
  generateJsxComponent,
  generatePng,
  generateStandaloneSvg,
  generateTsxComponent,
} from "@/lib/svg-export-utils";
import { CustomizationState, IconData } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface WorkspaceActionBarProps {
  onReset?: () => void;
  onGridToggle?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  showGrid?: boolean;
  selectedIcon?: IconData | null;
  state?: CustomizationState;
  onChange?: (updates: Partial<CustomizationState>) => void;
  className?: string;
  exportOnly?: boolean;
}
export function WorkspaceActionBar({
  onReset,
  onGridToggle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  showGrid = false,
  selectedIcon,
  state,
  onChange,
  className,
  exportOnly = false,
}: WorkspaceActionBarProps) {
  const { isPending, withPending } = usePending();
  const isAnimated = state?.motion?.enabled === true;
  const getSvgContent = async (): Promise<string> => {
    if (!selectedIcon || !state) return "";
    try {
      return await generateStandaloneSvg(selectedIcon, state);
    } catch (error) {
      console.error("Failed to generate SVG:", error);
      toast.error("Enhanced export failed. Falling back to basic copy.");
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${state.width}" height="${state.height}" viewBox="0 0 24 24" fill="none" stroke="${state.colors[0]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <use href="#${selectedIcon.id}" />
</svg>`;
    }
  };
  const downloadSvg = async () => {
    const svg = await getSvgContent();
    if (!svg) return;
    downloadBlob(
      svg,
      `${(selectedIcon && iconFileSlug(selectedIcon.name)) || "icon"}.svg`,
      "image/svg+xml",
    );
    toast.success("SVG downloaded successfully");
    if (isAnimated) {
      toast.info("Animations play when SVG is opened directly in browser or inlined in HTML", {
        duration: 5000,
      });
    }
  };
  const runExport =
    <T,>(
      generate: (icon: IconData, state: CustomizationState) => Promise<T>,
      deliver: (result: T, icon: IconData) => void | Promise<void>,
      errorMessage: string,
    ) =>
    async () => {
      if (!selectedIcon || !state) return;
      await withPending(async () => {
        try {
          await deliver(await generate(selectedIcon, state), selectedIcon);
        } catch {
          toast.error(errorMessage);
        }
      });
    };
  const getComponentFilename = (ext: string) =>
    selectedIcon ? `${buildComponentName(selectedIcon.name)}.${ext}` : `icon.${ext}`;
  const copyJsx = runExport(
    generateJsxComponent,
    (code) => copyToClipboard(code, "JSX Component"),
    "Failed to generate JSX component",
  );
  const copyTsx = runExport(
    generateTsxComponent,
    (code) => copyToClipboard(code, "TSX Component"),
    "Failed to generate TSX component",
  );
  const downloadJsx = runExport(
    generateJsxComponent,
    (code) => {
      downloadBlob(code, getComponentFilename("jsx"), "text/javascript");
      toast.success("JSX component downloaded");
    },
    "Failed to generate JSX component",
  );
  const downloadTsx = runExport(
    generateTsxComponent,
    (code) => {
      downloadBlob(code, getComponentFilename("tsx"), "text/typescript");
      toast.success("TSX component downloaded");
    },
    "Failed to generate TSX component",
  );
  const downloadPng = runExport(
    generatePng,
    (blob, icon) => {
      downloadBlob(blob, `${iconFileSlug(icon.name)}.png`);
      toast.success("PNG downloaded");
    },
    "Failed to generate PNG",
  );
  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={cn(
          "flex h-[46px] items-stretch gap-1.5 rounded-[14px] border border-black/5 p-1 dark:border-white/10",
          "bg-[#f5f5f5] dark:bg-[#1a1a1a]",
          exportOnly &&
            "border-transparent bg-transparent dark:border-transparent dark:bg-transparent",
          className,
        )}
      >
        {!exportOnly && (
          <>
            <HistoryControls
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onReset={onReset}
            />
            <SizeGridControls
              state={state}
              onChange={onChange}
              showGrid={showGrid}
              onGridToggle={onGridToggle}
            />
          </>
        )}
        <div className="flex items-center gap-1 rounded-[10px] bg-[#1d1d1f] p-[3px] outline outline-1 outline-black/50">
          <button
            disabled={isPending}
            onClick={isAnimated ? downloadJsx : downloadSvg}
            className="group relative flex h-full flex-1 items-center justify-center gap-2 overflow-hidden rounded-[7px] bg-white px-4 text-center transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full" />
            <Download className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
              {isPending ? "Exporting..." : isAnimated ? "Export JSX" : "Export SVG"}
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More export options"
                className="group flex h-full w-8 shrink-0 items-center justify-center rounded-[7px] bg-white text-black transition-all hover:bg-white/90 active:scale-[0.98] dark:bg-white dark:text-black">
                <ChevronDown className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[146px] border-white/10 bg-[#2c2c2e] p-1 text-white"
            >
              {isAnimated ? (
                <>
                  <ActionMenuItem disabled={isPending} onClick={copyJsx}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>Copy JSX Component</span>
                      <span className="font-mono text-[9px] opacity-40">JSX</span>
                    </div>
                  </ActionMenuItem>
                  <ActionMenuItem disabled={isPending} onClick={copyTsx}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>Copy TSX Component</span>
                      <span className="font-mono text-[9px] opacity-40">TSX</span>
                    </div>
                  </ActionMenuItem>
                  <ActionMenuItem
                    disabled={isPending}
                    onClick={async () => {
                      const svg = await getSvgContent();
                      if (svg) copyToClipboard(svg, "SVG (animated)");
                    }}
                  >
                    <FileCode className="h-4 w-4 text-white/40" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>Copy as SVG</span>
                      <span className="font-mono text-[9px] opacity-40">SVG</span>
                    </div>
                  </ActionMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <ActionMenuItem disabled={isPending} onClick={downloadJsx}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <span>Download as JSX</span>
                  </ActionMenuItem>
                  <ActionMenuItem disabled={isPending} onClick={downloadTsx}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <span>Download as TSX</span>
                  </ActionMenuItem>
                  <ActionMenuItem disabled={isPending} onClick={downloadSvg}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <span>Download as SVG (animated)</span>
                  </ActionMenuItem>
                </>
              ) : (
                <>
                  <ActionMenuItem
                    disabled={isPending}
                    onClick={async () => {
                      const svg = await getSvgContent();
                      if (svg) {
                        copyToClipboard(svg, "SVG");
                      } else {
                        toast.error("Select an icon first");
                      }
                    }}
                  >
                    <FileCode className="h-4 w-4 text-white/40" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>Copy as SVG</span>
                      <span className="font-mono text-[9px] opacity-40">SVG</span>
                    </div>
                  </ActionMenuItem>
                  <ActionMenuItem
                    disabled={isPending}
                    onClick={() => {
                      if (selectedIcon && state) {
                        generateJsxComponent(selectedIcon, state).then((code) =>
                          copyToClipboard(code, "React Component"),
                        );
                      }
                    }}
                  >
                    <Braces className="h-4 w-4 text-white/40" />
                    <span>Copy as React</span>
                  </ActionMenuItem>
                  <DropdownMenuSeparator className="my-0.5 bg-white/5" />
                  <ActionMenuItem disabled={isPending} onClick={downloadSvg}>
                    <Download className="h-4 w-4 text-white/40" />
                    <span>Download as SVG</span>
                  </ActionMenuItem>
                  <ActionMenuItem disabled={isPending} onClick={downloadJsx}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <span>Download as JSX</span>
                  </ActionMenuItem>
                  <ActionMenuItem disabled={isPending} onClick={downloadTsx}>
                    <FileCode className="h-4 w-4 text-white/40" />
                    <span>Download as TSX</span>
                  </ActionMenuItem>
                  <ActionMenuItem disabled={isPending} onClick={downloadPng}>
                    <ImageIcon className="h-4 w-4 text-white/40" aria-hidden="true" />
                    <span>Download as PNG</span>
                  </ActionMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
