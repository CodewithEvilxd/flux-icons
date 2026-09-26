#!/usr/bin/env node
/**
 * public/logo/logo.svg  ->  app/icon.svg, app/favicon.ico, app/apple-icon.png
 *                       ->  public/logo/icon-192.png, public/logo/icon-512.png
 *                       ->  packages/figma-plugin/icon.png
 *
 * Every one of these is the same mark wearing different constraints, and before
 * this the app icons were three hand-made artifacts with nothing tying them to
 * the logo or to each other. Redraw the mark and they drift silently, because
 * nothing type-checks a favicon.
 *
 * The plugin icon joined them for the same reason and a sharper one: it is
 * uploaded to a Figma Community listing by hand and then lives outside this
 * repository entirely, where no check can ever reach it again.
 *
 *   node pipeline/build-brand.mjs [--check]
 *
 * --check writes nothing and exits non-zero if output would differ. It is
 * deliberately NOT in icons:ci, for the same reason icons:figma is not: it
 * needs something the CI box does not have. Rasterising needs a browser, and
 * two Chrome versions can disagree by a pixel on the same input, so in CI this
 * would fail on the renderer rather than on the mark. Run it after touching
 * the logo, not on every push.
 *
 * No dependencies, per pipeline/README.md — but rasterising a vector is the one
 * thing plain Node cannot do. Rather than take on a native image dependency for
 * three files that change once a year, this shells out to headless Chrome and
 * says exactly what to do when it cannot find one.
 */

import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { execFile } from "node:child_process"
import { inflateSync } from "node:zlib"
import { promisify } from "node:util"
import { tmpdir } from "node:os"
import { join, relative, resolve } from "node:path"

const run = promisify(execFile)

const ROOT = resolve(import.meta.dirname, "..")
const SRC = join(ROOT, "public", "logo", "logo.svg")
const APP = join(ROOT, "src", "app")
const check = process.argv.includes("--check")

