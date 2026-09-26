/**
 * His redraw round of 17 Sep 2026 on the last 1.0.0 singles, kept apart from
 * build.mjs while the cctv session still edits that file.
 *   node tools/singles-1-0-0-b/build-redraws.mjs [--out=DIR] [name ...]
 *
 * type-outline  "too simple, learn how it's done": a serif T. Bar ends drop
 *               into rounded serifs, the stem stands on a rounded slab foot,
 *               and every reflex turn is r=2 so the serifs read as bracketed.
 *               Every stroke and every gap is 4 on the centre line, which is
 *               what fixes the width at 2..22 and the ink at 1..23.
 * file-type     "the same style T": file-text with its lines swapped for a T
 *               whose bar ends drop 2 on r=1 turns and whose stem has a foot.
 * file-type-corner  the same T in file-plus's bottom-right box, on its cut
 *               and notched plate.
 * mouse         his capsule (refs/mouse.svg): 12 by 18 on r=6, as he drew it
 *               (it ran to 20 for OPTICAL until 17 Sep 2026, when he asked for
 *               18 back, so the name is in SIZE_KNOWN); the wheel on whole
 *               units at 7..8, 2 clear of the body.
 * mouse-scroll-up, mouse-scroll-down  DROPPED 17 Sep 2026 on his word: a caret
 *               above leaves the mouse at most 14 tall, 4 short of `mouse`, and
 *               they read small beside it. Their block is in git history
 *               (86f6b2ba); do not redraw them unasked.
 * shredder      "one line, not rounded shape": file's own top half standing
 *               on a single line, fold where file has it, strips below.
 * case-upper    "two AA, make the second smaller": case-sensitive's A beside a
 *               small capital A on the same baseline.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Path, polyContour, add, sub, mul, unit } from '../v5/geom.mjs';
import { sharpEndIn } from '../v5/icons.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
import { run, closed, plate, inkUnion, S, M, PL, SO, DOT, doc } from './build.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const f4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const P2 = (p) => `${f4(p[0])} ${f4(p[1])}`;

const SETS = {};
const set = (name, box, build) => { build.box = box; SETS[name] = build; };

/** A house raw file as layers. */
function house(name, style, sharp) {
  const svg = readFileSync(join(ROOT, 'raw', name, `Container=regular, Style=${style}, Corners=${sharp ? 'sharp' : 'regular'}.svg`), 'utf8');
  return [...svg.matchAll(/<path ([^>]*)\/>/g)].map((m) => {
    const d = /\bd="([^"]+)"/.exec(m[1])[1];
    if (/fill-opacity="0.4"/.test(m[1])) return PL(d);
    if (/stroke-opacity="0.4"/.test(m[1])) return M(d);
    if (/stroke="black"/.test(m[1])) return S(d);
    if (/fill-rule/.test(m[1])) return SO(d);
    return DOT(d);
  });
}
/** Replace an exact run of path data inside one layer, loudly. */
function swapIn(layers, from, to, where) {
  let hit = 0;
  const out = layers.map((l) => {
    if (!l.d.includes(from)) return l;
    hit++;
    const d = l.d.replace(from, to);
    return d ? { ...l, d } : null;
  }).filter(Boolean);
  if (hit !== 1) throw new Error(`${where}: expected one layer carrying ${from}, found ${hit}`);
  return out;
}
// file's sharp duotone fold, taken to the plate's own r=1 corners so it does
// not stand 0.08 proud of the plate at (14.41, 1); the batch's file-type fix
const FOLD_SHARP = 'M13 1L14.4142 1L21 7.5858L21 9L13 9Z';
const FOLD_SHARP_ON_PLATE = 'M13 1L14 1C14.2652 1 14.5196 1.1054 14.7071 1.2929L20.7071 7.2929C20.8946 7.4804 21 7.7348 21 8L21 9L13 9Z';

/* ---------------------------------------------------------------- serif T */

/**
 * A stroked T with serifs: the bar's ends turn down and the stem stands
 * on a foot. `x0..x1` the bar, `y` its line, `drop` the serif depth below it,
 * `base` the foot's line and `half` the foot's half width.
 */
function serifT({ x0, x1, y, drop, base, half, r }, sharp, box) {
  const cx = (x0 + x1) / 2;
  const bar = run([[x0, y + drop], [x0, y], [x1, y], [x1, y + drop]], [0, r, r, 0], { sharp, free: [true, true], box });
  const stem = run([[cx, y], [cx, base]]);
  const foot = run([[cx - half, base], [cx + half, base]], [], { sharp, free: [true, true], box });
  return { d: bar.d + stem.d + foot.d, runs: [bar.segs, stem.segs, foot.segs] };
}

/* ----------------------------------------------------------- type-outline */

