/**
 * Emit the banknote family into raw/ (or --out=DIR/raw).
 *   node tools/banknote/build.mjs [--out=DIR]
 *
 * Ten names, 15 Sep 2026: `banknote` and `banknote-2`, his drawings
 * (refs/banknote.svg, refs/banknote-2.svg) fitted, and each one's four signs,
 * check, minus, plus and x (`banknote-2-check`, the -2 on the base).
 *
 * banknote: a note 2..22 by 5..19 (ink 1..23 by 4..20, paddings 1 and 4), a
 * ring of r=2 on its centre, and two short ticks, (17..18, 9) and (6..7, 15).
 * banknote-2: the same note and ring, with the ticks replaced by a curve across
 * each corner, each landing on the two walls it joins. Fitted rather than
 * kept: his note corner was 1.5, and a filled style adds a unit, which lands
 * on 2.5, off the ladder, so it is 2 (3 filled). Everything else is his.
 *
 * Duotone plates the note. banknote's fill is the plate with the ring and the
 * ticks knocked out: the ring as an annulus, 1..3 about the centre, so a bead
 * of 2 stays in its middle and the fill still reads as a ring. banknote-2's
 * fill is the panel inside the four corner curves filled under the whole
 * stroke, `gift`'s pattern, with the same annulus out of it, so the corners
 * read as four white cells.
 *
 * The signs sit LOWER than the house corner, on his word of 15 Sep 2026, so the
 * note keeps everything: its ring and both ticks. The sign's box is 16..22 by
 * 16..22, flush in the canvas's bottom-right corner rather than the note's,
 * `map-pin`'s move, with smartphone-*'s signs read out of raw/ per style and
 * treatment and moved (+3, 0). The note moves UP 3 in the compounds, as `user`
 * moves into `user-*`, so check, plus and x paint 1..23 both ways, centred. He
 * tried the note left in place first and called it wrong: 4 of padding over
 * 1, the ring 0.34 into the notch, and x's cap 1.66 from the ring. Moved, the
 * ring clears the x by 4.06 and the notch by 2.06. Minus is the one that
 * cannot centre, its bar ending on 20, and is in SKEW_KNOWN.
 *
 * The note opens for the sign: the right wall stops on y=12 and the bottom wall
 * (now on 16) on x=12, each cap 2 clear of the sign's ink, and the plate's
 * notch runs on their far sides, y=13 and x=13, turning about each cap on r=1,
 * with its own corner r=3 about (16,16); sharp squares that corner at (13,13),
 * as credit-card's and tablet's do, which leaves the ring 1.12 clear of it.
 * Fill is the notched plate with the ring's annulus and both tick slots out.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
import { arcTo, onArc } from '../v5/geom.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const outArg = process.argv.find((a) => a.startsWith('--out='));
const OUT = outArg ? resolve(outArg.slice(6)) : ROOT;

/* ------------------------------------------------------------- path data */

const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 };
function parse(d) {
  const out = [];
  for (const m of d.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
    const nums = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (nums.length % (ARITY[m[1]] || 1) !== 0) throw new Error(`bad ${m[1]} in ${d}`);
    out.push([m[1], nums]);
  }
  return out;
}
const fmt = (v) => {
  if (!Number.isFinite(v)) throw new Error(`non-finite ${v}`);
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
};
const P = (...v) => v.map(fmt).join(' ');
const emit = (cmds) => cmds.map(([c, n]) => c + n.map(fmt).join(' ')).join('');
const subpaths = (d) => d.split(/(?=M)/).filter(Boolean);
const move = (d, dx, dy = 0) => emit(parse(d).map(([c, n]) => [c,
  c === 'H' ? n.map((v) => v + dx) : c === 'V' ? n.map((v) => v + dy) : c === 'Z' ? n : n.map((v, i) => v + (i % 2 ? dy : dx))]));

