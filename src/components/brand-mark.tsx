import type { SVGProps } from "react"

import {
  BRAND_MARK,
  BRAND_MARK_PLATE_OPACITY,
  BRAND_MARK_VIEWBOX,
} from "@/lib/brand-mark"

/**
 * The site's logo mark: four shapes, one per style, a sharp stroke diamond, a
 * duotone triangle, a two-tone circle and a fill square, painted in keyline
 * blue with nothing behind it. The geometry and why
 * it is shaped this way live in `lib/brand-mark.ts`.
 *
 * Inlined rather than loaded from `public/logo/logo.svg`: it renders in the nav
 * on every page, and a request plus a paint-in for something that small is
 * worse than the markup. `next/image` does not optimise SVG anyway, and a bare
 * `<img>` trips the repo's lint.
 *
 * Size it with `className`; there is deliberately no `width`/`height` here.
 * The viewBox is the ink box, so `size-6` is 24px of shapes.
 *
 * The colour is set once, as `color` on the root, and every path paints
 * `currentColor`. It reads a custom property that falls back to the token: on
 * a `--primary` surface (the design-files button) a blue mark is blue on blue,
 * so that parent sets `--brand-mark-ink` to `--primary-foreground`, with
 * nothing threaded through the components in between. Custom properties
 * inherit into a nested `<svg>`, and an inline declaration beats every class
 * rule, which a Tailwind utility here would not. Always a token, never a
 * literal, so the mark still follows the theme.
 */
export function BrandMark({
  className,
  style,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...props}
    >
      <image href="/logo/logo.png" width="1024" height="1024" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}

/**
 * The same mark with a literal colour and a pixel size, for the OG cards.
 * Satori is not a browser: it resolves no custom property and no class, so the
 * card hands it the token's hex. The paths are written out here rather than
 * shared with `BrandMark` through a child component, because Satori does not
 * render a component nested inside an `<svg>`: the card came out with a blank
 * where the mark should be.
 */
export function BrandMarkFlat({
  size,
  color,
}: {
  size: number
  color: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={BRAND_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={BRAND_MARK.diamond}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      <path
        d={BRAND_MARK.trianglePlate}
        fill={color}
        fillOpacity={BRAND_MARK_PLATE_OPACITY}
      />
      <path
        d={BRAND_MARK.plate}
        fill={color}
        fillOpacity={BRAND_MARK_PLATE_OPACITY}
      />
      <path
        d={BRAND_MARK.ring}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={BRAND_MARK.square} fill={color} />
    </svg>
  )
}