set('type-outline', [1, 2, 23, 22], (sharp) => {
  // bar 3..7 over 2..22, serif limbs 4 wide dropping to 11, stem 10..14, foot
  // 17..21 over 6..18; outer turns r=2 (a serif's bottom and the foot's ends
  // are half rounds), reflex turns r=2 so the serif and the foot bracket in
  const pts = [[2, 3], [22, 3], [22, 11], [18, 11], [18, 7], [14, 7], [14, 17], [18, 17], [18, 21], [6, 21], [6, 17], [10, 17], [10, 7], [6, 7], [6, 11], [2, 11]];
  const T = closed(pts, pts.map(() => 2), sharp);
  const pl = plate(T.segs);
  return { stroke: [S(T.d)], 'two-tone': [PL(pl), S(T.d)], duotone: [S(T.d)], fill: [SO(pl)] };
});

/* -------------------------------------------------------------- file-type */

const FILE_TEXT_LINES = { regular: ['M8 13H12M8 17H16', 'M8 13L12 13M8 17L16 17'], sharp: ['M7 13L13 13M7 17L17 17'] };
set('file-type', [3, 1, 21, 23], (sharp) => {
  const box = [3, 1, 21, 23];
  const t = serifT({ x0: 8, x1: 16, y: 12, drop: 2, base: 18, half: 2, r: 1 }, sharp, box);
  const k = sharp ? 'sharp' : 'regular';
  const swapLines = (layers, style) => {
    const from = FILE_TEXT_LINES[k].find((s) => layers.some((l) => l.d.includes(s)));
    if (!from) throw new Error(`file-text ${style} ${k}: lines moved`);
    return swapIn(layers, from, t.d, `file-text ${style} ${k}`);
  };
  const plateD = house('file-text', 'two-tone', sharp).find((l) => l.kind === 'plate').d;
  const foldHole = sharp ? 'M14 8L18.5858 8L14 3.4142L14 8Z' : 'M14 5C14 6.6568 15.3431 8 17 8L18.5858 8L14 3.4142L14 5Z';
  let duo = swapLines(house('file-text', 'duotone', sharp), 'duotone');
  if (sharp) duo = swapIn(duo, FOLD_SHARP, FOLD_SHARP_ON_PLATE, 'file-text duotone fold');
  return {
    stroke: swapLines(house('file-text', 'stroke', sharp), 'stroke'),
    'two-tone': swapLines(house('file-text', 'two-tone', sharp), 'two-tone'),
    duotone: duo,
    fill: [SO(plateD + inkUnion(t.runs, sharp) + foldHole)],
  };
});

/* ------------------------------------------------------- file-type-corner */

set('file-type-corner', [3, 1, 21, 23], (sharp) => {
  // file-plus's cut, notched plate and fold; the plus leaves its 14..20 x
  // 16..22 box to the T, whose serifs turn down on r=1 at 6 wide
  const box = [3, 1, 21, 23];
  const t = serifT({ x0: 14, x1: 20, y: 16, drop: 1, base: 22, half: 1, r: 1 }, sharp, box);
  const plus = sharp ? 'M17 15L17 23M13 19L21 19' : ['M17 16V22M14 19H20', 'M17 16L17 22M14 19L20 19'];
  const swapPlus = (layers, style) => {
    const from = [plus].flat().find((s) => layers.some((l) => l.d.includes(s)));
    if (!from) throw new Error(`file-plus ${style}: plus moved`);
    return swapIn(layers, from, t.d, `file-plus ${style}`);
  };
  let duo = swapPlus(house('file-plus', 'duotone', sharp), 'duotone');
  if (sharp) duo = swapIn(duo, FOLD_SHARP, FOLD_SHARP_ON_PLATE, 'file-plus duotone fold');
  return {
    stroke: swapPlus(house('file-plus', 'stroke', sharp), 'stroke'),
    'two-tone': swapPlus(house('file-plus', 'two-tone', sharp), 'two-tone'),
    duotone: duo,
    fill: swapPlus(house('file-plus', 'fill', sharp), 'fill'),
  };
});

/* ------------------------------------------------------------------ mouse */

/** A capsule of `w` by `h` centre lines from (x, y); its half rounds are shape, so sharp keeps them. */
const capsule = (x, y, w, h) => polyContour([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], [w / 2, w / 2, w / 2, w / 2]);

set('mouse', [5, 2, 19, 22], (sharp) => {
  // his capsule, 12 by 18 on r=6, painting 14 by 20; the wheel keeps his 2 of daylight
  const box = [5, 2, 19, 22];
  const body = capsule(6, 3, 12, 18);
  const wheel = run([[12, 7], [12, 8]], [], { sharp, free: [true, true], box });
  const pl = plate(body.segs);
  return {
    stroke: [S(body.d + wheel.d)],
    'two-tone': [PL(pl), S(body.d + wheel.d)],
    duotone: [PL(pl), S(wheel.d)],
    fill: [SO(pl + inkUnion([wheel.segs], sharp))],
  };
});

/* --------------------------------------------------------------- shredder */