function areaOf(sp) {
  const pts = [];
  let cur = [0, 0];
  for (const [c, n] of parse(sp)) {
    if (c === 'M' || c === 'L') cur = [n[0], n[1]];
    else if (c === 'H') cur = [n[0], cur[1]];
    else if (c === 'V') cur = [cur[0], n[0]];
    else if (c === 'C') {
      const p0 = cur;
      for (let i = 1; i <= 8; i++) {
        const t = i / 8, u = 1 - t;
        pts.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * n[k] + 3 * u * t * t * n[k + 2] + t * t * t * n[k + 4]));
      }
      cur = [n[4], n[5]];
      continue;
    }
    if (c !== 'Z') pts.push(cur);
  }
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}
/** A closed run of L and C walked backwards. */
function reverse(d) {
  const cmds = parse(d);
  let cur = cmds[0][1];
  const segs = [];
  for (const [c, n] of cmds.slice(1)) {
    if (c === 'Z') continue;
    if (c === 'L') { segs.push(['L', cur, n]); cur = n; }
    else if (c === 'C') { segs.push(['C', cur, n]); cur = [n[4], n[5]]; }
    else throw new Error('reverse takes L and C only');
  }
  let out = `M${P(...cur)}`;
  for (const [c, from, n] of segs.reverse()) out += c === 'L' ? `L${P(...from)}` : `C${P(n[2], n[3], n[0], n[1], from[0], from[1])}`;
  return out + 'Z';
}
/** Wind `sub` with (sign = +1) or against (sign = -1) `outline`. */
const wound = (outline, sub, sign) => (Math.sign(areaOf(sub)) === sign * Math.sign(areaOf(outline)) ? sub : reverse(sub));

/** Arc pieces about c from a0 to a1 (screen degrees), as C commands only. */
const arcC = (c, r, a0, a1) => arcTo(c, r, a0, a1).map((s) => `C${P(...s.c1, ...s.c2, ...s.p)}`).join('');
const circle = (c, r) => `M${P(...onArc(c, r, 0))}${arcC(c, r, 0, 360)}Z`;

const rrect = (x0, y0, x1, y1, r) => {
  const k = r * 0.5522847498;
  return `M${P(x1, y1 - r)}L${P(x1, y0 + r)}C${P(x1, y0 + r - k, x1 - r + k, y0, x1 - r, y0)}L${P(x0 + r, y0)}C${P(x0 + r - k, y0, x0, y0 + r - k, x0, y0 + r)}L${P(x0, y1 - r)}C${P(x0, y1 - r + k, x0 + r - k, y1, x0 + r, y1)}L${P(x1 - r, y1)}C${P(x1 - r + k, y1, x1, y1 - r + k, x1, y1 - r)}Z`;
};
const box1 = (x0, y0, x1, y1) => {
  const k = 0.4477152502;
  return `M${P(x1, y1 - 1)}C${P(x1, y1 - k, x1 - k, y1, x1 - 1, y1)}L${P(x0 + 1, y1)}C${P(x0 + k, y1, x0, y1 - k, x0, y1 - 1)}L${P(x0, y0 + 1)}C${P(x0, y0 + k, x0 + k, y0, x0 + 1, y0)}L${P(x1 - 1, y0)}C${P(x1 - k, y0, x1, y0 + k, x1, y0 + 1)}L${P(x1, y1 - 1)}Z`;
};
/** A stadium about the run (x0..x1, y), radius 1, or its butt-capped box. */
const slot = (x0, x1, y, sharp) => sharp
  ? `M${P(x0, y - 1)}L${P(x1, y - 1)}L${P(x1, y + 1)}L${P(x0, y + 1)}L${P(x0, y - 1)}Z`
  : `M${P(x0, y - 1)}L${P(x1, y - 1)}${arcC([x1, y], 1, -90, 90)}L${P(x0, y + 1)}${arcC([x0, y], 1, 90, 270)}Z`;

/* ------------------------------------------------------------- the note */

