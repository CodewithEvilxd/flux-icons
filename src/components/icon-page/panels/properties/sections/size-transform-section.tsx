"use client";

import { useCallback } from "react";
import { Link2, Link2Off } from "lucide-react";
import { Scrubber } from "@/components/ui/scrubber";
import { Button } from "@/components/ui/button";
import { CustomizationState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Section } from "../components/Section";

const QUICK_SIZES = [16, 24, 32, 48, 64, 128];

interface SizeTransformSectionProps {
  state: CustomizationState;
  onChange: (updates: Partial<CustomizationState>) => void;
}

export function SizeTransformSection({
  state,
  onChange,
}: SizeTransformSectionProps) {
  const isLocked = state.lockAspect ?? true;

  const handleWidthChange = useCallback(
    (val: number) => {
      const nextWidth = Math.max(12, Math.min(256, Math.round(val)));
      if (isLocked) {
        onChange({ width: nextWidth, height: nextWidth });
      } else {
        onChange({ width: nextWidth });
      }
    },
    [isLocked, onChange],
  );

  const handleHeightChange = useCallback(
    (val: number) => {
      const nextHeight = Math.max(12, Math.min(256, Math.round(val)));
      if (isLocked) {
        onChange({ width: nextHeight, height: nextHeight });
      } else {
        onChange({ height: nextHeight });
      }
    },
    [isLocked, onChange],
  );

  const handleQuickSize = useCallback(
    (size: number) => {
      onChange({ width: size, height: size });
    },
    [onChange],
  );

  const toggleLock = useCallback(() => {
    onChange({ lockAspect: !isLocked });
  }, [isLocked, onChange]);

  return (
    <Section title="Size & Transform">
      <div className="space-y-2.5">
        {/* Quick size presets */}
        <div className="flex items-center justify-between gap-1 rounded-md border border-border/40 bg-muted/10 p-1">
          {QUICK_SIZES.map((size) => {
            const isSelected = state.width === size && state.height === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleQuickSize(size)}
                className={cn(
                  "flex-1 rounded px-1.5 py-1 text-[10px] font-mono tabular-nums transition-all cursor-pointer",
                  isSelected
                    ? "border border-border/60 bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>

        {/* Width & Height with aspect link */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <Scrubber
              label="Width"
              value={state.width}
              onChange={handleWidthChange}
              min={12}
              max={256}
              step={1}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleLock}
            className={cn(
              "h-8 w-8 shrink-0 rounded-md border border-border/40 transition-colors",
              isLocked
                ? "bg-muted/30 text-foreground"
                : "text-muted-foreground/60 hover:text-foreground",
            )}
            title={isLocked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
            aria-label="Toggle aspect ratio lock"
          >
            {isLocked ? (
              <Link2 className="h-3.5 w-3.5 text-brand" />
            ) : (
              <Link2Off className="h-3.5 w-3.5 opacity-50" />
            )}
          </Button>

          <div className="flex-1">
            <Scrubber
              label="Height"
              value={state.height}
              onChange={handleHeightChange}
              min={12}
              max={256}
              step={1}
            />
          </div>
        </div>

        {/* Scale scrubber */}
        <Scrubber
          label="Scale"
          value={Math.round((state.scale ?? 1) * 100)}
          onChange={(val: number) => onChange({ scale: Math.max(0.2, Math.min(3, val / 100)) })}
          min={20}
          max={300}
          step={5}
        />

        {/* Padding and Corner Radius in 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          <Scrubber
            label="Radius"
            value={state.cornerRadius ?? 0}
            onChange={(val: number) => onChange({ cornerRadius: Math.max(0, Math.min(32, Math.round(val))) })}
            min={0}
            max={32}
            step={1}
          />
          <Scrubber
            label="Padding"
            value={state.padding ?? 0}
            onChange={(val: number) => onChange({ padding: Math.max(0, Math.min(40, Math.round(val))) })}
            min={0}
            max={40}
            step={1}
          />
        </div>

        {/* Translate X and Y in 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          <Scrubber
            label="Offset X"
            value={state.translateX ?? 0}
            onChange={(val: number) => onChange({ translateX: Math.round(val) })}
            min={-30}
            max={30}
            step={1}
            showCenterDivider
          />
          <Scrubber
            label="Offset Y"
            value={state.translateY ?? 0}
            onChange={(val: number) => onChange({ translateY: Math.round(val) })}
            min={-30}
            max={30}
            step={1}
            showCenterDivider
          />
        </div>

        {/* Blur scrubber */}
        <Scrubber
          label="Blur"
          value={state.blur ?? 0}
          onChange={(val: number) => onChange({ blur: Math.max(0, Math.min(50, Math.round(val))) })}
          min={0}
          max={50}
          step={1}
        />

        {/* Background color row */}
        <div className="flex h-8 items-center justify-between rounded-md border border-border/40 bg-muted/10 px-2.5 text-xs">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Background
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ backgroundColor: "transparent" })}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] uppercase font-mono transition-colors",
                !state.backgroundColor || state.backgroundColor === "transparent"
                  ? "bg-muted/40 font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Clear
            </button>
            <label className="relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border shadow-xs">
              <input
                type="color"
                value={
                  state.backgroundColor && state.backgroundColor !== "transparent"
                    ? state.backgroundColor
                    : "#ffffff"
                }
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <span
                className="h-full w-full rounded-full"
                style={{
                  backgroundColor:
                    state.backgroundColor && state.backgroundColor !== "transparent"
                      ? state.backgroundColor
                      : "transparent",
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </Section>
  );
}
