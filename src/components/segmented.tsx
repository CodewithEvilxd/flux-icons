"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The site's one-of-many picker: a recessed muted track, and the chosen chip
 * lifted out of it in white.
 *
 * It exists as a component because there are now three of these on the page —
 * the style group in the filter row, and the style and format groups in the
 * preview panel — and "active is white" only stays one idiom while there is one
 * definition of it.
 *
 * The 2px of padding is exactly the difference between `rounded-lg` and
 * `rounded-md`, so the chip's curve nests inside the track's.
 */
/**
 * Two heights, and the pair is the whole reason this takes a prop: 36 is the
 * filter row's, where the group sits beside sliders and menus of that height,
 * and 32 is the preview dock's, where every control was dropped a step to give
 * the panel back the room it was taking from the grid.
 */
export function Segmented({
  size = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-size={size}
      className={cn(
        "flex items-center rounded-lg bg-muted p-0.5",
        size === "sm" ? "h-8" : "h-9",
        className
      )}
      {...props}
    />
  )
}

/**
 * An option can carry a flag, and `badge` is how it says so.
 *
 * It rides the corner rather than sitting in the row: in flow it would widen
 * the chip, so the two options stop being the same width and the track grows a
 * step the moment the flag is retired. Absolute keeps the control the size it
 * was — the same reason the grid's tile badge is absolute.
 *
 * **It is `aria-hidden`, so the button is still called "Sharp".** Unlike the
 * grid's tiles a child here *would* fold into the accessible name, which is
 * exactly why this is a decision rather than a shrug: a control should be named
 * for what it does, not for how recently it arrived, and "Sharp New" is a worse
 * name than "Sharp". The news itself is on /changelog, which is the surface that
 * owes it.
 *
 * It follows `size` like everything else here: a badge sized for the 36px
 * track is half the height of the 32px one.
 *
 * The track sets no `overflow`, so the badge is free to straddle the edge, but
 * what it hangs over is worth measuring rather than assuming — each of the four
 * corner switches has a different neighbour to its right, and the preview
 * dock's is a fixed panel rather than a page.
 */
export function SegmentedItem({
  active,
  size = "default",
  badge,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  active: boolean
  size?: "default" | "sm"
  badge?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "flex items-center rounded-lg font-sans font-semibold tracking-tight transition-all",
        size === "sm" ? "h-6 px-2.5 text-xs" : "h-7 px-3 text-xs",
        active
          ? "bg-amber-500 text-black shadow-xs font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        "disabled:pointer-events-none disabled:opacity-40",
        badge && "relative",
        className
      )}
      {...props}
    >
      {children}
      {badge ? (
        <span
          aria-hidden="true"
          /* The `--primary` pair rather than a literal blue on white: the two
             invert together, so the badge stays legible in dark mode, where
             the blue lightens and its ink turns navy. */
          className={cn(
            "pointer-events-none absolute rounded-full bg-primary font-semibold text-primary-foreground",
            size === "sm"
              ? "-top-1.5 -right-2 px-1 text-[9px] leading-[1.4]"
              : "-top-2 -right-2.5 px-1.5 py-px text-[10px] leading-[1.3]"
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}