const C0 = [12, 12];
const RING = circle(C0, 2);
const BODY = { regular: rrect(2, 5, 22, 19, 2), sharp: 'M22 19L22 5L2 5L2 19L22 19Z' };
const PLATE = { regular: rrect(1, 4, 23, 20, 3), sharp: box1(1, 4, 23, 20) };
const TICKS = { regular: 'M17 9L18 9M7 15L6 15', sharp: 'M16 9L19 9M8 15L5 15' };
const TICK_HOLES = (sharp) => [sharp ? slot(16, 19, 9, true) : slot(17, 18, 9, false), sharp ? slot(5, 8, 15, true) : slot(6, 7, 15, false)];
const ORNAMENTS = 'M18 5C18 6.33333 18.8 9 22 9M18 19C18 17.6667 18.8 15 22 15M6 19C6 17.6667 5.2 15 2 15M6 5C6 6.33333 5.2 9 2 9';
const PANEL = 'M6 5L18 5C18 6.33333 18.8 9 22 9L22 15C18.8 15 18 17.6667 18 19L6 19C6 17.6667 5.2 15 2 15L2 9C5.2 9 6 6.33333 6 5Z';

/* -------------------------------------------------------- opened corner */

const UP = -3;
const NOTCH = [16, 16];
const OPEN = {
  regular: {
    body: 'M22 12L22 4C22 2.8954 21.1046 2 20 2L4 2C2.8954 2 2 2.8954 2 4L2 14C2 15.1046 2.8954 16 4 16L12 16',
    plate: `M4 1L20 1C21.6569 1 23 2.3431 23 4L23 12${arcC([22, 12], 1, 0, 90)}L16 13${arcC(NOTCH, 3, -90, -180)}${arcC([12, 16], 1, 0, 90)}L4 17C2.3431 17 1 15.6569 1 14L1 4C1 2.3431 2.3431 1 4 1Z`,
  },
  sharp: {
    body: 'M22 13L22 2L2 2L2 16L13 16',
    plate: 'M2 1L22 1C22.5523 1 23 1.4477 23 2L23 13L13 13L13 17L2 17C1.4477 17 1 16.5523 1 16L1 2C1 1.4477 1.4477 1 2 1Z',
  },
};

/** smartphone-<sign>'s sign subpaths, moved from its box (13..19 by 16..22) to 16..22 by 16..22. */
function signOf(name, style, corners) {
  const src = readFileSync(join(ROOT, 'raw', `smartphone-${name}`, `Container=regular, Style=${style}, Corners=${corners}.svg`), 'utf8');
  const strokes = [...src.matchAll(/<path d="([^"]+)"[^>]*stroke="black"/g)].map((m) => m[1]);
  if (strokes.length !== 1) throw new Error(`smartphone-${name}: ${strokes.length} stroke layers`);
  const sign = subpaths(strokes[0]).filter((p) => !/^M19 1[23][VL]/.test(p) && !/^M(13\.5|10\.5|14\.5|9\.5) 6/.test(p));
  if (!sign.length) throw new Error(`smartphone-${name}: no sign`);
  return sign.map((p) => move(p, 3, 0)).join('');
}

/* ------------------------------------------------------------ the files */

const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const cap = (corners) => (corners === 'sharp' ? 'butt' : 'round');
const stroke = (d, corners) => `<path d="${d}" stroke="black" stroke-width="2" stroke-linecap="${cap(corners)}" stroke-linejoin="round"/>`;
const plate = (d) => `<path d="${d}" fill="black" fill-opacity="0.4"/>`;
/** An outline and its knockouts, every hole wound against it and the ring's middle wound with it. */
const solid = (outline, holes = [], keep = []) =>
  `<path fill-rule="evenodd" clip-rule="evenodd" d="${outline}${holes.map((h) => wound(outline, h, -1)).join('')}${keep.map((h) => wound(outline, h, 1)).join('')}" fill="black"/>`;