const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`

/**
 * `--primary` in each theme, resolved to literals. Neither a favicon nor an
 * apple-touch-icon can read the site's theme class, so the tokens cannot come
 * along; if `--primary` ever moves, these move with it by hand.
 */
const INK = { light: "#006aa5", dark: "#76bfe4" }

/**
 * The ground under the three icons that cannot be transparent. White, so the
 * mark is the same blue shapes it is on the site rather than a knockout on a
 * blue square.
 */
const GROUND = "#ffffff"

/**
 * The logo's paths in logo.svg's order. The sharp diamond and the duotone
 * triangle are drawn for the logo and have no icon to match, so
 * they are `null` here and only checked against `lib/brand-mark.ts`. The rest
 * come from the drawings that define the styles they stand for: `shapes-2`'s
 * circle (plate, then ring) out of two-tone, its square out of fill. `readMark`
 * fails if either stops matching its icon, or the copy the site and the OG
 * cards draw from.
 */
const PARTS = [
  null,
  null,
  ["two-tone", 0, 1],
  ["two-tone", 1, 1],
  ["fill", 0, 2],
]
const MARK_TS = join(ROOT, "src", "lib", "brand-mark.ts")

/**
 * Space around the mark, in units of its own 20.5-unit ink box. A tab icon gets
 * one unit a side so the shapes do not touch the edge at 16px. The bled icons
 * get seven, a 34.5-unit canvas: the mark's farthest point, the fill square's
 * corner, sits about 13.1 from the centre, inside the 13.8 of the circle
 * Android crops a maskable icon to (80% of the width), and 20.5 of 34.5 is
 * about the share of the square an iOS glyph usually takes.
 */
const TAB_PAD = 1
const BLEED_PAD = 7

/** The .ico carries every size a browser or OS might ask it for. */
const ICO_SIZES = [16, 32, 48, 64, 128, 256]

/** What Apple asks for: iPhone @3x of a 60pt slot. */
const APPLE_SIZE = 180

/**
 * The two icons `app/manifest.ts` links, which is what makes the site
 * installable on Android. Chrome asks for both: 192 for the home screen and
 * 512 for the splash and the install dialog, and it will not offer to install
 * a site missing either.
 *
 * They land in `public/` rather than in `app/`, and that is forced rather than
 * chosen. Next's app-icon convention matches `icon` and `icon<N>` only, so a
 * file named for its size matches nothing, and a file in `app/` that matches
 * no convention is not served at all — the manifest would link a 404. `public/`
 * gives them a stable path the manifest can name. Not `public/icons/`, which
 * would sit on top of the `/icons/[name]` route.
 *
 * Bled and opaque like the apple icon, for a second reason as well as Apple's:
 * the manifest declares them `maskable`, and Android crops a maskable icon to
 * a circle 80% of the width. `BLEED_PAD` keeps the mark inside that circle,
 * which is what lets one rendering serve `any` and `maskable` both. Redraw the
 * mark with a corner farther out and they have to become two files.
 */
const MANIFEST_SIZES = [192, 512]

/**
 * The Figma plugin's Community icon, which the publish dialog asks for at
 * 128×128 and which cannot be referenced from `manifest.json`: it is uploaded
 * by hand, once, and then lives in Figma rather than in the repository.
 *
 * That is exactly why it is generated here rather than exported by hand. An
 * icon nobody can regenerate is an icon that silently stops being the mark the
 * moment the mark changes, and this one is going to sit in a Community listing
 * where nothing about the repository can reach it.
 *
 * Bled like the apple-touch-icon rather than transparent: Figma draws it on
 * both light and dark chrome, and a transparent blue mark goes weak on one of
 * them.
 */
const PLUGIN_ICON_SIZE = 128

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean)

function findChrome() {
  const hit = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (hit) return hit
  console.error(
    `${c(31, "No Chrome found.")} Rasterising needs one. Set CHROME=/path/to/chrome,\n` +
      `or install Google Chrome. Looked in:\n` +
      CHROME_CANDIDATES.map((p) => `  ${p}`).join("\n"),
  )
  process.exit(1)
}

/**
 * Pull the mark out of the source file rather than restating it here, so the
 * logo stays the one place the shape is defined. Five paths, whose painting
 * (sharp line, duotone plate, two-tone plate and ring, fill) is carried in the
 * file itself and passed through untouched; only the colour is supplied, as
 * `color` on the root.
 *
 * Each path is compared with the shipped icon it came from and with
 * `lib/brand-mark.ts`. A redraw of `shapes-2` that left the logo behind would
 * be two marks called the same thing, and nothing else would notice.
 */
async function readMark(svg) {
  const attr = (s, n) => (s.match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1]
  const tags = [...svg.matchAll(/<path\b[^>]*?\/?>/g)].map((m) => m[0])
  if (tags.length !== PARTS.length) {
    throw new Error(
      `expected ${PARTS.length} <path> elements in public/logo/logo.svg, found ${tags.length}`,
    )
  }
  const viewBox = attr(svg.match(/<svg\b([^>]*)>/)[1], "viewBox")
  const box = viewBox?.split(/\s+/).map(Number)
  if (!box || box.length !== 4 || box.some(Number.isNaN)) {
    throw new Error(`could not read viewBox from public/logo/logo.svg`)
  }
  const norm = (d) => d.replace(/\s+/g, " ").trim()
  const subpaths = (d) => norm(d).split(/(?<=Z)\s*/).filter(Boolean).map((x) => x.trim())
  const markTs = norm(await readFile(MARK_TS, "utf8"))
  for (const [i, part] of PARTS.entries()) {
    const got = norm(attr(tags[i], "d") ?? "")
    const transform = attr(tags[i], "transform")
    if (transform && !markTs.includes(transform)) {
      throw new Error(`lib/brand-mark.ts does not place path ${i + 1} at ${transform}`)
    }
    if (!part) {
      if (!markTs.includes(got)) {
        throw new Error(`lib/brand-mark.ts is missing path ${i + 1} of public/logo/logo.svg`)
      }
      continue
    }
    const [style, pathIndex, subIndex] = part
    const file = join(ROOT, "icons", style, "shapes-2.svg")
    const icon = [...(await readFile(file, "utf8")).matchAll(/<path\b[^>]*?\bd="([^"]*)"/g)]
    const want = icon[pathIndex] && subpaths(icon[pathIndex][1])[subIndex]
    if (!want || want !== got) {
      throw new Error(
        `public/logo/logo.svg path ${i + 1} no longer matches ${relative(ROOT, file)}; copy the icon's path across`,
      )
    }
    if (!markTs.includes(got)) {
      throw new Error(`lib/brand-mark.ts is missing path ${i + 1} of public/logo/logo.svg`)
    }
  }
  return { paths: tags.join(""), box }
}

/** The mark's ink box grown by `pad` units a side, as a viewBox string. */
const padded = ({ box: [x, y, w, h] }, pad) =>
  `${x - pad} ${y - pad} ${w + 2 * pad} ${h + 2 * pad}`

