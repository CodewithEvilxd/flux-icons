/**
 * fingerprint-pattern, redrawn twice on 17 Sep 2026 from his references ("try
 * hard to get the fingerprint... right", then more references). car and
 * car-front were drawn here beside it and dropped on his word the same day.
 * Kept apart from build.mjs while other sessions edit it.
 *   node tools/singles-1-0-0-b/build-fingerprint.mjs [--out=DIR]
 *
 * A whorl about (12, 11): a core line inside ridges of 5 and 9 whose legs all
 * sweep left about one centre 17 to the left, so every pitch holds, as the
 * references share. Broken as they break: the outer ridge high on the left
 * with a tick below, again past the top and on the right (his drawing in refs/,
 * 17 Sep 2026: the breaks end on x 16, y 10 and y 14), the middle ridge at the
 * top and low on the right.
 * Two-tone and duotone alternate the pieces, as he drew them on 17 Sep 2026:
 * grey the outer ridge's top-left arc and its short lower-right piece, the
 * middle ridge's right-hand piece and the core; black the rest. Fill is the
 * stroke.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Path, onArc, add, sub, mul, unit } from '../v5/geom.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
import { S, M, doc } from './build.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const SETS = {};
const set = (name, box, build) => { build.box = box; SETS[name] = build; };
const D = Math.PI / 180;

/* --------------------------------------------------- fingerprint-pattern */

/**
 * Ridges about C. A ridge of radius r is an arch over the top, legs straight
 * down to yb, then every leg bends left about Q = (C.x - K, yb): radius K - r
 * on the left, K + r on the right, so all legs stay concentric and keep the
 * pitch their arches set. r = 0 is the core: a dash down from C.
 * A point on a ridge is its arc length s from the top, negative to the left.
 */
function whorl({ C, yb, K }) {
  const Q = [C[0] - K, yb];
  const vert = yb - C[1];
  // where a point sits: 'arch', 'leg' (straight) or 'bend', and on which side
  const place = (r, s) => {
    if (r === 0) return { side: 1, t: s, part: s <= vert ? 'leg' : 'bend' };
    const side = s < 0 ? -1 : 1, t = Math.abs(s), quarter = (r * Math.PI) / 2;
    return { side, t, part: t <= quarter ? 'arch' : t <= quarter + vert ? 'leg' : 'bend' };
  };
  const at = (r, s) => {
    const { side, t, part } = place(r, s), quarter = (r * Math.PI) / 2;
    if (part === 'arch') return onArc(C, r, 270 + (side * t) / r / D);
    if (part === 'leg') return [C[0] + side * r, C[1] + t - quarter];
    // a positive angle about Q runs down and to the left on both sides
    const R = K + side * r;
    return onArc(Q, R, (t - quarter - vert) / R / D);
  };
  // s for an arch angle (270 the top) and for a depth y on one side's leg
  const sA = (r, a) => (a - 270) * D * r;
  const sY = (r, side, y) => {
    const quarter = (r * Math.PI) / 2;
    const t = y <= yb ? quarter + (y - C[1]) : quarter + vert + (K + side * r) * Math.asin((y - yb) / (K + side * r));
    return r === 0 ? t : side * t;
  };
  /** One piece as exact arcs and lines; sharp stubs each end along its tangent. */
  const piece = (r, s0, s1, sharp, box) => {
    const quarter = (r * Math.PI) / 2;
    const bounds = r === 0 ? [vert] : [-quarter - vert, -quarter, quarter, quarter + vert];
    // bounds coincide where the legs start straight off the arch (yb on C), and
    // a zero-length arc would be read as a full turn
    const stops = [s0, ...[...new Set(bounds)].filter((v) => v > s0 + 1e-9 && v < s1 - 1e-9), s1];
    const tan = (s) => unit(sub(at(r, s + 1e-4), at(r, s - 1e-4)));
    const p = new Path();
    const P0 = at(r, s0), P1 = at(r, s1);
    if (sharp) { const dir = mul(tan(s0), -1); p.M(add(P0, mul(dir, stub(P0, dir, box)))).L(P0); } else p.M(P0);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1], { part } = place(r, (a + b) / 2);
      if (b - a < 1e-9) continue;
      if (part === 'leg') { p.L(at(r, b)); continue; }
      const c = part === 'arch' ? C : Q;
      const g = { at: (s) => at(r, s) };
      const ang = (q) => Math.atan2(q[1] - c[1], q[0] - c[0]) / D;
      let a0 = ang(g.at(a)), a1 = ang(g.at(b));
      while (a1 - a0 > 180) a1 -= 360;
      while (a0 - a1 > 180) a1 += 360;
      p.A(c, a0, a1, a1 > a0 ? 1 : -1);
    }
    if (sharp) { const dir = tan(s1); p.L(add(P1, mul(dir, stub(P1, dir, box)))); }
    return p.d;
  };
  return { sA, sY, piece };
}
/** An arc end's stub: a unit, or less where the butt cap's corners would leave the box. */
function stub(p, dir, box) {
  const nrm = [-dir[1], dir[0]];
  const fits = (k) => [1, -1].every((g) => { const c = add(add(p, mul(dir, k)), mul(nrm, g)); return c[0] >= box[0] - 1e-9 && c[1] >= box[1] - 1e-9 && c[0] <= box[2] + 1e-9 && c[1] <= box[3] + 1e-9; });
  if (fits(1)) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  return lo;
}

set('fingerprint-pattern', [2, 1, 22, 23], (sharp) => {
  const box = [2, 1, 22, 23];
  const w = whorl({ C: [12, 11], yb: 11, K: 17 });
  const { sA, sY } = w;
  const P = (r, s0, s1) => w.piece(r, s0, s1, sharp, box);
  // every break on a ridge is a chord of at least 4: 2 of daylight between caps
  const past = 270 + Math.asin(4 / 9) / D, right = 360 - Math.asin(1 / 9) / D;
  const outerTop = P(9, sA(9, 218), sA(9, 270)), outerRight = P(9, sA(9, past), sA(9, right));
  const outerLow = P(9, sY(9, 1, 14), sY(9, 1, 17)), tick = P(9, sA(9, 180), sA(9, 188));
  const middleLeft = P(5, sY(5, -1, 19), sA(5, 290)), middleRight = P(5, sA(5, 338), sY(5, 1, 13));
  const middleLow = P(5, sY(5, 1, 17), sY(5, 1, 22));
  const core = P(0, sY(0, 1, 11), sY(0, 1, 22));
  const all = outerTop + outerRight + outerLow + tick + middleLeft + middleRight + middleLow + core;
  const grey = outerTop + outerLow + middleRight + core;
  const black = outerRight + tick + middleLeft + middleLow;
  return {
    stroke: [S(all)],
    'two-tone': [M(grey), S(black)],
    duotone: [M(grey), S(black)],
    fill: [S(all)],
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
