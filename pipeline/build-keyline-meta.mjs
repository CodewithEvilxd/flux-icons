#!/usr/bin/env node
/**
 * Compile public/keyline-icons/meta.json and public/keyline-icons/chunks/
 * from packages/mcp/icons.json for ultra-fast, zero-delay icon browser loading.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MCP_FILE = join(ROOT, 'packages', 'mcp', 'icons.json');
const OUT_DIR = join(ROOT, 'public', 'keyline-icons');
const CHUNKS_DIR = join(OUT_DIR, 'chunks');

if (!existsSync(CHUNKS_DIR)) {
  mkdirSync(CHUNKS_DIR, { recursive: true });
}

function toTitleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getCategory(slug) {
  const s = slug.toLowerCase();
  if (s.startsWith('arrow') || s.includes('chevron') || s.includes('move') || s.includes('expand') || s.includes('refresh') || s.includes('rotate')) {
    return 'Arrows';
  }
  if (s.startsWith('git') || s.includes('branch') || s.includes('fork') || s.includes('commit') || s.includes('merge') || s.includes('pull-request')) {
    return 'Git & Version Control';
  }
  if (s.includes('mail') || s.includes('message') || s.includes('chat') || s.includes('phone') || s.includes('send') || s.includes('bell')) {
    return 'Communication';
  }
  if (s.includes('play') || s.includes('pause') || s.includes('volume') || s.includes('music') || s.includes('audio') || s.includes('video') || s.includes('camera')) {
    return 'Media';
  }
  if (s.includes('card') || s.includes('wallet') || s.includes('dollar') || s.includes('euro') || s.includes('coin') || s.includes('bank') || s.includes('receipt') || s.includes('shopping') || s.includes('cart') || s.includes('tag')) {
    return 'Commerce & Finance';
  }
  if (s.includes('sun') || s.includes('moon') || s.includes('cloud') || s.includes('rain') || s.includes('wind') || s.includes('leaf') || s.includes('tree') || s.includes('snowflake')) {
    return 'Weather & Nature';
  }
  if (s.includes('user') || s.includes('people') || s.includes('face') || s.includes('heart') || s.includes('smile') || s.includes('frown')) {
    return 'Users & Social';
  }
  if (s.includes('file') || s.includes('folder') || s.includes('document') || s.includes('clipboard') || s.includes('archive') || s.includes('book')) {
    return 'Files & Folders';
  }
  if (s.includes('lock') || s.includes('key') || s.includes('shield') || s.includes('eye') || s.includes('password')) {
    return 'Security';
  }
  if (s.includes('cpu') || s.includes('server') || s.includes('database') || s.includes('code') || s.includes('terminal') || s.includes('wifi') || s.includes('battery') || s.includes('settings') || s.includes('sliders')) {
    return 'System & Devices';
  }
  return 'General & Interface';
}

const rawData = JSON.parse(readFileSync(MCP_FILE, 'utf8'));
const iconsMap = rawData.icons || {};

const metaList = [];
const chunks = {};

for (const [slug, styles] of Object.entries(iconsMap)) {
  const firstLetter = slug.charAt(0).toLowerCase();
  const chunkKey = /[a-z]/.test(firstLetter) ? firstLetter : 'num';

  if (!chunks[chunkKey]) chunks[chunkKey] = {};

  // Extract stroke, two-tone, duotone, fill inner SVGs
  const strokeData = styles.stroke?.body || '';
  const twoToneData = styles['two-tone']?.body || '';
  const duotoneData = styles.duotone?.body || '';
  const fillData = styles.fill?.body || '';

  chunks[chunkKey][slug] = {
    stroke: { inner: strokeData, fill: 'none' },
    'two-tone': { inner: twoToneData, fill: 'none' },
    duotone: { inner: duotoneData, fill: 'none' },
    fill: { inner: fillData, fill: 'none' },
  };

  metaList.push({
    name: toTitleCase(slug),
    slug,
    category: getCategory(slug),
    variants: ['stroke', 'two-tone', 'duotone', 'fill'],
  });
}

// Sort metadata alphabetically by name
metaList.sort((a, b) => a.name.localeCompare(b.name));

// Write chunks
for (const [chunkKey, chunkData] of Object.entries(chunks)) {
  writeFileSync(join(CHUNKS_DIR, `${chunkKey}.json`), JSON.stringify(chunkData));
}

// Write meta.json
writeFileSync(join(OUT_DIR, 'meta.json'), JSON.stringify(metaList));

console.log(`✓ Compiled Keyline Vault: ${metaList.length} icons into ${Object.keys(chunks).length} chunk files.`);
