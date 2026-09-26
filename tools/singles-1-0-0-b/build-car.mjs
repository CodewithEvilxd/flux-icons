/**
 * His second round on car, car-front and fingerprint-pattern, 17 Sep 2026:
 * "try hard to get the fingerprint and cars right. redraw them. current
 * options look very cheap and buggy", with a car front outline, its filled
 * sibling and the Touch ID mark as references. Kept apart from build.mjs
 * while other sessions edit it.
 *   node tools/singles-1-0-0-b/build-car.mjs [--out=DIR]
 *
 * Brought back 17 Sep 2026 for `car` alone ("bring back the car we dropped"):
 * car-front stays dropped and fingerprint-pattern graduated from its own
 * generator, so this writes only `car` unless another name is asked for.
 *
 * car-front  train's front (body 4..20, mirrors 2 out on the belt) under a
 *            glasshouse, the wheels as tabs below the sill, a grille between.
 *            His first outline stood the sides on as legs; his second round of
 *            references (and the other sets) carry tabs, and sides at 3/21 with a
 *            grille at 8..16 shared 45% with one of them. Duotone: belt and
 *            grille black on the plate; fill one solid, windscreen and grille out.
 * car        his own drawing (refs/car.svg, 17 Sep 2026) fitted to the grid: a
 *            round hatchback in profile, tail upright then raked, roof on 5, a
 *            45-degree screen onto a hood rolling into the nose, a B-pillar
 *            running into the belt, wheels at 6 and 17 with the sill meeting
 *            them. Duotone is truck's (the wheels black on the plate); fill
 *            knocks both windows out.
 * fingerprint-pattern  a whorl about (12, 11): a core line inside ridges of 5
 *            and 9 whose legs all sweep left about one centre 17 to the left,
 *            so every pitch holds, as the references he sent share. Broken as
 *            they break: the outer ridge high on the left with a tick below,
 *            the middle ridge at the top and low on the right. Two-tone and
 *            duotone grey the outer ridge; fill is the stroke.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Path, circlePath, onArc, add, sub, mul, unit, fillet } from '../v5/geom.mjs';
import { offsetContour, contourPath, flatten, verify } from '../v5/offset.mjs';
import { subtractContours, unionContours, outlineRun } from '../v6/outline.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
import { run, closed, plate, capsule, solve, S, M, PL, SO, doc } from './build.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const SETS = {};
const set = (name, box, build) => { build.box = box; SETS[name] = build; };
const D = Math.PI / 180;

/** A closed contour pulled in by a unit: a window's daylight. */
const inset = (segs) => offsetContour(segs.map((s) => ({ ...s })), -1);
/**
 * The plate of a polygon carrying zero-width spurs (a mirror standing off the
 * belt): offset a unit, with each spur's half-turn cap set to bulge away from
 * its base, which the offsetter picks the wrong way round for one winding.
 */
