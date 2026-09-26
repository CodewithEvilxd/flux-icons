/**
 * `brain-cog`, 17 Sep 2026, replacing `tablet-smartphone` on Zafar's word.
 *   node tools/brain-cog/build.mjs [--out=DIR]
 *
 * The subject's construction, as the reference sets draw it: the whole brain,
 * its fissure taken out, and a cog in the middle. The brain is `brain`, lobe
 * for lobe, closed round both hemispheres (tools/batch-b/brain.mjs); the cog is
 * a ring with teeth, centred between the two cusps where the fissure was,
 * (12, 11.625).
 *
 * The ring is r=2.875, so its ink stops 2 short of both cusps (4.75, 18.5),
 * and eight teeth run a unit of tooth past the ring's ink (tip r=3.875), set
 * at 22.5 degrees off the axes so none points at a cusp. Eight is two gaps
 * short, and taken knowingly: the teeth stand 0.97 apart where they leave the ring and
 * the four nearest the cusps come 1.61 from them. Six teeth hold 2 everywhere
 * (2.05 apart, 2.02 from the cusps) and were drawn first; at 24 and 16px six
 * round teeth read as a flower and eight read as a cog. The folds keep only
 * what stays 2 clear of the cog: each is cut back along its own arc from its
 * free end, and the fold beside the fissure goes, as the fissure does.
 *
 * Two-tone: `brain`'s plate under the whole stroke. Duotone: that plate grey
 * and the cog black, nothing else. Fill: the brain solid with the cog knocked out,
 * the hub left solid inside it, so the cog reads white with its counter.
 *
 * The first draft, a half brain whose fissure was the flat side of a half
 * gear, was not the subject: a brain cog is a cog in a whole brain.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { hemisphere, brainVariants, mirrorD } from '../batch-b/brain.mjs';
import { Path, circlePath, add, sub, mul, len, dot } from '../v5/geom.mjs';
import { contourPath } from '../v5/offset.mjs';
import { sharpEndIn } from '../v5/icons.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const rad = (a) => (a * Math.PI) / 180, deg = (a) => (a * 180) / Math.PI;
const U = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const on = (c, r, a) => add(c, mul(U(a), r));
const f4 = (v) => { if (!Number.isFinite(v)) throw new Error('non-finite'); const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const P = (p) => `${f4(p[0])} ${f4(p[1])}`;

export const COG = { c: [12, 11.625], ring: 2.875, tip: 3.875, teeth: [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5] };

/** The cog's centre lines: the ring and each tooth, sharp teeth pushed out by the cut rule. */
function cogRuns(sharp) {
  const { c, ring, tip, teeth } = COG;
  const t = teeth.map((a) => {
    const u = U(a);
    let e = on(c, tip, a);
    if (sharp) e = add(e, mul(u, sharpEndIn(e, u)));
    // each tooth starts an eighth inside the ring's outer ink rather than on
    // its centre line: it paints the same, and the linter then measures the
    // daylight between teeth that can be seen (0.97) instead of 0.20 inside
    // the ring's own ink
    return [on(c, ring + 0.875, a), e, a];
  });
  return { ring: circlePath(c, ring), teeth: t };
}
/** Distance from a point to the cog's ink. */
function cogInk(p) {
  const { c, ring, tip, teeth } = COG;
  let d = len(sub(p, c)) - (ring + 1);
  for (const a of teeth) {
    const a0 = on(c, ring, a), a1 = on(c, tip, a), ab = sub(a1, a0);
    const t = Math.max(0, Math.min(1, dot(sub(p, a0), ab) / dot(ab, ab)));
    d = Math.min(d, len(sub(p, add(a0, mul(ab, t)))) - 1);
  }
  return d;
}

/**
 * A fold cut back from its free end until its whole run keeps 2 of daylight:
 * its own half width (1) plus 2 from the cog's ink. `from` is the junction on
 * the silhouette, `dir` the sweep toward the free end. Returns null when less
 * than a stub survives.
 */
