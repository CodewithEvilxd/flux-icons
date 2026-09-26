/**
 * Emit the tablet family into raw/ (or --out=DIR/raw).
 *   node tools/tablet/build.mjs [--out=DIR]
 *
 * Eleven names, 14 Sep 2026: `tablet`, `tablet-vertical`, and the four signs plus
 * the four straight arrows of the `smartphone-*` family, under the same names:
 * arrow-down, arrow-left, arrow-in-up, arrow-in-right, check, minus, plus, x;
 * `laptop` and `laptop-smartphone` (below). `tablet-smartphone` was retired on
 * 17 Sep 2026 for `brain-cog`; its phone lives on in `laptop-smartphone`.
 *
 * The tablet is drawn LANDSCAPE with a camera dot at the top centre, on
 * Zafar's reference of 14 Sep 2026. The first cut stood upright with the
 * phone's speaker slot and read as a wider phone, which is all it was. So the
 * base is the house horizontal rectangle, ink 1..23 by 3..21 on r=3, and the
 * turned drawing is `tablet-vertical`, the same tablet transposed with its dot
 * on the left: the phone's pair inverted, since the phone stands up and its
 * turned drawing is `smartphone-horizontal`.
 *
 * The dot is the bead of the dot ladder, a filled r=1.5 painting 3 (it was the
 * 2-unit mark of his reference until 17 Sep 2026, when he asked for 3). It sits
 * on (12,8.5): the top wall's inner ink is on 5, and the house gap puts the
 * dot's ink top on 7. It is its
 * own filled path in stroke and duotone and a knockout in fill, as `lock`'s
 * keyhole is, and stays round in sharp.
 *
 * The signs are READ out of `raw/smartphone-<sign>/`, per style and treatment,
 * and moved (+3, -2) from the phone's sign box (13..19 by 16..22) to the
 * tablet's (16..22 by 14..20), flush in the ink corner. Every command is moved
 * by its own arity (H takes dx, V takes dy), never by a regex over pairs.
 *
 * The opened corner: the right wall stops on y=10 and the bottom wall on x=12,
 * so each cap's ink ends 2 short of the sign's (ink 15..23 by 13..21). The
 * plate and the fill's solid take the notch at x=13 and y=11, the caps' far
 * sides, turning about each cap on r=1 in the rounded treatment, with the
 * notch's own corner r=3 about (16,14). Sharp extends both cut ends a unit, so
 * their butt faces land ON those two lines, and the plate runs flush along
 * each face with square corners.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';

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
const emit = (cmds) => cmds.map(([c, n]) => c + n.map(fmt).join(' ')).join('');
/** Split into subpaths, each starting at its M. */
const subpaths = (d) => d.split(/(?=M)/).filter(Boolean);
/** Translate by (dx, dy), per command. */
const move = (d, dx, dy = 0) => emit(parse(d).map(([c, n]) => [c,
  c === 'H' ? n.map((v) => v + dx) : c === 'V' ? n.map((v) => v + dy) : c === 'Z' ? n : n.map((v, i) => v + (i % 2 ? dy : dx))]));
/** Swap the axes, per command: H and V trade places. */
const transpose = (d) => emit(parse(d).map(([c, n]) => [c === 'H' ? 'V' : c === 'V' ? 'H' : c,
  c === 'H' || c === 'V' ? n : n.map((_, i) => n[i % 2 ? i - 1 : i + 1])]));

/** Signed area of a subpath, curves sampled. */
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

/* ------------------------------------------------------------- the body */