/**
 * The tab icon. Transparent, and swaps its blue on prefers-color-scheme, the
 * only theme signal a favicon gets.
 *
 * Note the comment below carries a warning rather than the token's name: SVG is
 * XML, a double hyphen is illegal inside an XML comment, and writing a CSS
 * custom property by name there is enough to make the file fail to parse and
 * render as a broken image in every tab.
 */
const iconSvg = (m) => `<svg width="40" height="40" viewBox="${padded(m, TAB_PAD)}" fill="none" xmlns="http://www.w3.org/2000/svg">
<!--
  GENERATED by pipeline/build-brand.mjs from public/logo/logo.svg. Do not edit.

  Careful editing this comment: SVG is parsed as XML, and a double hyphen is
  illegal inside one. Writing a CSS custom property here by name is enough to
  make the whole file fail to parse and render as a broken image.
-->
<style>
  svg { color: ${INK.light} }
  @media (prefers-color-scheme: dark) {
    svg { color: ${INK.dark} }
  }
</style>
${m.paths}
</svg>
`

/**
 * A single fixed rendering, for the formats that cannot carry two.
 *
 * Without `bleed` it is the favicon: the light blue on nothing. With it, the
 * mark sits on an opaque `GROUND` edge to edge. That is the apple-touch-icon:
 * iOS masks the icon with its own superellipse and discards alpha,
 * compositing onto black, which is why the bled version has no transparent
 * pixel anywhere.
 */
const flatSvg = (m, size, { bleed = false } = {}) => {
  const vb = padded(m, bleed ? BLEED_PAD : TAB_PAD)
  const [x, y, w, h] = vb.split(" ")
  return (
    `<svg width="${size}" height="${size}" viewBox="${vb}" fill="none" color="${INK.light}" xmlns="http://www.w3.org/2000/svg">` +
    (bleed ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${GROUND}"/>` : "") +
    m.paths +
    `</svg>`
  )
}

async function rasterize(chrome, dir, svg, size, name) {
  const src = join(dir, `${name}.svg`)
  const out = join(dir, `${name}.png`)
  await writeFile(src, svg)
  await run(chrome, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    // Transparent, so the favicon has no ground of its own. The bled icons
    // paint their own opaque ground and never rely on this.
    "--default-background-color=00000000",
    `--screenshot=${out}`,
    `--window-size=${size},${size}`,
    `file://${src}`,
  ]).catch((e) => {
    // Chrome chatters on stderr about macOS task policy even on success.
    if (!existsSync(out)) throw e
  })
  if (!existsSync(out)) throw new Error(`Chrome produced no PNG for ${name}`)
  const png = await readFile(out)
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)]
  if (w !== size || h !== size) {
    throw new Error(`${name}: expected ${size}x${size}, Chrome gave ${w}x${h}`)
  }
  return png
}

/**
 * Wrap PNGs in an ICO container. The format is a 6-byte header, then one
 * 16-byte directory entry per image, then the payloads — and a width or height
 * byte of 0 means 256, which is the only reason 256 fits in one byte.
 */