function trimFold(tail, dir, sharp) {
  const aJ = deg(Math.atan2(tail.J[1] - tail.c[1], tail.J[0] - tail.c[0]));
  let sweep = tail.aEnd - aJ;
  while (dir > 0 && sweep < 0) sweep += 360;
  while (dir < 0 && sweep > 0) sweep -= 360;
  let keep = 0;
  const steps = 400;
  for (let i = 1; i <= steps; i++) {
    const a = aJ + (sweep * i) / steps;
    const p = on(tail.c, tail.r, a);
    // sharp's butt end reaches as far along the tangent as the round cap's disc
    if (cogInk(p) < 3 - 1e-6) break;
    keep = (sweep * i) / steps;
  }
  if (Math.abs(keep) * rad(1) * tail.r < 1) return null;
  const aCut = aJ + keep;
  const path = new Path().M(tail.J).A(tail.c, aJ, aCut, dir);
  if (sharp) {
    const end = on(tail.c, tail.r, aCut), u = mul([-Math.sin(rad(aCut)), Math.cos(rad(aCut))], dir);
    path.L(add(end, mul(u, sharpEndIn(end, u))));
  }
  return String(path);
}

/** The cog knocked out of the fill: the ring's outer ink with the teeth, and the hub back inside it. */
function cogHole(sharp) {
  const { c, ring, tip, teeth } = COG;
  const R = ring + 1, side = deg(Math.asin(1 / R));
  const g = new Path().M(on(c, R, teeth[0] + side));
  const ts = [...teeth, teeth[0] + 360];
  for (let i = 0; i < teeth.length; i++) {
    const a = ts[i], b = ts[i + 1];
    const u = U(b), v = [-u[1], u[0]];
    g.A(c, a + side, b - side, 1);
    const base = (s) => add(on(c, Math.sqrt(R * R - 1), b), mul(v, s));
    if (sharp) {
      const e = on(c, tip, b), k = tip + sharpEndIn(e, u);
      g.L(add(on(c, k, b), mul(v, -1))).L(add(on(c, k, b), mul(v, 1))).L(base(1));
    } else {
      const e = on(c, tip, b);
      g.L(add(e, mul(v, -1)));
      g.A(e, b - 90, b + 90, 1);
      g.L(base(1));
    }
  }
  const outer = String(g) + 'Z';
  const hub = circlePath(c, ring - 1);
  return { outer, hub };
}

const S = (d, sharp) => `<path d="${d}" stroke="black" stroke-width="2" stroke-linecap="${sharp ? 'butt' : 'round'}" stroke-linejoin="round"/>`;
const PL = (d) => `<path d="${d}" fill="black" fill-opacity="0.4"/>`;
const SOE = (d) => `<path d="${d}" fill="black" fill-rule="evenodd" clip-rule="evenodd"/>`;
const doc = (layers) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n${layers.join('\n')}\n</svg>\n`;

export function variants(sharp) {
  const h = hemisphere(sharp);
  const v = brainVariants(sharp);
  const kept = [];
  const dirs = [1, 1, -1];              // u and sa run from their junction back up; sb runs on down
  h.tails.forEach((t, i) => { const d = trimFold(t, dirs[i], sharp); if (d) kept.push(d); });
  const folds = kept.join('') + mirrorD(kept.join(''));
  const cog = cogRuns(sharp);
  const teeth = cog.teeth.map(([a, b]) => `M${P(a)}L${P(b)}`).join('');
  const silhouette = contourPath(v.silSegs);
  const stroke = silhouette + folds + cog.ring + teeth;
  const hole = cogHole(sharp);
  const plate = contourPath(v.plate);
  return {
    stroke: [S(stroke, sharp)],
    'two-tone': [PL(plate), S(stroke, sharp)],
    // only the cog is black: the folds stay in the grey body (his call, 18 Sep 2026)
    duotone: [PL(plate), S(cog.ring + teeth, sharp)],
    fill: [SOE(plate + hole.outer + hole.hub)],
    kept: kept.length,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const dir = join(outArg ? resolve(outArg.slice(6)) : ROOT, 'raw', 'brain-cog');
  mkdirSync(dir, { recursive: true });
  for (const sharp of [false, true]) {
    const vs = variants(sharp);
    console.log(sharp ? 'sharp' : 'regular', 'folds kept', vs.kept, 'of 3 a side');
    for (const style of ['stroke', 'two-tone', 'duotone', 'fill']) {
      const d = doc(vs[style]);
      writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${sharp ? 'sharp' : 'regular'}.svg`), d);
      const b = [Infinity, Infinity, -Infinity, -Infinity];
      for (const m of d.matchAll(/<path d="([^"]+)"([^>]*)>/g)) {
        const q = /stroke=/.test(m[2]) ? strokedBBox(m[1], 1, sharp ? 'butt' : 'round') : strokedBBox(m[1], 0, 'butt');
        b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
      }
      console.log(' ', style.padEnd(9), 'ink', b.map((x) => x.toFixed(3)).join(','));
    }
  }
}