/** The camera dot, both ways round, so a knockout can take the one wound against its solid. */
const DOT = [
  'M13.5 8.5C13.5 9.3284 12.8284 10 12 10C11.1716 10 10.5 9.3284 10.5 8.5C10.5 7.6716 11.1716 7 12 7C12.8284 7 13.5 7.6716 13.5 8.5Z',
  'M13.5 8.5C13.5 7.6716 12.8284 7 12 7C11.1716 7 10.5 7.6716 10.5 8.5C10.5 9.3284 11.1716 10 12 10C12.8284 10 13.5 9.3284 13.5 8.5Z',
];
const BASE = {
  regular: {
    body: 'M22 17V7C22 5.34315 20.6569 4 19 4H5C3.34315 4 2 5.34315 2 7V17C2 18.6569 3.34315 20 5 20H19C20.6569 20 22 18.6569 22 17Z',
    plate: 'M23 7V17C23 19.2091 21.2091 21 19 21H5C2.79086 21 1 19.2091 1 17V7C1 4.79086 2.79086 3 5 3H19C21.2091 3 23 4.79086 23 7Z',
  },
  sharp: {
    body: 'M22 20L22 4L2 4L2 20L22 20Z',
    plate: 'M23 20C23 20.5523 22.5523 21 22 21L2 21C1.44772 21 1 20.5523 1 20L1 4C1 3.44772 1.44772 3 2 3L22 3C22.5523 3 23 3.44772 23 4L23 20Z',
  },
};
const OPEN = {
  regular: {
    body: 'M22 10V7C22 5.34315 20.6569 4 19 4H5C3.34315 4 2 5.34315 2 7V17C2 18.6569 3.34315 20 5 20H12',
    plate: 'M19 3C21.2091 3 23 4.79086 23 7V10C23 10.5523 22.5523 11 22 11H16C14.3431 11 13 12.3431 13 14V20C13 20.5523 12.5523 21 12 21H5C2.79086 21 1 19.2091 1 17V7C1 4.79086 2.79086 3 5 3H19Z',
    solid: 'M5 4C3.34315 4 2 5.34315 2 7V17C2 18.6569 3.34315 20 5 20H13V14C13 12.3431 14.3431 11 16 11H22V7C22 5.34315 20.6569 4 19 4H5Z',
  },
  sharp: {
    body: 'M22 11L22 4L2 4L2 20L13 20',
    plate: 'M2 3L22 3C22.5523 3 23 3.44772 23 4L23 11L13 11L13 21L2 21C1.44772 21 1 20.5523 1 20L1 4C1 3.44772 1.44772 3 2 3Z',
    solid: 'M2 5L2 19C2 19.5523 2.44772 20 3 20L13 20L13 11L22 11L22 5C22 4.44772 21.5523 4 21 4L3 4C2.44772 4 2 4.44772 2 5Z',
  },
};

/* ------------------------------------------------------------ the files */

const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const file = (style, corners) => `Container=regular, Style=${style}, Corners=${corners}.svg`;
const STYLES = ['stroke', 'duotone', 'fill'];
const CORNERS = ['regular', 'sharp'];
const cap = (corners) => (corners === 'sharp' ? 'butt' : 'round');
const stroke = (d, corners) => `<path d="${d}" stroke="black" stroke-width="2" stroke-linecap="${cap(corners)}" stroke-linejoin="round"/>`;
const plate = (d) => `<path d="${d}" fill="black" fill-opacity="0.4"/>`;
const dot = (d) => `<path d="${d}" fill="black"/>`;
/**
 * A solid with the dot knocked out. The file says evenodd and the design file
 * paints evenodd, but the hole is wound against the outline too, so the two
 * rules agree and nonzero cannot fill the dot back in.
 */
function solid(outline, holes) {
  const hole = holes.find((h) => Math.sign(areaOf(h)) !== Math.sign(areaOf(outline)));
  if (!hole) throw new Error('no hole wound against the outline');
  return `<path fill-rule="evenodd" clip-rule="evenodd" d="${outline}${hole}" fill="black"/>`;
}

/** The sign subpaths of a smartphone compound's stroke layer, moved into the tablet's sign box. */
function signOf(name, style, corners) {
  const src = readFileSync(join(ROOT, 'raw', `smartphone-${name}`, file(style, corners)), 'utf8');
  const strokes = [...src.matchAll(/<path d="([^"]+)"[^>]*stroke="black"/g)].map((m) => m[1]);
  if (strokes.length !== 1) throw new Error(`smartphone-${name} ${style} ${corners}: ${strokes.length} stroke layers`);
  const parts = subpaths(strokes[0]);
  const body = parts.filter((p) => /^M19 1[23][VL]/.test(p));
  const slot = parts.filter((p) => /^M(13\.5|10\.5|14\.5|9\.5) 6/.test(p));
  const sign = parts.filter((p) => !body.includes(p) && !slot.includes(p));
  const wantSlot = style === 'fill' ? 0 : 1;
  if (body.length !== 1 || slot.length !== wantSlot || !sign.length)
    throw new Error(`smartphone-${name} ${style} ${corners}: body ${body.length} slot ${slot.length} sign ${sign.length}`);
  return sign.map((p) => move(p, 3, -2)).join('');
}

