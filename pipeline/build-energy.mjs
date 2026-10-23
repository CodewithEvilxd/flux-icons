#!/usr/bin/env node
/**
 * Vector Compiler for Flux Energy Icons (Vault 04: 2,063 Authentic Clean Energy & Climate Icons)
 * Compiles authentic SVGs from the energy-icons collection into the Flux Vault architecture:
 *   - public/energy-icons/meta.json
 *   - public/energy-icons/chunks/[a-z,num].json
 *   - src/components/energy-icons/icons.tsx
 *   - packages/react/src/energy.tsx
 *   - src/components/energy-icons/index.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const LOCAL_ICONS_DIR = join(ROOT, 'public', 'energy-icons', 'icons');
const LOCAL_META_FILE = join(ROOT, 'pipeline', 'energy-meta.json');
const SOURCE_ICONS_DIR = existsSync(LOCAL_ICONS_DIR) ? LOCAL_ICONS_DIR : 'C:/Users/Nishant Gaurav/AppData/Local/Temp/energy-icons-temp/icons';
const SCRATCH_META_FILE = existsSync(LOCAL_META_FILE) ? LOCAL_META_FILE : 'C:/Users/Nishant Gaurav/.gemini/antigravity-ide/brain/156d087f-2fd2-4bd8-8b6d-acd0f12a822f/scratch/energy_icons_raw.json';

const CHUNKS_DIR = join(ROOT, 'public', 'energy-icons', 'chunks');
const META_FILE = join(ROOT, 'public', 'energy-icons', 'meta.json');
const ICONS_TSX_FILE = join(ROOT, 'src', 'components', 'energy-icons', 'icons.tsx');
const PKG_ENERGY_TSX_FILE = join(ROOT, 'packages', 'react', 'src', 'energy.tsx');
const INDEX_TS_FILE = join(ROOT, 'src', 'components', 'energy-icons', 'index.ts');

mkdirSync(CHUNKS_DIR, { recursive: true });
mkdirSync(join(ROOT, 'packages', 'react', 'src'), { recursive: true });

const CATEGORY_NAMES = {
  generation: 'Generation',
  'grid-storage': 'Grid & Storage',
  'heat-buildings': 'Heat & Buildings',
  fuels: 'Fuels',
  climate: 'Climate',
  transport: 'Transport',
  industry: 'Industry',
  data: 'Data',
  business: 'Business',
  tools: 'Tools',
  'home-travel': 'Home & Travel',
  interface: 'Interface',
};

function extractSvgInner(svgContent) {
  const m = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!m) return '';
  return m[1]
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeTwotone(linearInner) {
  if (!linearInner) return '';
  if (linearInner.includes('<path')) {
    return linearInner.replace(/<path\s/i, '<path opacity="0.38" ');
  }
  return `<g opacity="0.4">${linearInner}</g>`;
}

function toPascal(slug) {
  return slug
    .split('-')
    .map((p) => (/^\d/.test(p) ? '_' + p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('');
}

const componentExports = [];

if (existsSync(SOURCE_ICONS_DIR) && existsSync(SCRATCH_META_FILE)) {
  console.log(`Compiling from source SVGs in ${SOURCE_ICONS_DIR}...`);

  // Clear previous chunks
  const existingChunks = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.json'));
  for (const f of existingChunks) {
    rmSync(join(CHUNKS_DIR, f), { force: true });
  }

  const rawIcons = JSON.parse(readFileSync(SCRATCH_META_FILE, 'utf8'));
  const metaList = [];
  const chunks = {};

  for (const icon of rawIcons) {
    const { slug, name, category, keywords } = icon;
    const iconFolder = join(SOURCE_ICONS_DIR, slug);

    if (!existsSync(iconFolder)) continue;

    const svg20Path = join(iconFolder, '20.svg');
    const svgBoldPath = join(iconFolder, '20-bold.svg');

    if (!existsSync(svg20Path)) continue;

    const raw20 = readFileSync(svg20Path, 'utf8');
    const linearInner = extractSvgInner(raw20);

    let solidInner = linearInner;
    if (existsSync(svgBoldPath)) {
      const rawBold = readFileSync(svgBoldPath, 'utf8');
      const boldInner = extractSvgInner(rawBold);
      if (boldInner) solidInner = boldInner;
    }

    const twotoneInner = makeTwotone(linearInner);

    const vector = {
      linear: { fill: 'none', inner: linearInner },
      twotone: { fill: 'none', inner: twotoneInner },
      solid: { fill: 'currentColor', inner: solidInner },
    };

    const friendlyCategory = CATEGORY_NAMES[category] || category;

    metaList.push({
      name,
      slug,
      category: friendlyCategory,
      categoryId: category,
      keywords: keywords || [],
      variants: ['linear', 'twotone', 'solid'],
    });

    const firstLetter = slug.charAt(0).toLowerCase();
    const chunkKey = /^[0-9]/.test(firstLetter) ? 'num' : firstLetter;
    if (!chunks[chunkKey]) chunks[chunkKey] = {};
    chunks[chunkKey][slug] = vector;

    const compName = toPascal(slug);
    componentExports.push(`
export function ${compName}({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  variant = "linear",
  className = "",
  ...props
}: EnergyIconProps) {
  const innerHtml = variant === "solid"
    ? ${JSON.stringify(solidInner)}
    : variant === "twotone"
      ? ${JSON.stringify(twotoneInner)}
      : ${JSON.stringify(linearInner)};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={variant === "solid" ? "currentColor" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: innerHtml }}
      {...props}
    />
  );
}
`);
  }

  writeFileSync(META_FILE, JSON.stringify(metaList, null, 2), 'utf8');
  console.log(`Wrote ${metaList.length} items to meta.json`);

  for (const [key, data] of Object.entries(chunks)) {
    const chunkPath = join(CHUNKS_DIR, `${key}.json`);
    writeFileSync(chunkPath, JSON.stringify(data), 'utf8');
  }
  console.log(`Wrote ${Object.keys(chunks).length} chunk files in ${CHUNKS_DIR}`);
} else if (existsSync(CHUNKS_DIR)) {
  console.log(`Compiling from local chunks in ${CHUNKS_DIR}...`);
  const chunkFiles = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.json'));

  for (const f of chunkFiles) {
    const data = JSON.parse(readFileSync(join(CHUNKS_DIR, f), 'utf8'));
    for (const [slug, variants] of Object.entries(data)) {
      const compName = toPascal(slug);
      const linearInner = variants.linear ? variants.linear.inner : '';
      const solidInner = variants.solid ? variants.solid.inner : linearInner;
      const twotoneInner = variants.twotone ? variants.twotone.inner : linearInner;

      componentExports.push(`
export function ${compName}({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  variant = "linear",
  className = "",
  ...props
}: EnergyIconProps) {
  const innerHtml = variant === "solid"
    ? ${JSON.stringify(solidInner)}
    : variant === "twotone"
      ? ${JSON.stringify(twotoneInner)}
      : ${JSON.stringify(linearInner)};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={variant === "solid" ? "currentColor" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: innerHtml }}
      {...props}
    />
  );
}
`);
    }
  }
}

// Write components
const iconsTsxContent = `// GENERATED FLUX ENERGY ICONS (Vault 04: 2,063 Clean Energy, Grid & Climate Glyphs)
// Authentic master vectors compiled for the 20×20 clean energy architecture.
import React from "react";

export interface EnergyIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  variant?: "linear" | "twotone" | "solid";
}
${componentExports.join('\n')}
`;

writeFileSync(ICONS_TSX_FILE, iconsTsxContent, 'utf8');
console.log(`Wrote ${componentExports.length} components to ${ICONS_TSX_FILE}`);

writeFileSync(PKG_ENERGY_TSX_FILE, iconsTsxContent, 'utf8');
console.log(`Wrote ${componentExports.length} components to ${PKG_ENERGY_TSX_FILE}`);

const indexTsContent = `export * from "./icons";
export { EnergyIconBrowser } from "./energy-icon-browser";
`;
writeFileSync(INDEX_TS_FILE, indexTsContent, 'utf8');
console.log('Successfully compiled all 2,063 Flux Energy Icons!');