set('shredder', [1, 1, 23, 23], (sharp) => {
  // file's own top: x 4..20, the r=4 corner, the fold 14..20 on its r=3 curl;
  // its walls stand on one line at 12 that runs 2 past them each side, and
  // four strips hang 2 below it
  const box = [1, 1, 23, 23];
  const paper = run([[4, 12], [4, 2], [14, 2], [20, 8], [20, 12]], [0, 4, 0, 0, 0], { sharp });
  const fold = run([[14, 2], [14, 8], [20, 8]], [0, 3, 0], { sharp });
  const line = run([[2, 12], [22, 12]], [], { sharp, free: [true, true], box });
  const strips = [[6, 22], [10, 20], [14, 22], [18, 20]].map(([x, y]) => run([[x, 16], [x, y]], [], { sharp, free: [true, true], box }).d).join('');
  const sheet = closed([[4, 12], [4, 2], [14, 2], [20, 8], [20, 12]], [0, 4, 0, 0, 0], sharp);
  const pl = plate(sheet.segs);
  const foldInk = sharp ? `${FOLD_SHARP_ON_PLATE}M15 4.4142L15 7L17.5858 7Z` : null;
  const foldHole = sharp ? 'M14 8L18.5858 8L14 3.4142L14 8Z' : 'M14 5C14 6.6568 15.3431 8 17 8L18.5858 8L14 3.4142L14 5Z';
  return {
    stroke: [S(paper.d + fold.d + line.d + strips)],
    'two-tone': [PL(pl), S(paper.d + fold.d + line.d + strips)],
    duotone: sharp
      ? [PL(pl), SO(foldInk), S(line.d + strips)]
      : [PL(pl), S('M20 8L14 2' + fold.d + line.d + strips)],
    fill: [SO(pl + foldHole), S(line.d + strips)],
  };
});

/* ------------------------------------------------------------- case-upper */

const A_SMALL = { apex: 9, half: 3, bar: 16 };
set('case-upper', [1, 4, 23, 20], (sharp) => {
  // case-sensitive's A, unchanged, and a small capital on the same baseline:
  // feet 16 and 22 (2 clear of the big A's foot, 1 from the canvas), apex 9,
  // crossbar 16, the most open counter the 6-unit foot span allows
  // Sharp: a butt foot on a slanted leg cannot reach the baseline and the
  // canvas wall at once, so each foot is pushed until its low corner stands on
  // 20 and the letter slides in by what its outer corner then oversteps (0.18
  // for both), the way a treatment is centred on its own ink
  const letter = (cx, apex, half, bar, wall) => {
    const top = [cx, apex], sinP = half / Math.hypot(half, 19 - apex), cosP = (19 - apex) / Math.hypot(half, 19 - apex);
    const t = sharp ? (1 - sinP) / cosP : 0;
    const outer = cx + wall * (half + t * sinP + (sharp ? cosP : 1));
    const dx = sharp ? (wall < 0 ? 1 : 23) - outer : 0;
    const foot = (side) => [cx + side * (half + t * sinP) + dx, 19 + t * cosP];
    const at = (yy, side) => cx + dx + side * (yy - apex) * (half / (19 - apex));
    return `M${P2(foot(-1))}L${P2([cx + dx, apex])}L${P2(foot(1))}` + run([[at(bar, -1), bar], [at(bar, 1), bar]]).d;
  };
  const bigA = letter(7, 5, 5, 14, -1);
  const { apex, half, bar } = A_SMALL;
  const smallA = letter(19, apex, half, bar, 1);
  return {
    stroke: [S(bigA + smallA)],
    'two-tone': [M(bigA), S(smallA)],
    duotone: [M(bigA), S(smallA)],
    fill: [S(bigA + smallA)],
  };
});

/* -------------------------------------------------------------- the write */

function inkOf(layers, sharp) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const l of layers) {
    if (!l.d) continue;
    const q = l.kind === 'stroke' || l.kind === 'muted' ? strokedBBox(l.d, 1, sharp ? 'butt' : 'round') : strokedBBox(l.d, 0, 'butt');
    b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
  }
  return b;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outArg = args.find((a) => a.startsWith('--out='));
  const OUT = outArg ? resolve(outArg.slice(6)) : ROOT;
  const want = args.filter((a) => !a.startsWith('--'));
  for (const [name, build] of Object.entries(SETS)) {
    if (want.length && !want.includes(name)) continue;
    const dir = join(OUT, 'raw', name);
    mkdirSync(dir, { recursive: true });
    const notes = [];
    for (const corners of ['regular', 'sharp']) {
      const sharp = corners === 'sharp';
      const styles = build(sharp);
      for (const style of ['stroke', 'two-tone', 'duotone', 'fill']) {
        const layers = styles[style];
        const b = inkOf(layers, sharp);
        const off = Math.max(...b.map((v, i) => Math.abs(v - build.box[i])));
        if (off > 0.003) notes.push(`${style} ${corners} ink ${b.map((v) => v.toFixed(3)).join(',')}`);
        writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${corners}.svg`), doc(layers, sharp));
      }
    }
    console.log(name.padEnd(20), 'box', build.box.join(','), notes.length ? '\n  ' + notes.join('\n  ') : 'ok');
  }
}

export { SETS };