const SETS = {};
for (const vertical of [false, true]) {
  const t = vertical ? transpose : (d) => d;
  SETS[vertical ? 'tablet-vertical' : 'tablet'] = (style, corners) => {
    const { body, plate: pl } = BASE[corners];
    if (style === 'stroke') return [stroke(t(body), corners), dot(t(DOT[0]))];
    if (style === 'duotone') return [plate(t(pl)), stroke(t(body), corners), dot(t(DOT[0]))];
    return [solid(t(pl), DOT.map(t))];
  };
}
for (const sign of ['arrow-down', 'arrow-left', 'arrow-in-up', 'arrow-in-right', 'check', 'minus', 'plus', 'x']) {
  SETS[`tablet-${sign}`] = (style, corners) => {
    const o = OPEN[corners], s = signOf(sign, style, corners);
    if (style === 'stroke') return [stroke(o.body + s, corners), dot(DOT[0])];
    if (style === 'duotone') return [plate(o.plate), stroke(o.body + s, corners), dot(DOT[0])];
    return [solid(o.solid, DOT), stroke(o.body + s, corners)];
  };
}

/**
 * `tablet-smartphone`: his drawing of 15 Sep 2026 (refs/tablet-smartphone.svg),
 * fitted. The tablet stands behind at the top left, 2..22 by 2..18 on r=3 with
 * its camera dot on (12,6), its bottom wall running to x=9 and its top-right
 * corner arc stopping where it reaches y=4; the phone stands in front at the
 * bottom right, 13..22 wide, carrying the plate. The front object is plated
 * and the one behind is a bare stroke, `messages`' rule.
 *
 * What was fitted rather than kept: his phone was the smartphone scaled into
 * a 9 by 14 box, so its corners came out elliptical (2.57 by 2.8) and its slot
 * 1.93 long. The corners go back to r=3, and the slot is solved for the house
 * gap: a 9-wide body leaves 7 of interior, so a slot clearing both walls by 2
 * is 1 long, 17..18, sitting 4 under the phone's top as the smartphone's does.
 *
 * PHONE_TOP is the one number his drawing and the gap rule disagreed on. At
 * his 8 the dot sat 1.40 from the rounded phone's corner and 0.24 from the
 * sharp one, whose square join paints its corner at r=1 about (13,8). He chose
 * 10 on 15 Sep 2026, the first top that clears both: 3.06 and 2.12. The phone
 * is 9 by 12 for it, and its slot follows it down to y=14.
 */
const PHONE_TOP = Number(process.env.PHONE_TOP ?? 10);
const P = (...v) => v.map(fmt).join(' ');
const rrect = (x0, y0, x1, y1, r) => {
  const k = r * 0.5522847498;
  return `M${P(x1, y1 - r)}V${fmt(y0 + r)}C${P(x1, y0 + r - k, x1 - r + k, y0, x1 - r, y0)}H${fmt(x0 + r)}C${P(x0 + r - k, y0, x0, y0 + r - k, x0, y0 + r)}V${fmt(y1 - r)}C${P(x0, y1 - r + k, x0 + r - k, y1, x0 + r, y1)}H${fmt(x1 - r)}C${P(x1 - r + k, y1, x1, y1 - r + k, x1, y1 - r)}Z`;
};
const box1 = (x0, y0, x1, y1) => { const k = 0.4477152502;
  return `M${P(x1, y1 - 1)}C${P(x1, y1 - k, x1 - k, y1, x1 - 1, y1)}L${P(x0 + 1, y1)}C${P(x0 + k, y1, x0, y1 - k, x0, y1 - 1)}L${P(x0, y0 + 1)}C${P(x0, y0 + k, x0 + k, y0, x0 + 1, y0)}L${P(x1 - 1, y0)}C${P(x1 - k, y0, x1, y0 + k, x1, y0 + 1)}L${P(x1, y1 - 1)}Z`; };
