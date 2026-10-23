"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

import type { IconType } from "@/lib/rune-icons/icons";
import { getSpriteHref } from "@/lib/rune-icons/icons";
import { STROKE_STYLE_MAP } from "@/lib/stroke-style";
import { CustomizationState, IconData } from "@/lib/types";
import { cn } from "@/lib/utils";

import { IconNameTag } from "./IconNameTag";

interface IconGridProps {
  icons: IconData[];
  selectedIconId: string | null;
  onIconClick: (icon: IconData) => void;
  isSearching?: boolean;
  iconType: IconType;
  customizationState?: CustomizationState;
}

interface GridTileProps {
  icon: IconData;
  iconType: IconType;
  isSelected: boolean;
  isSearching?: boolean;
  customizationState?: CustomizationState;
  reduceMotion: boolean;
  onShowTag: (icon: IconData, index: number, el: HTMLButtonElement) => void;
  onTrackMove: (icon: IconData, el: HTMLButtonElement, x: number, y: number) => void;
  onHideTag: () => void;
  onSelect: (icon: IconData) => void;
}

const GridTile = memo(function GridTile({
  icon,
  iconType,
  isSelected,
  isSearching,
  customizationState,
  reduceMotion,
  onShowTag,
  onTrackMove,
  onHideTag,
  onSelect,
}: GridTileProps) {
  const Icon = icon.icon;

  return (
    <div className="relative w-full [contain-intrinsic-size:auto_64px] [content-visibility:auto]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      >
        <span className="absolute h-2.5 w-px bg-border" />
        <span className="absolute h-px w-2.5 bg-border" />
      </span>
      <m.button
        onClick={() => onSelect(icon)}
        onMouseEnter={(e) => onTrackMove(icon, e.currentTarget, e.clientX, e.clientY)}
        onMouseMove={(e) => onTrackMove(icon, e.currentTarget, e.clientX, e.clientY)}
        onMouseLeave={onHideTag}
        onFocus={(e) => onShowTag(icon, -1, e.currentTarget)}
        onBlur={onHideTag}
        initial="initial"
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        className={cn(
          "group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden border-r border-b border-border transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
          isSelected ? "bg-accent" : "bg-transparent hover:bg-muted focus-visible:bg-muted",
        )}
        style={
          isSelected && customizationState?.backgroundColor
            ? { backgroundColor: customizationState.backgroundColor }
            : undefined
        }
        type="button"
        aria-label={`${icon.name} icon`}
        tabIndex={0}
      >
        <div className="relative z-10 flex items-center justify-center p-3">
          {(() => {
            if (isSelected && customizationState && Icon) {
              const s = customizationState;
              const stroke = STROKE_STYLE_MAP[s.strokeStyle ?? "round"];
              const color = s.colors[0] || "currentColor";
              const fillSelected = s.iconType === "fill";
              const duotoneSelected = s.iconType === "duotone";
              return (
                <Icon
                  className="h-5 w-5"
                  strokeWidth={stroke.strokeWidth}
                  strokeLinecap={stroke.strokeLinecap}
                  strokeLinejoin={stroke.strokeLinejoin}
                  stroke={color}
                  fill={fillSelected ? color : duotoneSelected ? `${color}33` : "none"}
                  aria-hidden="true"
                />
              );
            }
            if (Icon) {
              return (
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isSearching
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              );
            }
            const effectiveType: IconType = (icon.vault === "keyline" ? iconType : (icon.iconType ?? iconType)) as IconType;

            // Glass icons: render the SVG image directly via <img> to preserve filters/masks/gradients
            if (effectiveType === "glass" || icon.id.startsWith("glass-") || (icon.url && icon.url.includes("/glass-icons/"))) {
              const glassSrc =
                icon.url && icon.url.includes("/glass-icons/")
                  ? icon.url
                  : `/glass-icons/${icon.name.replace(/\s+/g, "")}.svg`;
              return (
                <img
                  src={glassSrc}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (icon.url && el.src !== window.location.origin + icon.url) {
                      el.src = icon.url;
                    } else {
                      el.style.opacity = "0.2";
                    }
                  }}
                  className="h-5 w-5 select-none pointer-events-none object-contain transition-opacity duration-150"
                />
              );
            }

            // Other vault icons (extended, energy, motion): render via <img> with dark inversion
            if (icon.url && icon.vault && icon.vault !== "keyline") {
              return (
                <img
                  src={icon.url}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.opacity = "0.2";
                  }}
                  className="h-5 w-5 select-none pointer-events-none object-contain transition-opacity duration-150 dark:invert"
                />
              );
            }

            // The full Keyline vault is loaded from metadata and has 1,000 IDs,
            // while the generated sprite only contains the smaller app manifest.
            // Render the vault URL directly so icons outside that manifest exist too.
            const filterClass =
              effectiveType === "duotone"
                ? "invert dark:invert-0"
                : "dark:invert";

            if (icon.url) {
              return (
                <img
                  src={icon.url}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.2";
                  }}
                  className={cn(
                    "h-5 w-5 select-none pointer-events-none object-contain transition-opacity duration-150",
                    filterClass,
                  )}
                />
              );
            }

            return (
              <svg
                aria-hidden="true"
                className={cn("h-5 w-5 select-none", filterClass)}
              >
                <use href={getSpriteHref(effectiveType, icon.id)} />
              </svg>
            );
          })()}
        </div>
      </m.button>
    </div>
  );
});

interface ActiveTag {
  id: string;
  label: string;
  left?: number;
  right?: number;
  top: number;
  above: boolean;
  align: "center" | "left" | "right";
}