function spurPlate(pts, radii, spurs, square = false) {
  const segs = closed(pts, radii, false).segs;
  let off = offsetContour(segs.map((q) => ({ ...q })), 1);
  for (const [tip, base] of spurs) {
    const arc = off.find((q) => q.type === 'A' && Math.hypot(q.c[0] - tip[0], q.c[1] - tip[1]) < 1e-6);
    if (!arc) throw new Error(`spur at ${tip}: no cap`);
    const mid = ((arc.a0 + arc.a1) / 2) * D;
    if (Math.cos(mid) * (base[0] - tip[0]) + Math.sin(mid) * (base[1] - tip[1]) > 0) arc.a1 = arc.a0 - (arc.a1 - arc.a0);
  }
  verify(segs, off, 1, 0.003);
  // sharp: a butt end paints a square to the tip, so the cap becomes one
  if (square) {
    off = off.flatMap((q) => {
      const hit = spurs.find(([tip]) => q.type === 'A' && Math.hypot(q.c[0] - tip[0], q.c[1] - tip[1]) < 1e-6);
      if (!hit) return [q];
      const [tip, base] = hit, d = unit(sub(tip, base));
      const P0 = onArc(q.c, q.r, q.a0), P1 = onArc(q.c, q.r, q.a1);
      return [{ type: 'L', p0: P0, p1: add(P0, d) }, { type: 'L', p0: add(P0, d), p1: add(P1, d) }, { type: 'L', p0: add(P1, d), p1: P1 }];
    });
  }
  return contourPath(off);
}
/** The ink of several runs as loops, each with its bounding box. */
function inkLoops(runs, sharp) {
  const cap = sharp ? 'butt' : 'round';
  const loops = unionContours(runs.map((r) => outlineRun(r.map((s) => ({ ...s })), 1, cap)), runs, 1, cap);
  return loops.map((segs) => {
    const pts = flatten(segs);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return { d: contourPath(segs), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
}

/* ------------------------------------------------------------- car-front */

set('car-front', [1, 3, 23, 21], (sharp) => {
  // train's front: body sides at 4 and 20 with 2-unit mirrors on the belt; a
  // glasshouse on it, the wheels as tabs under the sill, a grille between
  const box = [1, 3, 23, 21];
  const pts = [[8, 17], [8, 20], [4, 20], [4, 9], [7, 4], [17, 4], [20, 9], [20, 20], [16, 20], [16, 17]];
  const radii = [1, 1, 1, 0, 2, 2, 0, 1, 1, 1];
  // one open run seamed in the middle of the sill, so every corner is filleted
  const shell = run([[12, 17], ...pts, [12, 17]], [0, ...radii, 0], { sharp });
  const belt = run([[2, 9], [22, 9]], [], { sharp, free: [true, true], box });
  const grille = run([[9, 13], [15, 13]], [], { sharp, free: [true, true], box });
  const sil = closed(pts, radii, sharp);
  const pl = plate(sil.segs);
  // fill is one solid: the silhouette with each mirror as a spur on the belt,
  // so its offset closes the notch under the pillar the way the belt's ink
  // does, the windscreen's daylight and the grille knocked out
  const spurred = [...pts.slice(0, 4), [2, 9], [4, 9], ...pts.slice(4, 6), [20, 9], [22, 9], ...pts.slice(6)];
  const spurR = [...radii.slice(0, 4), 0, 0, ...radii.slice(4, 6), 0, 0, ...radii.slice(6)].map((r) => (sharp ? 0 : r));
  const solid = spurPlate(spurred, spurR, [[[2, 9], [4, 9]], [[22, 9], [20, 9]]], sharp);
  const windscreen = contourPath(inset(closed([[4, 9], [7, 4], [17, 4], [20, 9]], [0, 2, 2, 0], sharp).segs));
  const all = shell.d + belt.d + grille.d;
  return {
    stroke: [S(all)],
    'two-tone': [PL(pl), S(all)],
    duotone: [PL(pl), S(belt.d + grille.d)],
    fill: [SO(solid + windscreen + capsule(grille.segs, sharp))],
  };
});

/* ------------------------------------------------------------------- car */

set('car', [1, 4, 23, 20], (sharp) => {
  // his drawing in refs/, 17 Sep 2026 ("updated the car in refs/, fix/improve
  // and then apply"), fitted to the grid: a round hatchback, the tail upright
  // then raked through the belt, a flat roof on 5, a screen from the roof's
  // front onto the hood where he lands it (x 18), the belt running on as a
  // hood that drops a third to the nose, a B-pillar that runs into the belt,
  // and every line on the sill meeting a wheel on its own line
  const W = [[6, 17], [17, 17]];
  const rake = 2 + 8 / 3;                        // the tail line (2,13)-(x,5) crosses the belt at 3
  const hood = (x) => 10 + (x - 16) / 3;         // (16,10) to the nose at (22,12)
  const J = [18, hood(18)];                      // the screen's foot
  const prof = [[2, 17], [2, 13], [rake, 5], [13, 5], J, [22, 12], [22, 17]];
  const R = sharp ? prof.map(() => 0) : [1, 4, 2, 2, 0, 2, 1];
  const r1 = sharp ? 0 : 4;                      // where the belt turns down into the hood
  const body = run([[4, 17], ...prof, [19, 17]], [0, ...R, 0]);
  const sill = run([[8, 17], [15, 17]]);
  const belt = run([[3, 10], [16, 10], J], [0, r1, 0]);
  const pillar = sharp ? run([[9, 5], [9, 10]]) : run([[9, 5], [9, 10], [11, 10]], [0, 2, 0]);
  const wheels = W.map((c) => circlePath(c, 2)).join('');
  const sil = closed(prof, R, false);
  const pl = plate(sil.segs);
  // fill: the body solid with each wheel's disc taken out to its line, so the
  // stroked wheel closes on it and keeps its hub; windows either side of the pillar
  const bite = W.map((c) => offsetContour([{ type: 'A', c, r: 2, a0: 0, a1: 360 }], 0));
  const solid = subtractContours(offsetContour(sil.segs.map((q) => ({ ...q })), 1), bite).map((l) => contourPath(l)).join('');
  // the daylight is the cabin pulled in a unit, its fillets a unit tighter; the
  // screen's foot is a narrow wedge the ink fills, so the front pane closes on
  // the belt where the screen's inner edge reaches it. The pillar's inner edge
  // runs into the belt's tangentially, which no subtraction takes, so each pane
  // is drawn as its own polygon
  const [A, B, C] = inset(closed([[3, 10], [rake, 5], [13, 5], [18, 10]], [0, 0, 0, 0], false).segs).map((q) => q.p0);
  const screenIn = (y) => C[0] + ((y - C[1]) * (J[0] - 13)) / (J[1] - 5);
  const pane = (pts, radii) => contourPath(closed(pts, radii, false).segs);
  const windows = pane([A, B, [8, 6], [8, 9]], [0, Math.max(0, R[2] - 1), 0, 0]) + pane([[10, 9], [10, 6], [screenIn(6), 6], [screenIn(9), 9]], [sharp ? 0 : 1, 0, Math.max(0, R[3] - 1), 0]);
  const all = body.d + sill.d + belt.d + pillar.d + wheels;
  return {
    stroke: [S(all)],
    'two-tone': [PL(pl), S(all)],
    duotone: [PL(pl), S(wheels)],
    fill: [SO(solid + windows), S(wheels)],
  };
});

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
  const outer = P(9, sA(9, 218), sY(9, 1, 17)) + P(9, sA(9, 180), sA(9, 188));
  const middle = P(5, sY(5, -1, 19), sA(5, 290)) + P(5, sA(5, 338), sY(5, 1, 13)) + P(5, sY(5, 1, 17), sY(5, 1, 22));
  const core = P(0, sY(0, 1, 11), sY(0, 1, 22));
  return {
    stroke: [S(outer + middle + core)],
    'two-tone': [M(outer), S(middle + core)],
    duotone: [M(outer), S(middle + core)],
    fill: [S(outer + middle + core)],
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
  const named = args.filter((a) => !a.startsWith('--'));
  const want = named.length ? named : ['car'];
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