const reverse = (d) => {
  // a closed run of L and C only, walked backwards
  const cmds = parse(d); const pts = []; let cur = cmds[0][1];
  const segs = [];
  for (const [c, n] of cmds.slice(1)) {
    if (c === 'Z') continue;
    if (c === 'L') { segs.push(['L', cur, n]); cur = n; }
    else if (c === 'C') { segs.push(['C', cur, n]); cur = [n[4], n[5]]; }
    else throw new Error('reverse takes L and C only');
  }
  let out = `M${fmt(cur[0])} ${fmt(cur[1])}`;
  for (const [c, from, n] of segs.reverse()) out += c === 'L' ? `L${fmt(from[0])} ${fmt(from[1])}` : `C${[n[2], n[3], n[0], n[1], from[0], from[1]].map(fmt).join(' ')}`;
  return out + 'Z';
};
const PT = PHONE_TOP, SY = PT + 4;
const PAIR = {
  regular: {
    tablet: 'M9 18H5C3.34315 18 2 16.6569 2 15V5C2 3.34315 3.34315 2 5 2H19C20.2713 2 21.4046 2.80136 21.8284 4',
    phone: rrect(13, PT, 22, 22, 3) + `M17 ${SY}H18`,
    plate: rrect(12, PT - 1, 23, 23, 4),
    hole: `M${P(17, SY - 1)}C${P(16.4477152502, SY - 1, 16, SY - 0.5522847498, 16, SY)}C${P(16, SY + 0.5522847498, 16.4477152502, SY + 1, 17, SY + 1)}L${P(18, SY + 1)}C${P(18.5522847498, SY + 1, 19, SY + 0.5522847498, 19, SY)}C${P(19, SY - 0.5522847498, 18.5522847498, SY - 1, 18, SY - 1)}L${P(17, SY - 1)}Z`,
  },
  sharp: {
    tablet: 'M10 18L2 18L2 2L22 2L22 5',
    phone: `M22 22L22 ${PT}L13 ${PT}L13 22L22 22ZM16 ${SY}L19 ${SY}`,
    plate: box1(12, PT - 1, 23, 23),
    hole: `M16 ${SY + 1}L19 ${SY + 1}L19 ${SY - 1}L16 ${SY - 1}L16 ${SY + 1}Z`,
  },
};

/**
 * `laptop` and `laptop-smartphone`: his drawings of 15 Sep 2026
 * (refs/laptop.svg, refs/laptop-smartphone.svg), fitted. My first laptop, the
 * tablet's screen floating over a bar, was rejected.
 *
 * His laptop is an open screen whose legs land ON a deck: the screen 4..20 by
 * 4..16, open at the bottom, and the deck a closed slab 2..22 by 16..20, square
 * across its top edge and rounded underneath. Ink 1..23 by 3..21. What was
 * fitted is the radii and nothing else: his screen corner was 1.5 and his
 * deck's lower corners 2.5, and a filled style adds a unit to each, which
 * lands on 2.5 and 3.5, off the ladder. So the screen takes 2 and the deck's
 * lower corners 2; the deck's top corners keep his 0.5 (1.5 filled).
 *
 * Duotone mutes the whole silhouette, walked as ONE contour, since a union of
 * two plates is two subpaths that Figma's evenodd would cut apart where they
 * overlap; the reflex corner where a leg meets the deck is the offsets'
 * crossing. Fill is that same contour solid with the deck's interior knocked
 * out, a solid screen on an open deck. Built as the screen filled under the
 * whole stroke instead (`gift`'s pattern) it came up 0.05 short of the plate
 * at the deck's top corners, where a 1-unit offset of an r=0.5 cubic is not
 * the r=1.5 circle the plate draws; plate plus knockout cannot differ.
 *
 * In the pair the laptop stands behind, 2 higher, with the phone in front
 * carrying the plate, `tablet-smartphone`'s arrangement. The deck is cut on
 * x=9 and the screen's right side stops where its corner ends, (20,4), both 2
 * clear of the phone. The phone is `tablet-smartphone`'s own, top on 10 rather
 * than the 8 he drew here, so the two pairs carry one phone.
 */
