
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
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const alt = "Flux Icons: High-Precision Icon Suite for React & shadcn/ui"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const imagePath = join(process.cwd(), "public", "images", "og-banner.png")
  const imageBuffer = readFileSync(imagePath)

  return new Response(new Uint8Array(imageBuffer), {
    headers: {
      "Content-Type": "image/png",
    },
  })
}