const SETS = {
  banknote: (style, corners) => {
    const sharp = corners === 'sharp';
    const lines = BODY[corners] + RING + TICKS[corners];
    if (style === 'stroke') return [stroke(lines, corners)];
    if (style === 'duotone') return [plate(PLATE[corners]), stroke(lines, corners)];
    return [solid(PLATE[corners], [circle(C0, 3), ...TICK_HOLES(sharp)], [circle(C0, 1)])];
  },
  'banknote-2': (style, corners) => {
    const lines = BODY[corners] + RING + ORNAMENTS;
    if (style === 'stroke') return [stroke(lines, corners)];
    if (style === 'duotone') return [plate(PLATE[corners]), stroke(lines, corners)];
    return [solid(PANEL, [circle(C0, 3)], [circle(C0, 1)]), stroke(BODY[corners] + ORNAMENTS, corners)];
  },
};
for (const sign of ['check', 'minus', 'plus', 'x']) {
  SETS[`banknote-${sign}`] = (style, corners) => {
    const sharp = corners === 'sharp', o = OPEN[corners], s = signOf(sign, style, corners);
    const lines = o.body + move(RING + TICKS[corners], 0, UP);
    if (style === 'stroke') return [stroke(lines + s, corners)];
    if (style === 'duotone') return [plate(o.plate), stroke(lines + s, corners)];
    return [solid(o.plate, [move(circle(C0, 3), 0, UP), ...TICK_HOLES(sharp).map((h) => move(h, 0, UP))], [move(circle(C0, 1), 0, UP)]), stroke(s, corners)];
  };
}

/**
 * banknote-2's four, 15 Sep 2026, on banknote's construction exactly: the
 * same lowered sign, the note up 3, the same opened corner and plate. The
 * bottom-right corner curve stands where the sign goes and the opened corner
 * takes it; the other three stay. Fill keeps banknote-2's own pattern, the
 * panel inside the curves filled under the stroke, its bottom-right edge now
 * the notch itself, so the corners still read as white cells.
 */
const ORN3 = move('M18 5C18 6.33333 18.8 9 22 9M6 19C6 17.6667 5.2 15 2 15M6 5C6 6.33333 5.2 9 2 9', 0, UP);
const PANEL_OPEN = {
  regular: `M6 2L18 2C18 3.33333 18.8 6 22 6L22 13L16 13${arcC(NOTCH, 3, -90, -180)}L6 16C6 14.6667 5.2 12 2 12L2 6C5.2 6 6 3.33333 6 2Z`,
  sharp: 'M6 2L18 2C18 3.33333 18.8 6 22 6L22 13L13 13L13 16L6 16C6 14.6667 5.2 12 2 12L2 6C5.2 6 6 3.33333 6 2Z',
};
for (const sign of ['check', 'minus', 'plus', 'x']) {
  SETS[`banknote-2-${sign}`] = (style, corners) => {
    const o = OPEN[corners], s = signOf(sign, style, corners);
    const lines = o.body + move(RING, 0, UP) + ORN3;
    if (style === 'stroke') return [stroke(lines + s, corners)];
    if (style === 'duotone') return [plate(o.plate), stroke(lines + s, corners)];
    return [solid(PANEL_OPEN[corners], [move(circle(C0, 3), 0, UP)], [move(circle(C0, 1), 0, UP)]), stroke(o.body + ORN3 + s, corners)];
  };
}

/* ------------------------------------------------------------- asserts */

function inkOf(svg, corners) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const m of svg.matchAll(/<path ([^>]*)\/>/g)) {
    const d = /\bd="([^"]+)"/.exec(m[1])[1];
    const q = /stroke="black"/.test(m[1]) ? strokedBBox(d, 1, cap(corners)) : strokedBBox(d, 0, 'butt');
    b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
  }
  return b;
}

const wantOf = (name) => (/-(check|plus|x)$/.test(name) ? [1, 1, 23, 23] : /-minus$/.test(name) ? [1, 1, 23, 20] : [1, 4, 23, 20]);
for (const [name, build] of Object.entries(SETS)) {
  const dir = join(OUT, 'raw', name);
  mkdirSync(dir, { recursive: true });
  for (const style of ['stroke', 'duotone', 'fill']) for (const corners of ['regular', 'sharp']) {
    const svg = [HEAD, ...build(style, corners), '</svg>', ''].join('\n');
    const b = inkOf(svg, corners);
    const want = wantOf(name);
    const off = Math.max(...b.map((v, i) => Math.abs(v - want[i])));
    if (off > 0.002) throw new Error(`${name} ${style} ${corners}: ink ${b.map((v) => v.toFixed(3))} should be ${want}`);
    writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${corners}.svg`), svg);
  }
  console.log(name.padEnd(20), 'ink', wantOf(name).join(','), '6 variants');
}
