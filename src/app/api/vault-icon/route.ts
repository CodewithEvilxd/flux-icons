import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const keylineChunkCache = new Map<string, Record<string, Record<string, { fill: string; inner: string }>>>();
const extendedChunkCache = new Map<string, Record<string, Record<string, { fill: string; inner: string }>>>();
const energyChunkCache = new Map<string, Record<string, Record<string, { fill: string; inner: string }>>>();
let motionSourcesCache: Record<string, string> | null = null;
const genericSvgCache = new Map<string, string>();

let glassFilesMap: Map<string, string> | null = null;
let pixelatedFilesMap: Map<string, string> | null = null;

async function getGlassFile(slug: string): Promise<string | null> {
  if (!glassFilesMap) {
    glassFilesMap = new Map();
    try {
      const dir = path.join(process.cwd(), "public", "glass-icons");
      const files = await readdir(dir);
      for (const f of files) {
        if (f.endsWith(".svg")) {
          const key = f.replace(/\.svg$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
          glassFilesMap.set(key, path.join(dir, f));
        }
      }
    } catch {
      // ignore
    }
  }
  const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return glassFilesMap.get(clean) || null;
}

async function getPixelatedFile(slug: string): Promise<string | null> {
  if (!pixelatedFilesMap) {
    pixelatedFilesMap = new Map();
    try {
      const baseDir = path.join(process.cwd(), "public", "pixelated");
      const entries = await readdir(baseDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          const catDir = path.join(baseDir, ent.name);
          const files = await readdir(catDir);
          for (const f of files) {
            if (f.endsWith(".svg")) {
              const key = f.replace(/\.svg$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
              pixelatedFilesMap.set(key, path.join(catDir, f));
            }
          }
        } else if (ent.name.endsWith(".svg")) {
          const key = ent.name.replace(/\.svg$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
          pixelatedFilesMap.set(key, path.join(baseDir, ent.name));
        }
      }
    } catch {
      // ignore
    }
  }
  const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return pixelatedFilesMap.get(clean) || null;
}

function getChunkKey(slug: string): string {
  const first = slug.charAt(0).toLowerCase();
  return /^[0-9]/.test(first) ? "num" : first;
}

function normalizeVariant(variantParam: string): "normal" | "duotone" | "fill" | "pixelated" | "glass" {
  const v = variantParam.toLowerCase().trim();
  if (v === "duotone" || v === "twotone" || v === "two-tone") return "duotone";
  if (v === "fill" || v === "bold" || v === "solid" || v === "bulk") return "fill";
  if (v === "pixelated" || v === "pixel") return "pixelated";
  if (v === "glass") return "glass";
  return "normal";
}

function wrapWithGlassStyle(innerSvg: string, fill: string = "none"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${fill}">
<defs>
  <linearGradient id="flux-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="currentColor" stop-opacity="0.85"/>
    <stop offset="100%" stop-color="currentColor" stop-opacity="0.35"/>
  </linearGradient>
  <filter id="flux-glass-blur" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="0.4" result="blur"/>
    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
  </filter>
</defs>
<g filter="url(#flux-glass-blur)" fill="url(#flux-glass-grad)" stroke="url(#flux-glass-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${innerSvg}
</g>
</svg>`;
}

function wrapWithPixelatedStyle(innerSvg: string, fill: string = "none"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="crispEdges">
${innerSvg}
</svg>`;
}

function wrapChunkIcon(
  innerSvg: string,
  fill: string,
  variant: "normal" | "duotone" | "fill" | "pixelated" | "glass",
): string {
  const stroke = variant === "fill" ? "none" : "currentColor";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${fill || "none"}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${variant === "pixelated" ? ' shape-rendering="crispEdges"' : ""}>\n${innerSvg}\n</svg>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vault = searchParams.get("vault") || "keyline";
  const name = searchParams.get("name") || "";
  const rawVariant = searchParams.get("variant") || "normal";
  const variant = normalizeVariant(rawVariant);

  if (!name) {
    return new NextResponse("Icon name required", { status: 400 });
  }

  const slug = name.toLowerCase().trim();
  const cacheKey = `${vault}:${slug}:${variant}`;

  if (genericSvgCache.has(cacheKey)) {
    return new NextResponse(genericSvgCache.get(cacheKey)!, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  try {
    // 1. Direct glass file lookup if variant === "glass"
    if (variant === "glass") {
      const glassPath = await getGlassFile(slug);
      if (glassPath) {
        const svgContent = await readFile(glassPath, "utf8");
        genericSvgCache.set(cacheKey, svgContent);
        return new NextResponse(svgContent, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 2. Direct pixelated file lookup if variant === "pixelated"
    if (variant === "pixelated") {
      const pixelPath = await getPixelatedFile(slug);
      if (pixelPath) {
        const svgContent = await readFile(pixelPath, "utf8");
        genericSvgCache.set(cacheKey, svgContent);
        return new NextResponse(svgContent, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 3. Extended icons vault
    if (vault === "extended") {
      const chunkKey = getChunkKey(slug);
      let chunkData = extendedChunkCache.get(chunkKey);
      if (!chunkData) {
        const filePath = path.join(process.cwd(), "public", "extended-icons", "chunks", `${chunkKey}.json`);
        const text = await readFile(filePath, "utf8");
        chunkData = JSON.parse(text);
        extendedChunkCache.set(chunkKey, chunkData!);
      }

      const iconEntries = chunkData ? chunkData[slug] : undefined;
      if (iconEntries) {
        let styleData: { fill: string; inner: string } | undefined;
        if (variant === "duotone") {
          styleData = iconEntries["twotone"] || iconEntries["bulk"] || iconEntries["linear"];
        } else if (variant === "fill") {
          styleData = iconEntries["bold"] || iconEntries["bulk"] || iconEntries["linear"];
        } else {
          styleData = iconEntries["linear"] || iconEntries["outline"] || Object.values(iconEntries)[0];
        }

        if (styleData) {
          let svg: string;
          if (variant === "glass") {
            svg = wrapWithGlassStyle(styleData.inner, styleData.fill);
          } else if (variant === "pixelated") {
            svg = wrapWithPixelatedStyle(styleData.inner, styleData.fill);
          } else {
            svg = wrapChunkIcon(styleData.inner, styleData.fill, variant);
          }

          genericSvgCache.set(cacheKey, svg);
          return new NextResponse(svg, {
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    // 4. Energy icons vault
    if (vault === "energy") {
      const chunkKey = getChunkKey(slug);
      let chunkData = energyChunkCache.get(chunkKey);
      if (!chunkData) {
        const filePath = path.join(process.cwd(), "public", "energy-icons", "chunks", `${chunkKey}.json`);
        const text = await readFile(filePath, "utf8");
        chunkData = JSON.parse(text);
        energyChunkCache.set(chunkKey, chunkData!);
      }

      const iconEntries = chunkData ? chunkData[slug] : undefined;
      if (iconEntries) {
        let styleData: { fill: string; inner: string } | undefined;
        if (variant === "duotone") {
          styleData = iconEntries["twotone"] || iconEntries["linear"];
        } else if (variant === "fill") {
          styleData = iconEntries["solid"] || iconEntries["twotone"] || iconEntries["linear"];
        } else {
          styleData = iconEntries["linear"] || iconEntries["twotone"] || Object.values(iconEntries)[0];
        }

        if (styleData) {
          let svg: string;
          if (variant === "glass") {
            svg = wrapWithGlassStyle(styleData.inner, styleData.fill);
          } else if (variant === "pixelated") {
            svg = wrapWithPixelatedStyle(styleData.inner, styleData.fill);
          } else {
            svg = wrapChunkIcon(styleData.inner, styleData.fill, variant);
          }

          genericSvgCache.set(cacheKey, svg);
          return new NextResponse(svg, {
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    // 5. Motion icons vault
    if (vault === "motion") {
      if (!motionSourcesCache) {
        const filePath = path.join(process.cwd(), "public", "motion-icons", "sources.json");
        const text = await readFile(filePath, "utf8");
        motionSourcesCache = JSON.parse(text);
      }

      const sourceCode = motionSourcesCache
        ? motionSourcesCache[slug] || motionSourcesCache[slug.replace(/-/g, "")]
        : undefined;

      if (sourceCode) {
        const svgMatch = sourceCode.match(/<(?:motion\.)?svg([^>]*)>([\s\S]*?)<\/(?:motion\.)?svg>/);
        if (svgMatch) {
          const innerContent = svgMatch[2]
            .replace(/<motion\.([a-zA-Z0-9]+)/g, "<$1")
            .replace(/<\/motion\.([a-zA-Z0-9]+)>/g, "</$1>")
            .replace(/\s+(?:animate|variants|initial|transition|custom|onMouseEnter|onMouseLeave)=\{.*?\}/g, "")
            .replace(/className=\{.*?\}/g, "")
            .replace(/strokeWidth="([0-9.]+)"/g, 'stroke-width="$1"')
            .replace(/strokeLinecap="([a-zA-Z]+)"/g, 'stroke-linecap="$1"')
            .replace(/strokeLinejoin="([a-zA-Z]+)"/g, 'stroke-linejoin="$1"')
            .replace(/fillRule="([a-zA-Z]+)"/g, 'fill-rule="$1"')
            .replace(/clipRule="([a-zA-Z]+)"/g, 'clip-rule="$1"');

          let svg: string;
          if (variant === "glass") {
            svg = wrapWithGlassStyle(innerContent.trim(), "none");
          } else if (variant === "pixelated") {
            svg = wrapWithPixelatedStyle(innerContent.trim(), "none");
          } else if (variant === "fill") {
            const filledContent = innerContent.replace(/fill="none"/g, 'fill="currentColor"');
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n${filledContent.trim()}\n</svg>`;
          } else {
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n${innerContent.trim()}\n</svg>`;
          }

          genericSvgCache.set(cacheKey, svg);
          return new NextResponse(svg, {
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    // 6. Keyline icons vault (1,000 icons via chunks or file)
    const chunkKey = getChunkKey(slug);
    let keylineChunkData = keylineChunkCache.get(chunkKey);
    if (!keylineChunkData) {
      try {
        const filePath = path.join(process.cwd(), "public", "keyline-icons", "chunks", `${chunkKey}.json`);
        const text = await readFile(filePath, "utf8");
        keylineChunkData = JSON.parse(text);
        keylineChunkCache.set(chunkKey, keylineChunkData!);
      } catch {
        // ignore
      }
    }

    const iconEntry = keylineChunkData ? keylineChunkData[slug] : undefined;
    if (iconEntry) {
      let styleData: { fill: string; inner: string } | undefined;
      if (variant === "duotone") {
        styleData = iconEntry["duotone"] || iconEntry["two-tone"] || iconEntry["stroke"];
      } else if (variant === "fill") {
        styleData = iconEntry["fill"] || iconEntry["duotone"] || iconEntry["stroke"];
      } else {
        styleData = iconEntry["stroke"] || Object.values(iconEntry)[0];
      }

      if (styleData) {
        let svg: string;
        if (variant === "glass") {
          svg = wrapWithGlassStyle(styleData.inner, styleData.fill);
        } else if (variant === "pixelated") {
          svg = wrapWithPixelatedStyle(styleData.inner, styleData.fill);
        } else {
          svg = wrapChunkIcon(styleData.inner, styleData.fill, variant);
        }

        genericSvgCache.set(cacheKey, svg);
        return new NextResponse(svg, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // Fallback: check icons/stroke/${slug}.svg, icons/duotone/${slug}.svg, or icons/fill/${slug}.svg
    const styleFolder = variant === "fill" ? "fill" : variant === "duotone" ? "duotone" : "stroke";
    const localIconPath = path.join(process.cwd(), "icons", styleFolder, `${slug}.svg`);
    try {
      const content = await readFile(localIconPath, "utf8");
      let svg = content;
      if (variant === "pixelated") {
        svg = content.replace("<svg ", '<svg shape-rendering="crispEdges" ');
      }
      genericSvgCache.set(cacheKey, svg);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // Stroke fallback
      const strokePath = path.join(process.cwd(), "icons", "stroke", `${slug}.svg`);
      try {
        const content = await readFile(strokePath, "utf8");
        genericSvgCache.set(cacheKey, content);
        return new NextResponse(content, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`;
        return new NextResponse(fallbackSvg, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }
  } catch {
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    });
  }
}