function buildIco(pngs) {
  const dirLen = 6 + 16 * pngs.length
  const head = Buffer.alloc(dirLen)
  head.writeUInt16LE(0, 0) // reserved
  head.writeUInt16LE(1, 2) // type: icon
  head.writeUInt16LE(pngs.length, 4)
  let off = dirLen
  pngs.forEach(({ size, png }, i) => {
    const o = 6 + 16 * i
    head.writeUInt8(size === 256 ? 0 : size, o)
    head.writeUInt8(size === 256 ? 0 : size, o + 1)
    head.writeUInt16LE(1, o + 4) // colour planes
    head.writeUInt16LE(32, o + 6) // bits per pixel
    head.writeUInt32LE(png.length, o + 8)
    head.writeUInt32LE(off, o + 12)
    off += png.length
  })
  return Buffer.concat([head, ...pngs.map((p) => p.png)])
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`No source mark at ${SRC}`)
    process.exit(1)
  }
  const mark = await readMark(await readFile(SRC, "utf8"))
  const chrome = findChrome()
  const dir = await mkdtemp(join(tmpdir(), "brand-"))

  let outputs
  try {
    const icoParts = []
    for (const size of ICO_SIZES) {
      icoParts.push({
        size,
        png: await rasterize(chrome, dir, flatSvg(mark, size), size, `ico-${size}`),
      })
    }
    const apple = await rasterize(
      chrome,
      dir,
      flatSvg(mark, APPLE_SIZE, { bleed: true }),
      APPLE_SIZE,
      "apple",
    )
    assertOpaque(apple)

    const pluginIcon = await rasterize(
      chrome,
      dir,
      flatSvg(mark, PLUGIN_ICON_SIZE, { bleed: true }),
      PLUGIN_ICON_SIZE,
      "plugin",
    )
    assertOpaque(pluginIcon, "figma-plugin/icon.png")

    const manifestIcons = []
    for (const size of MANIFEST_SIZES) {
      const png = await rasterize(
        chrome,
        dir,
        flatSvg(mark, size, { bleed: true }),
        size,
        `manifest-${size}`,
      )
      assertOpaque(png, `icon-${size}.png`)
      manifestIcons.push([join(ROOT, "public", "logo", `icon-${size}.png`), png])
    }

    // Full paths, because these no longer all land in app/.
    outputs = [
      [join(APP, "icon.svg"), Buffer.from(iconSvg(mark))],
      [join(APP, "favicon.ico"), buildIco(icoParts)],
      [join(APP, "apple-icon.png"), apple],
      ...manifestIcons,
      [join(ROOT, "packages", "figma-plugin", "icon.png"), pluginIcon],
    ]
  } finally {
    await rm(dir, { recursive: true, force: true })
  }

  let drift = 0
  let written = 0
  for (const [dest, next] of outputs) {
    const label = relative(ROOT, dest)
    const prev = existsSync(dest) ? await readFile(dest) : null
    if (prev && prev.equals(next)) continue
    if (check) {
      console.error(`  ${c(33, "DRIFT")} ${label}`)
      drift++
    } else {
      await writeFile(dest, next)
      console.log(`  ${c(32, "WROTE")} ${label}  (${next.length}B)`)
      written++
    }
  }

  if (check) {
    if (drift) {
      console.error(
        `\n${drift} file(s) out of sync — run: node pipeline/build-brand.mjs`,
      )
      process.exit(1)
    }
    console.log(c(32, "app icons are in sync with public/logo/logo.svg"))
    return
  }
  console.log(written ? `Wrote ${written} changed file(s).` : "Already up to date.")
}

/**
 * iOS throws the alpha channel away and composites the rest onto black, so a
 * stray transparent pixel becomes a black one. Cheaper to catch here than on a
 * home screen, so walk the decoded image rather than trusting the source.
 */
function assertOpaque(png, label = "apple-icon") {
  const { width, height, rows, channels } = decodePng(png)
  // Chrome drops the alpha channel entirely when nothing is translucent, so
  // three channels is itself the proof — there is no alpha left to be wrong.
  if (channels === 4) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (rows[y][x * 4 + 3] !== 255) {
          throw new Error(`${label} has a transparent pixel at ${x},${y}`)
        }
      }
    }
  }
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]
  for (const [x, y] of corners) {
    const hex =
      "#" +
      [0, 1, 2]
        .map((i) => rows[y][x * channels + i].toString(16).padStart(2, "0"))
        .join("")
    if (hex !== GROUND) {
      throw new Error(
        `${label} corner ${x},${y} is ${hex}, expected a full bleed of ${GROUND}`,
      )
    }
  }
}

/** Enough of a PNG reader to check pixels: inflate the IDATs, then unfilter. */
function decodePng(png) {
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  const colourType = png.readUInt8(25)
  // 2 = RGB, 6 = RGBA. Chrome picks whichever the image actually needs.
  if (colourType !== 2 && colourType !== 6) {
    throw new Error(`unsupported PNG colour type ${colourType} from Chrome`)
  }
  const bpp = colourType === 6 ? 4 : 3
  const idat = []
  for (let i = 8; i < png.length; ) {
    const len = png.readUInt32BE(i)
    const type = png.toString("ascii", i + 4, i + 8)
    if (type === "IDAT") idat.push(png.subarray(i + 8, i + 8 + len))
    i += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const rows = []
  let prev = Buffer.alloc(stride)
  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos]
    const line = Buffer.from(raw.subarray(pos + 1, pos + 1 + stride))
    pos += 1 + stride
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0
      const b = prev[x]
      const cc = x >= bpp ? prev[x - bpp] : 0
      if (filter === 1) line[x] = (line[x] + a) & 255
      else if (filter === 2) line[x] = (line[x] + b) & 255
      else if (filter === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const p = a + b - cc
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - cc)
        line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc)) & 255
      }
    }
    rows.push(line)
    prev = line
  }
  return { width, height, rows, channels: bpp }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