const laptopParts = (dy, sharp) => {
  const y = (v) => fmt(v + dy);
  return sharp ? {
    screen: `M4 ${y(16)}L4 ${y(4)}L20 ${y(4)}L20 ${y(16)}`,
    deck: `M2 ${y(16)}L22 ${y(16)}L22 ${y(20)}L2 ${y(20)}L2 ${y(16)}Z`,
    region: `M4 ${y(16)}L4 ${y(4)}L20 ${y(4)}L20 ${y(16)}L4 ${y(16)}Z`,
    plate: `M3 ${y(15)}L3 ${y(4)}C3 ${y(3.4477)} 3.4477 ${y(3)} 4 ${y(3)}L20 ${y(3)}C20.5523 ${y(3)} 21 ${y(3.4477)} 21 ${y(4)}L21 ${y(15)}L22 ${y(15)}C22.5523 ${y(15)} 23 ${y(15.4477)} 23 ${y(16)}L23 ${y(20)}C23 ${y(20.5523)} 22.5523 ${y(21)} 22 ${y(21)}L2 ${y(21)}C1.4477 ${y(21)} 1 ${y(20.5523)} 1 ${y(20)}L1 ${y(16)}C1 ${y(15.4477)} 1.4477 ${y(15)} 2 ${y(15)}L3 ${y(15)}Z`,
    hole: `M3 ${y(17)}L21 ${y(17)}L21 ${y(19)}L3 ${y(19)}L3 ${y(17)}Z`,
    cutScreen: `M4 ${y(16)}L4 ${y(4)}L20 ${y(4)}L20 ${y(7)}`,
    cutDeck: `M10 ${y(20)}L2 ${y(20)}L2 ${y(16)}L10 ${y(16)}`,
  } : {
    screen: `M4 ${y(16)}V${y(6)}C4 ${y(4.8954)} 4.8954 ${y(4)} 6 ${y(4)}H18C19.1046 ${y(4)} 20 ${y(4.8954)} 20 ${y(6)}V${y(16)}`,
    deck: `M2.5 ${y(16)}H21.5C21.7761 ${y(16)} 22 ${y(16.2239)} 22 ${y(16.5)}V${y(18)}C22 ${y(19.1046)} 21.1046 ${y(20)} 20 ${y(20)}H4C2.8954 ${y(20)} 2 ${y(19.1046)} 2 ${y(18)}V${y(16.5)}C2 ${y(16.2239)} 2.2239 ${y(16)} 2.5 ${y(16)}Z`,
    region: `M4 ${y(16)}V${y(6)}C4 ${y(4.8954)} 4.8954 ${y(4)} 6 ${y(4)}H18C19.1046 ${y(4)} 20 ${y(4.8954)} 20 ${y(6)}V${y(16)}H4Z`,
    plate: `M3 ${y(15)}V${y(6)}C3 ${y(4.3431)} 4.3431 ${y(3)} 6 ${y(3)}H18C19.6569 ${y(3)} 21 ${y(4.3431)} 21 ${y(6)}V${y(15)}H21.5C22.3284 ${y(15)} 23 ${y(15.6716)} 23 ${y(16.5)}V${y(18)}C23 ${y(19.6569)} 21.6569 ${y(21)} 20 ${y(21)}H4C2.3431 ${y(21)} 1 ${y(19.6569)} 1 ${y(18)}V${y(16.5)}C1 ${y(15.6716)} 1.6716 ${y(15)} 2.5 ${y(15)}H3Z`,
    hole: `M3 ${y(17)}L21 ${y(17)}L21 ${y(18)}C21 ${y(18.5523)} 20.5523 ${y(19)} 20 ${y(19)}L4 ${y(19)}C3.4477 ${y(19)} 3 ${y(18.5523)} 3 ${y(18)}L3 ${y(17)}Z`,
    cutScreen: `M4 ${y(16)}V${y(6)}C4 ${y(4.8954)} 4.8954 ${y(4)} 6 ${y(4)}H18C19.1046 ${y(4)} 20 ${y(4.8954)} 20 ${y(6)}`,
    cutDeck: `M9 ${y(20)}H4C2.8954 ${y(20)} 2 ${y(19.1046)} 2 ${y(18)}V${y(16.5)}C2 ${y(16.2239)} 2.2239 ${y(16)} 2.5 ${y(16)}H9`,
  };
};
SETS.laptop = (style, corners) => {
  const o = laptopParts(0, corners === 'sharp');
  if (style === 'stroke') return [stroke(o.screen + o.deck, corners)];
  if (style === 'duotone') return [plate(o.plate), stroke(o.screen + o.deck, corners)];
  return [solid(o.plate, [o.hole, reverse(o.hole)])];
};
SETS['laptop-smartphone'] = (style, corners) => {
  const o = laptopParts(-2, corners === 'sharp'), ph = PAIR[corners];
  const phone = ph.phone;
  if (style === 'stroke') return [stroke(o.cutScreen + o.cutDeck + phone, corners)];
  if (style === 'duotone') return [plate(ph.plate), stroke(o.cutScreen + o.cutDeck + phone, corners)];
  return [solid(ph.plate, [ph.hole, reverse(ph.hole)]), stroke(o.cutScreen + o.cutDeck, corners)];
};

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

for (const [name, build] of Object.entries(SETS)) {
  const want = name === 'tablet-vertical' ? [3, 1, 21, 23] : /-smartphone$/.test(name) ? [1, 1, 23, 23] : [1, 3, 23, 21];
  const dir = join(OUT, 'raw', name);
  mkdirSync(dir, { recursive: true });
  for (const style of STYLES) for (const corners of CORNERS) {
    const svg = [HEAD, ...build(style, corners), '</svg>', ''].join('\n');
    const b = inkOf(svg, corners);
    const off = Math.max(...b.map((v, i) => Math.abs(v - want[i])));
    if (off > 0.002) throw new Error(`${name} ${style} ${corners}: ink ${b.map((v) => v.toFixed(3))} should be ${want}`);
    writeFileSync(join(dir, file(style, corners)), svg);
  }
  console.log(name.padEnd(24), 'ink', want.join(','), '6 variants');
}
