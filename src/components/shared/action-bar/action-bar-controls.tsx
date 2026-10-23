"use client";

import { type ComponentProps, type ReactNode, useState } from "react";

import { Check, ChevronDown, Grid3X3, Redo, RotateCcw, Undo, X } from "lucide-react";
import { AnimatePresence, motion, type Transition } from "motion/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CustomizationState } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useArmedReset } from "./use-armed-reset";

const PILL_CLASS =
  "flex items-center rounded-[10px] bg-[#1d1d1f] p-[3px] outline outline-1 outline-black/50";

const ICON_SIZES = [16, 20, 24, 28, 32, 48, 64, 96, 128];

export function ActionPill({
  layoutTransition,
  className,
  children,
}: {
  layoutTransition?: Transition;
  className?: string;
  children: ReactNode;
}) {
  if (layoutTransition) {
    return (
      <motion.div layout transition={layoutTransition} className={cn(PILL_CLASS, className)}>
        {children}
      </motion.div>
    );
  }
  return <div className={cn(PILL_CLASS, className)}>{children}</div>;
}

export function ActionMenuItem({ className, ...props }: ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus:bg-white/10 focus:text-white",
        className,
      )}
      {...props}
    />
  );
}

export interface HistoryControlsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReset?: () => void;
  layoutTransition?: Transition;
}

export function HistoryControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onReset,
  layoutTransition,
}: HistoryControlsProps) {
  const { isResetArmed, timeLeft, disarmReset, handleResetClick, handleConfirmReset } =
    useArmedReset(onReset);
  const [resetTooltipOpen, setResetTooltipOpen] = useState(false);

  return (
    <ActionPill layoutTransition={layoutTransition} className="gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onUndo}
            aria-label="Undo"
            disabled={!canUndo}
            className="flex h-9 w-9 items-center justify-center rounded-[7px] text-[#c9c9cb] transition-all hover:bg-white/5 hover:text-white active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:text-[#4f4f51]"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>
            Undo <span className="ml-1 text-[10px] opacity-50">⌘Z</span>
          </p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onRedo}
            aria-label="Redo"
            disabled={!canRedo}
            className="flex h-9 w-9 items-center justify-center rounded-[7px] text-[#c9c9cb] transition-all hover:bg-white/5 hover:text-white active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:text-[#4f4f51]"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>
            Redo <span className="ml-1 text-[10px] opacity-50">⌘Y</span>
          </p>
        </TooltipContent>
      </Tooltip>
      <div className="relative">
        <Tooltip open={!isResetArmed && resetTooltipOpen} onOpenChange={setResetTooltipOpen}>
          <TooltipTrigger asChild>
            <button
              onClick={handleResetClick}
              aria-label="Reset"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-[7px] transition-all active:translate-y-[0.5px]",
                isResetArmed
                  ? "bg-white text-black"
                  : "text-[#c9c9cb] hover:bg-white/5 hover:text-white",
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset</p>
          </TooltipContent>
        </Tooltip>
        <AnimatePresence>
          {isResetArmed && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.95 }}
              animate={{ opacity: 1, y: -80, scale: 1 }}
              exit={{ opacity: 0, y: 0, scale: 0.95 }}
              className="absolute left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-[9px] bg-[#2c2c2e] p-1 whitespace-nowrap outline outline-1 outline-white/10"
            >
              <button
                onClick={handleConfirmReset}
                className="flex h-7 items-center gap-2 rounded-[6px] bg-white px-3 text-[10px] font-bold text-black transition-all hover:bg-white/90"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Reset</span>
                <span className="font-mono text-[9px] font-bold text-[#10b981] tabular-nums">
                  {timeLeft}s
                </span>
              </button>
              <button
                onClick={disarmReset}
                aria-label="Cancel reset"
                className="flex h-7 w-7 items-center justify-center rounded-[6px] text-white/50 transition-all hover:bg-white/5 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute -bottom-1 left-1/2 z-[-1] h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-white/10 bg-[#2c2c2e]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ActionPill>
  );
}

export interface SizeGridControlsProps {
  state?: CustomizationState;
  onChange?: (updates: Partial<CustomizationState>) => void;
  showGrid: boolean;
  onGridToggle?: () => void;
  layoutTransition?: Transition;
}

export function SizeGridControls({
  state,
  onChange,
  showGrid,
  onGridToggle,
  layoutTransition,
}: SizeGridControlsProps) {
  return (
    <ActionPill layoutTransition={layoutTransition}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex h-full min-w-[64px] items-center justify-center gap-1.5 rounded-[7px] px-2 text-[#c9c9cb] transition-all hover:bg-white/5 hover:text-white focus:outline-none">
            <span className="font-mono text-[11px] font-bold tracking-tighter">
              {state?.width}px
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="w-[85px] border-white/10 bg-[#2c2c2e] p-1 text-white"
        >
          {ICON_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus:bg-white/10 focus:text-white"
              onClick={() => onChange?.({ width: size, height: size })}
            >
              <span>{size}px</span>
              {state?.width === size && <Check className="h-2.5 w-2.5 text-white/50" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onGridToggle}
            aria-label={showGrid ? "Hide grid" : "Show grid"}
            className={cn(
              "flex h-full w-9 items-center justify-center rounded-[7px] transition-all active:translate-y-[0.5px]",
              showGrid
                ? "bg-[#1d1d1f] text-white outline outline-[1.5px] -outline-offset-[1.5px] outline-white/95"
                : "text-[#c9c9cb] hover:bg-white/5 hover:text-white",
            )}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{showGrid ? "Hide Grid" : "Show Grid"}</p>
        </TooltipContent>
      </Tooltip>
    </ActionPill>
  );
}
