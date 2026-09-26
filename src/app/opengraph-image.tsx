import { ImageResponse } from "next/og"

import { BrandMarkFlat } from "@/components/brand-mark"
import { loadIcons, STYLES } from "@/lib/icons"
import { SET_LICENSE, SET_TITLE } from "@/lib/site-chrome"

/**
 * The card every link to this site unfurls into.
 *
 * A file convention, not a route you link to: Next generates the PNG and emits
 * `og:image` plus its dimensions, for **this segment only**. It does not reach
 * `/demo` or `/demo/mobile`, which is why each of those carries a one-line
 * re-export of this file. Without them a shared link to a demo unfurls as a
 * title beside a blank rectangle, and nothing anywhere says so. `twitter-image`
 * exists per segment for the same reason: `opengraph-image` covers Open Graph
 * and X wants its own tag.
 *
 * Rendered by Satori, which is not a browser. Two constraints follow, and both
 * of them are throw-at-build rather than look-wrong-later:
 *
 * - **Flexbox only.** No grid. Any element with more than one child needs an
 *   explicit `display: "flex"`. Satori refuses to guess, and JSX makes that
 *   count deceptive: `{A} · {B}` is three children, on what is obviously one
 *   line of text.
 * - **No CSS variables and no Tailwind classes.** The colours below are the
 *   light theme's tokens resolved to hex: `--background` #ffffff, `--primary`
 *   #006aa5, `--primary-foreground` #fafafa, `--foreground` #0a0a0a,
 *   `--muted-foreground` #737373. The greys are Tailwind's neutral scale and
 *   the blue is the token's own sRGB value, so none of them are approximations.
 *
 * Light only, deliberately. A card is a static image; there is no viewer theme
 * to read, and every platform that renders one puts it on its own surface.
 *
 * Typography is the Satori default (Noto Sans) rather than the site's Geist.
 * Geist reaches the browser through `next/font`, which resolves at build into
 * `.next/`. There is no `.ttf` in this repo to hand Satori, and fetching one
 * at build would make the card depend on someone else's network. Hierarchy is
 * carried by size and colour instead of by weight.
 *
 * **It says what the hero says.** The card led with `SET_TITLE` at 92px over the
 * tagline, which is a business card: the brand is the one thing a reader already
 * has from the link's own domain and title, and the two-thirds of the image under
 * it went on repeating it. The headline is the page's `h1` instead, word for
 * word, in the same two inks the hero sets it in.
 *
 * That is the same rule the titles follow, one level down: the card, the `<title>`
 * and what the page visibly leads with all describe the same thing, so a reader
 * who clicks arrives at the sentence they were shown. Change the `h1` and this
 * file changes with it.
 *
 * The clause breaks onto its own line here, which the hero explicitly does not do.
 * That is a measurement rather than a second opinion: the whole sentence at a size
 * worth reading on a feed card runs about 1400px against 1040px of content width,
 * so it wraps either way, and the only choice is whether the break lands at the
 * comma or somewhere inside "shadcn/ui". Two rows put it at the comma.
 */
export const alt = `${SET_TITLE}: free icons for shadcn/ui, four styles, two corners`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INK = "#0a0a0a"
const PRIMARY = "#006aa5"
const MUTED = "#737373"
const HAIRLINE = "#e5e5e5"

export default async function Image() {
  // Same read the pages do, same reason: the count is the fact worth putting
  // on the card, and it has to come off disk or it goes stale silently.
  const total = (await loadIcons()).length

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >
      {/* The mark and the name on one line, which is the whole brand block now
            that the headline below carries the message. It is the site bar's
            arrangement at card scale, and it is where a reader looks for who is
            speaking rather than what is being said.

            Two children, so `display: flex` is stated. Satori refuses to guess,
            and this is the element the rule bites on most often. */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* The mark as `components/brand-mark.tsx` draws it: `shapes-2` in its
              three styles, on its own ink box, with nothing behind it. */}
        <BrandMarkFlat size={72} color={PRIMARY} />

        <div style={{ fontSize: 40, color: INK, letterSpacing: -1 }}>
          {SET_TITLE}
        </div>
      </div>

      {/* The page's own headline, in the page's own two inks: the claim in full
            strength, the smaller half of it in muted. Two rows rather than one
            wrapping line, for the reason the note at the top of this file gives.

            `SET_TAGLINE` used to sit under the name here and is gone from the
            card: "Built for shadcn/ui" is the headline's first clause in other
            words. */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 76, color: INK, letterSpacing: -2 }}>
          Free icons for shadcn/ui,
        </div>
        <div style={{ fontSize: 76, color: MUTED, letterSpacing: -2 }}>
          four styles, two corners
        </div>
      </div>

      {/* The specifics, on their own line above a hairline: what you get, in
            the fewest words that are still true. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          paddingTop: 32,
          borderTop: `2px solid ${HAIRLINE}`,
          fontSize: 30,
          color: INK,
        }}
      >
        <span>{`${total.toLocaleString("en-US")} free icons`}</span>
        <span style={{ color: HAIRLINE }}>|</span>
        <span style={{ color: MUTED }}>{STYLES.join(" · ")}</span>
        <span style={{ color: HAIRLINE }}>|</span>
        <span style={{ color: MUTED }}>24 × 24</span>
        <span style={{ color: HAIRLINE }}>|</span>
        <span style={{ color: MUTED }}>{SET_LICENSE}</span>
      </div>
    </div>,
    size
  )
}
