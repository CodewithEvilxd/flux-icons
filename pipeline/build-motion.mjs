#!/usr/bin/env node
/**
 * Compile animated Framer Motion icons and metadata for the Motion Vault (467 icons).
 *
 *   node pipeline/build-motion.mjs
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ICONS_DIR = join(ROOT, 'src', 'components', 'motion-icons', 'icons');
const OUT_DIR = join(ROOT, 'public', 'motion-icons');

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

function toTitleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toPascalCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function getCategory(slug) {
  const s = slug.toLowerCase();

  if (s.includes('arrow') || s.includes('chevron') || s.includes('move') || s.includes('expand') || s.includes('shrink') || s.includes('corner') || s.includes('compass') || s.includes('navigation') || s.includes('locate') || s.includes('map')) {
    return 'Arrows & Navigation';
  }
  if (s.includes('play') || s.includes('pause') || s.includes('volume') || s.includes('music') || s.includes('audio') || s.includes('video') || s.includes('camera') || s.includes('mic') || s.includes('speaker') || s.includes('disc') || s.includes('radio') || s.includes('cast')) {
    return 'Media & Audio';
  }
  if (s.includes('mail') || s.includes('message') || s.includes('chat') || s.includes('send') || s.includes('phone') || s.includes('bell') || s.includes('at-sign') || s.includes('share') || s.includes('user') || s.includes('contact')) {
    return 'Communication & Social';
  }
  if (s.includes('cpu') || s.includes('monitor') || s.includes('smartphone') || s.includes('laptop') || s.includes('tablet') || s.includes('hard-drive') || s.includes('server') || s.includes('wifi') || s.includes('bluetooth') || s.includes('battery') || s.includes('usb') || s.includes('plug') || s.includes('power')) {
    return 'System & Devices';
  }
  if (s.includes('credit-card') || s.includes('wallet') || s.includes('dollar') || s.includes('cart') || s.includes('shopping') || s.includes('bag') || s.includes('tag') || s.includes('receipt') || s.includes('bank') || s.includes('coins') || s.includes('percent')) {
    return 'Finance & Commerce';
  }
  if (s.includes('sun') || s.includes('moon') || s.includes('cloud') || s.includes('rain') || s.includes('wind') || s.includes('thermometer') || s.includes('flame') || s.includes('leaf') || s.includes('tree') || s.includes('flower') || s.includes('umbrella') || s.includes('snowflake')) {
    return 'Weather & Nature';
  }
  if (s.includes('heart') || s.includes('activity') || s.includes('pulse') || s.includes('pill') || s.includes('cross') || s.includes('hospital') || s.includes('stethoscope') || s.includes('dna') || s.includes('virus')) {
    return 'Health & Wellness';
  }
  if (s.includes('pen') || s.includes('edit') || s.includes('brush') || s.includes('palette') || s.includes('crop') || s.includes('scissors') || s.includes('layers') || s.includes('shapes') || s.includes('blend') || s.includes('ruler')) {
    return 'Editing & Design';
  }
  if (s.includes('file') || s.includes('folder') || s.includes('document') || s.includes('clipboard') || s.includes('archive') || s.includes('book') || s.includes('notebook')) {
    return 'Files & Documents';
  }

  return 'General & UI';
}

function getAnimationType(slug) {
  const s = slug.toLowerCase();

  if (s.includes('rotate') || s.includes('refresh') || s.includes('spin') || s.includes('loader') || s.includes('settings') || s.includes('sun') || s.includes('disc') || s.includes('fan')) {
    return 'spin';
  }
  if (s.includes('bell') || s.includes('alarm') || s.includes('phone') || s.includes('vibrate') || s.includes('volume') || s.includes('alert')) {
    return 'ring';
  }
  if (s.includes('arrow') || s.includes('chevron') || s.includes('download') || s.includes('upload') || s.includes('send') || s.includes('bounce') || s.includes('jump')) {
    return 'bounce';
  }
  if (s.includes('heart') || s.includes('star') || s.includes('thumb') || s.includes('check') || s.includes('pulse') || s.includes('activity') || s.includes('zap') || s.includes('sparkle') || s.includes('fire') || s.includes('flame')) {
    return 'pulse';
  }
  if (s.includes('eye') || s.includes('lock') || s.includes('unlock') || s.includes('shield') || s.includes('folder') || s.includes('toggle') || s.includes('switch')) {
    return 'path';
  }

  return 'float';
}

async function build() {
  if (!existsSync(ICONS_DIR)) {
    console.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(ICONS_DIR).filter((f) => f.endsWith('.tsx') && !f.startsWith('index'));
  console.log(`Found ${files.length} authentic motion icon components in ${ICONS_DIR}`);

  const metaList = [];
  const sourcesMap = {};

  for (const file of files) {
    const slug = file.replace(/\.tsx$/, '');
    const componentName = toPascalCase(slug);
    const title = toTitleCase(slug);
    const category = getCategory(slug);
    const animation = getAnimationType(slug);

    const fullPath = join(ICONS_DIR, file);
    const code = readFileSync(fullPath, 'utf8');

    metaList.push({
      id: slug,
      name: componentName,
      title: title,
      category: category,
      animation: animation,
      triggers: ['hover', 'click', 'loop', 'controlled'],
      defaultTrigger: 'hover',
    });

    sourcesMap[slug] = code;
  }

  console.log(`Writing ${metaList.length} items to ${OUT_DIR}...`);

  writeFileSync(join(OUT_DIR, 'meta.json'), JSON.stringify(metaList, null, 2), 'utf8');
  writeFileSync(join(OUT_DIR, 'sources.json'), JSON.stringify(sourcesMap), 'utf8');

  console.log('Successfully generated public/motion-icons/meta.json and sources.json!');
}

build();
