import fs from 'node:fs';
import path from 'node:path';

const ICONS_DIR = path.resolve('src/components/motion-icons/icons');
const OUT_DIR = path.resolve('public/motion-icons');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
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
  if (s.includes('activity') || s.includes('heart') || s.includes('pulse') || s.includes('chart') || s.includes('trend') || s.includes('line')) {
    return 'draw';
  }
  if (s.includes('sparkles') || s.includes('star') || s.includes('flame') || s.includes('zap') || s.includes('award') || s.includes('check') || s.includes('plus')) {
    return 'pop';
  }
  if (s.includes('wifi') || s.includes('bluetooth') || s.includes('radio') || s.includes('signal') || s.includes('cast')) {
    return 'wave';
  }

  return 'spring';
}

async function build() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(ICONS_DIR).filter((f) => f.endsWith('.tsx') && f !== 'index.ts');
  console.log(`Found ${files.length} authentic motion icon components in ${ICONS_DIR}`);

  const metaList = [];
  const sources = {};

  for (const file of files) {
    const slug = file.replace(/\.tsx$/, '');
    const name = toTitleCase(slug);
    const componentName = `${toPascalCase(slug)}`;
    const fullPath = path.join(ICONS_DIR, file);
    const sourceCode = fs.readFileSync(fullPath, 'utf8');

    // Extract keywords from component code or file name
    const keywords = [slug, ...slug.split('-')];

    const category = getCategory(slug, keywords);
    const animationType = getAnimationType(slug, keywords);

    metaList.push({
      name,
      slug,
      componentName,
      category,
      animationType,
      keywords,
    });

    sources[slug] = sourceCode;
  }

  // Sort metaList alphabetically
  metaList.sort((a, b) => a.slug.localeCompare(b.slug));

  console.log(`Writing ${metaList.length} items to ${OUT_DIR}...`);

  fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(metaList, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'sources.json'), JSON.stringify(sources));

  console.log('Successfully generated public/motion-icons/meta.json and sources.json!');
}

build();