function IconGridInner({
  icons,
  selectedIconId,
  onIconClick,
  isSearching,
  iconType,
  customizationState,
}: IconGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeTag, setActiveTag] = useState<ActiveTag | null>(null);
  const activeTagRef = useRef<ActiveTag | null>(null);
  const tagTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 });
  const COLS = 5;
  const DWELL_MS = 280;
  const MOVE_TOLERANCE = 6;

  const measureTag = useCallback(
    (icon: IconData, el: HTMLButtonElement): ActiveTag | null => {
      const container = containerRef.current;
      if (!container) return null;
      const gridBox = container.getBoundingClientRect();
      const tileBox = el.getBoundingClientRect();
      const index = icons.findIndex((entry) => entry.id === icon.id);
      const col = index % COLS;
      const above = index >= icons.length - COLS;
      const align = col === 0 ? "left" : col === COLS - 1 ? "right" : ("center" as const);
      const tag: ActiveTag = {
        id: icon.id,
        label: icon.name,
        top: above ? tileBox.top - gridBox.top : tileBox.top - gridBox.top + tileBox.height,
        above,
        align,
      };
      if (align === "center") tag.left = tileBox.left - gridBox.left + tileBox.width / 2;
      else if (align === "left") tag.left = tileBox.left - gridBox.left + 4;
      else tag.right = gridBox.right - tileBox.right + 4;
      return tag;
    },
    [icons],
  );

  const showTag = useCallback(
    (icon: IconData, _index: number, el: HTMLButtonElement) => {
      if (tagTimer.current) clearTimeout(tagTimer.current);
      tagTimer.current = null;
      const now = performance.now();
      const still = now - lastMoveRef.current.t;
      const place = () => {
        const next = measureTag(icon, el);
        if (!next) return;
        activeTagRef.current = next;
        setActiveTag(next);
      };
      if (activeTagRef.current !== null || still >= DWELL_MS) {
        place();
        return;
      }
      tagTimer.current = setTimeout(() => {
        if (performance.now() - lastMoveRef.current.t < DWELL_MS) return;
        place();
      }, DWELL_MS - still);
    },
    [measureTag],
  );

  const trackMove = useCallback(
    (icon: IconData, el: HTMLButtonElement, x: number, y: number) => {
      const last = lastMoveRef.current;
      if (Math.hypot(x - last.x, y - last.y) > MOVE_TOLERANCE) {
        lastMoveRef.current = { x, y, t: performance.now() };
      }
      if (activeTagRef.current === null) {
        showTag(icon, -1, el);
      } else if (activeTagRef.current.id !== icon.id) {
        const next = measureTag(icon, el);
        if (next) {
          activeTagRef.current = next;
          setActiveTag(next);
        }
      }
    },
    [measureTag, showTag],
  );

  const hideTag = useCallback(() => {
    if (tagTimer.current) clearTimeout(tagTimer.current);
    tagTimer.current = null;
    tagTimer.current = setTimeout(() => {
      activeTagRef.current = null;
      setActiveTag(null);
    }, 120);
  }, []);

  useEffect(() => {
    const timer = tagTimer.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const hideNow = () => {
      if (tagTimer.current) clearTimeout(tagTimer.current);
      tagTimer.current = null;
      activeTagRef.current = null;
      setActiveTag(null);
    };
    window.addEventListener("blur", hideNow);
    window.addEventListener("resize", hideNow);
    return () => {
      window.removeEventListener("blur", hideNow);
      window.removeEventListener("resize", hideNow);
    };
  }, []);

  const [tagIcons, setTagIcons] = useState(icons);
  if (tagIcons !== icons) {
    setTagIcons(icons);
    setActiveTag(null);
  }
  useEffect(() => {
    activeTagRef.current = null;
  }, [icons]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (!active || !container.contains(active)) return;
      const buttons = Array.from(container.querySelectorAll("button"));
      const currentIndex = buttons.indexOf(active as HTMLButtonElement);
      if (currentIndex === -1) return;
      let nextIndex = -1;
      switch (e.key) {
        case "Escape":
          hideTag();
          (active as HTMLElement).blur();
          return;
        case "ArrowRight":
          nextIndex = currentIndex + 1;
          break;
        case "ArrowLeft":
          nextIndex = currentIndex - 1;
          break;
        case "ArrowDown":
          nextIndex = currentIndex + COLS;
          break;
        case "ArrowUp":
          nextIndex = currentIndex - COLS;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = buttons.length - 1;
          break;
      }
      if (nextIndex >= 0 && nextIndex < buttons.length) {
        e.preventDefault();
        buttons[nextIndex].focus();
      }
    };
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [hideTag]);

  return (
    <div
      className="grid-fade relative grid grid-cols-5 border-b border-border outline-none"
      ref={containerRef}
      tabIndex={-1}
    >
      {icons.map((icon) => (
        <GridTile
          key={icon.id}
          icon={icon}
          iconType={iconType}
          isSelected={selectedIconId === icon.id}
          isSearching={isSearching}
          customizationState={selectedIconId === icon.id ? customizationState : undefined}
          reduceMotion={reduceMotion === true}
          onShowTag={showTag}
          onTrackMove={trackMove}
          onHideTag={hideTag}
          onSelect={onIconClick}
        />
      ))}
      <AnimatePresence>
        {activeTag && (
          <IconNameTag
            label={activeTag.label}
            above={activeTag.above}
            align={activeTag.align}
            left={activeTag.left}
            right={activeTag.right}
            top={activeTag.top}
            reduceMotion={reduceMotion === true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
export const IconGrid = memo(IconGridInner);
