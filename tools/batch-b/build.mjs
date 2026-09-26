/**
 * Batch B of v0.8.0: the AI and science names from the month's empty searches.
 *   node tools/batch-b/build.mjs [name ...] [--out=DIR] [--alts]
 *
 * brain, brain-circuit, bot, radar, flask-conical (was flask), thermometer,
 * lungs, ear, earbuds, hand-pointer; and from 13 Sep 2026 flask-round, test-tube,
 * test-tube-diagonal, test-tubes and flask-conical-off. Built on the v5 libraries the way tools/charts/build.mjs is:
 * every closed body is lines and circular arcs so its plate is an exact offset
 * checked sample by sample, every knockout is wound against its plate, every
 * sharp free end goes through `sharpEndIn`, and a T-junction is never extended.
 * The names are the brief and nothing else; the reference set's drawings were
 * fetched only for the multiply-overlay check after drawing.
 *
 * `--alts` also writes the alternates that were rendered and rejected, so the
 * comparison sheet can be rebuilt: they never go to raw/.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeSet } from '../v5/raw.mjs';
import { offsetContour, contourPath, verify, flatten, mirrorSegs, clipContour } from '../v5/offset.mjs';
import { Path, polyContour, circlePath, filletArcArc, filletLineArc, circleCross, add, sub, mul, unit, len, dot } from '../v5/geom.mjs';
import { sharpEndIn } from '../v5/icons.mjs';
import { outlineRun } from '../v6/outline.mjs';
import { brainVariants, tailSlot } from './brain.mjs';
import * as r2 from './round2.mjs';
import { handPointer } from './hands.mjs';
import { flaskRound, testTube, testTubes, testTubeDiagonal, FLASK_ROUND_BOX, TEST_TUBE_BOX, TEST_TUBES_BOX, TEST_TUBE_DIAGONAL_BOX } from './glass.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const S = (d) => ({ kind: 'stroke', d: String(d) });
const F_ = (d) => ({ kind: 'solid', d: String(d) });
const P = (d) => ({ kind: 'plate', d: String(d) });

/* ------------------------------------------------------------- helpers */

function num(v) {
  if (!Number.isFinite(v)) throw new Error(`non-finite coordinate: ${v}`);
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
}
const pt = (p) => `${num(p[0])} ${num(p[1])}`;
const runPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('');
const lineSegs = (pts) => pts.slice(1).map((p, i) => ({ type: 'L', p0: pts[i], p1: p }));
const ang = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
const rad = (a) => (a * Math.PI) / 180;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
const mirX = (p) => [24 - p[0], p[1]];

const areaOf = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
const reverseSeg = (g) =>
  g.type === 'L' ? { type: 'L', p0: g.p1, p1: g.p0 } : { type: 'A', c: g.c, r: g.r, a0: g.a1, a1: g.a0 };
const windingOf = (segs) => Math.sign(areaOf(flatten(segs, 24)));
/** `segs` wound AGAINST `plateSegs`, so it cuts under the non-zero rule. */
const hole = (plateSegs, segs) =>
  contourPath(windingOf(plateSegs) === windingOf(segs) ? [...segs].reverse().map(reverseSeg) : segs);
/** `segs` wound WITH `plateSegs`, so it paints again inside a hole. */
const solidOn = (plateSegs, segs) =>
  contourPath(windingOf(plateSegs) === windingOf(segs) ? segs : [...segs].reverse().map(reverseSeg));
const circleSegs = (c, r) => [0, 90, 180, 270].map((a) => ({ type: 'A', c, r, a0: a, a1: a + 90 }));

/** The plate for a closed contour: offset a unit, and checked. */
function plateOf(segs) {
  const off = offsetContour(segs, 1);
  verify(segs, off, 1);
  return off;
}

/**
 * A polyline whose free ends sharp pushes out, so the butt cap paints where
 * the round cap's disc reached. `ends` says which of the two are free; an end
 * that lands on another stroke, a bead or a body stays put. `box` is the box
 * the rounded drawing paints, which clamps a diagonal end's corners.
 */
function sharpen(pts, ends = [true, true], box = [1, 1, 23, 23]) {
  const p = pts.map((q) => [...q]);
  if (ends[0]) {
    const dir = unit(sub(p[0], p[1]));
    p[0] = add(p[0], mul(dir, sharpEndIn(p[0], dir, box)));
  }
  if (ends[1]) {
    const last = p.length - 1;
    const dir = unit(sub(p[last], p[last - 1]));
    p[last] = add(p[last], mul(dir, sharpEndIn(p[last], dir, box)));
  }
  return p;
}
const run = (pts, sharp, ends = [true, true], box) => runPath(sharp ? sharpen(pts, ends, box) : pts);
/** The knockout of one open run, outlined with the treatment's cap. */
const runHole = (plate, pts, sharp) => hole(plate, outlineRun(lineSegs(pts), 1, sharp ? 'butt' : 'round'));

/**
 * The concave fillet of radius `r` between a line (through P, unit direction
 * u, white on the side `nrm` points to) and a circle (centre C, radius R) it
 * is tangent to or nearly meets from outside: the fillet's centre sits `r` off
 * the line on the white side and `R + r` from the circle's centre.
 */
function filletLineCircleOut(P, u, nrm, C, R, r) {
  const q = sub(add(P, mul(nrm, r)), C);
  const b = 2 * dot(q, u), c = dot(q, q) - (R + r) * (R + r);
  const disc = b * b - 4 * c;
  if (disc < 0) throw new Error('no concave fillet between that line and circle');
  const roots = [(-b - Math.sqrt(disc)) / 2, (-b + Math.sqrt(disc)) / 2];
  // the root nearer the line's own point is the corner being rounded
  const s = roots.reduce((p, v) => (Math.abs(v) < Math.abs(p) ? v : p));
  const F = add(add(P, mul(u, s)), mul(nrm, r));
  return { F, T: add(P, mul(u, s)), A: add(C, mul(sub(F, C), R / (R + r))) };
}

/**
 * The outline of a union of discs, walked clockwise on screen through the
 * notch between each pair of neighbours, with a concave fillet of `rf` in
 * every notch (a true crossing at 0). `circles` is [{c, r}] in outline order.
 */
function unionOfCircles(circles, rf) {
  const n = circles.length;
  const centroid = mul(circles.reduce((a, k) => add(a, k.c), [0, 0]), 1 / n);
  const notches = circles.map((a, i) => {
    const b = circles[(i + 1) % n];
    const mid = mul(add(a.c, b.c), 0.5);
    const toward = add(mid, mul(unit(sub(mid, centroid)), 100));
    if (rf > 1e-9) {
      const f = filletArcArc(a.c, a.r, b.c, b.r, rf, toward);
      return { F: f.F, onA: f.onB, onB: f.onT };
    }
    const X = circleCross(a.c, a.r, b.c, b.r, toward);
    return { onA: X, onB: X };
  });
  const p = new Path().M(notches[n - 1].onB);
  for (let i = 0; i < n; i++) {
    const k = circles[i];
    const start = notches[(i + n - 1) % n].onB, end = notches[i].onA;
    p.A(k.c, ang(k.c, start), ang(k.c, end), 1);
    if (rf > 1e-9) p.A(notches[i].F, ang(notches[i].F, end), ang(notches[i].F, notches[i].onB), -1);
  }
  return { path: p.Z(), notches };
}

/** Assert the painted box of a variant set against the box the drawing was solved for. */
function inkOf(layers, cap) {
  const strokes = layers.filter((l) => l.kind === 'stroke').map((l) => l.d).join('');
  const b = strokes ? strokedBBox(strokes, 1, cap) : [Infinity, Infinity, -Infinity, -Infinity];
  for (const l of layers.filter((l) => l.kind !== 'stroke')) {
    const q = strokedBBox(l.d, 0, 'butt');
    b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
  }
  return b;
}
function assertBox(name, variants, want, tol = 0.01) {
  for (const [key, layers] of Object.entries(variants)) {
    const b = inkOf(layers, key.endsWith('sharp') ? 'butt' : 'round');
    const off = Math.max(...b.map((v, i) => Math.abs(v - want[i])));
    if (off > tol) throw new Error(`${name} ${key}: box ${b.map((v) => v.toFixed(3)).join(', ')} wants ${want.join(', ')}`);
  }
}

const SETS = {};
const ALTS = {};

/* ----------------------------------------------------------------- brain */

/**
 * Zafar's drawing of 13 Sep 2026, fitted: the construction and what was fixed
 * are in `brain.mjs`. Two hemispheres of seven lobes on true arcs, one fissure
 * on x=12, ink 1..23 both ways: 22 x 22, the circle size.
 */
SETS.brain = () => {
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    const v = brainVariants(sharp);
    out[`stroke.${key}`] = [S(v.d)];
    out[`duotone.${key}`] = [P(contourPath(v.plate)), S(v.d)];
    out[`fill.${key}`] = [F_(v.fill)];
  }
  assertBox('brain', out, [1, 1, 23, 23]);
  return out;
};

/* --------------------------------------------------------- brain-circuit */

/**
 * `brain`'s left hemisphere, path for path, with the fissure as its medial
 * wall, and on the right three traces leaving the fissure on a 4.5 pitch
 * (y 7.5, 12, 16.5), each ending in a bead: filled r=1.5, painting 3, the dot
 * ladder's "an element of its own", the trace ending ON its bead's centre so
 * the round cap is swallowed. The outer beads sit at x=21.5, putting the ink on
 * 23 to mirror the hemisphere's 1, so the icon is brain's own 22 x 22; the
 * middle one at 18.5, 2 clear of both outer traces and 2.4 of their beads.
 *
 * The plate is the hemisphere closed along the fissure and offset by 1; the
 * fill knocks the hemisphere's folds out exactly as `brain` does and leaves the
 * traces stroked and the beads solid.
 */
const TRACES = [[7.5, 21.5], [12, 18.5], [16.5, 21.5]];
SETS['brain-circuit'] = () => {
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    const v = brainVariants(sharp);
    const h = v.h;
    const closed = [...h.sil.segs, { type: 'L', p0: h.bottom, p1: h.top }];
    const body = contourPath(closed) + h.free.map(String).join('');
    const plate = plateOf(closed);
    const traces = TRACES.map(([y, x]) => run([[12, y], [x, y]], sharp, [false, false])).join('');
    const beads = TRACES.map(([y, x]) => circlePath([x, y], 1.5)).join('');
    // the folds knocked out of the hemisphere exactly as brain's fill does
    const holes = v.holes.map((q) => hole(plate, q)).join('');
    out[`stroke.${key}`] = [S(body + traces), F_(beads)];
    out[`duotone.${key}`] = [P(contourPath(plate)), S(body + traces), F_(beads)];
    out[`fill.${key}`] = [F_(contourPath(plate) + holes), S(traces), F_(beads)];
  }
  assertBox('brain-circuit', out, [1, 1, 23, 23]);
  return out;
};

/* ------------------------------------------------------------------- bot */

/**
 * A robot's head: the house body on r=3 at 4..20 by 8..21, an antenna that is
 * a stem up to a bead (the bead's ink 2..5 clears the body's 7 by 2, and the
 * stem runs through the gap as the piece joining them), ears as 2-unit stubs
 * on the walls at the body's own mid-height, two eyes and a mouth. The eyes
 * are `scan-face`'s ticks, a unit long on 9 and 15 (ink 11..14), so the mouth
 * at 17 clears them by 2 and the floor's inner ink at 20 by 2; beads reach 15
 * and leave the mouth no row, and were rendered without one as the alternate.
 * Ink 1..23 by 2..22.
 *
 * The fill knocks the eyes and mouth out as slots and keeps the antenna and
 * ears stroked outside the solid, the `gift` pattern.
 */
const BOT_BOX = [1, 2, 23, 22];
function botParts(sharp, { eyes = 'marks' } = {}) {
  const body = polyContour([[4, 8], [20, 8], [20, 21], [4, 21]], sharp ? [0, 0, 0, 0] : [3, 3, 3, 3]);
  const plate = plateOf(body.segs);
  const stem = run([[12, 8], [12, 3.5]], sharp, [false, false]);
  const ears = run([[2, 14.5], [4, 14.5]], sharp, [true, false], BOT_BOX) + run([[22, 14.5], [20, 14.5]], sharp, [true, false], BOT_BOX);
  const antenna = circlePath([12, 3.5], 1.5);
  // eyes: the house face's ticks, a unit long, on 9 and 15; or beads for the alternate
  const ticks = eyes === 'ticks' ? [[[9, 12], [9, 13]], [[15, 12], [15, 13]]] : null;
  const eyeC = eyes === 'ticks' ? [] : [[9, 13.5], [15, 13.5]];
  const eyeD = eyeC.map((c) => circlePath(c, 1.5)).join('');
  const mouth = eyes === 'ticks' ? [[9, 17], [15, 17]] : null;
  const eyeRuns = ticks ? ticks.map((t) => run(t, sharp, [true, true], BOT_BOX)).join('') : '';
  const strokes = body.toString() + stem + ears + eyeRuns + (mouth ? run(mouth, sharp, [true, true], BOT_BOX) : '');
  const holes = eyeC.map((c) => hole(plate, circleSegs(c, 1.5))).join('')
    + (ticks ? ticks.map((t) => runHole(plate, t, sharp)).join('') : '') + (mouth ? runHole(plate, mouth, sharp) : '');
  return { body, plate, stem, ears, antenna, eyeD, strokes, holes };
}
function botSet(opts) {
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    const b = botParts(sharp, opts);
    out[`stroke.${key}`] = [S(b.strokes), F_(b.antenna + b.eyeD)];
    out[`duotone.${key}`] = [P(contourPath(b.plate)), S(b.strokes), F_(b.antenna + b.eyeD)];
    out[`fill.${key}`] = [F_(contourPath(b.plate) + b.holes), S(b.stem + b.ears), F_(b.antenna)];
  }
  assertBox('bot', out, BOT_BOX);
  return out;
}
SETS.bot = () => botSet({ eyes: 'ticks' });
ALTS['bot-beads'] = () => botSet({ eyes: 'beads' });

/* ----------------------------------------------------------------- radar */

/**
 * A radar scope: the r=10 ring, an inner ring at r=6 (the gap ladder's 4
 * pitch, 2 of daylight), a bead at the centre and the sweep from the centre to
 * the rim at 45 degrees up-right, the free diagonal's direction. The bead is
 * what keeps it from reading as a target: a target's centre is a ring.
 *
 * Both rings are cut open behind the sweep, Zafar's drawing of 13 Sep 2026:
 * each ring leaves the sweep (the outer from its tip, the inner from where the
 * sweep crosses it, both buried) and runs the long way round, stopping on the
 * clockwise side with its cap 2 clear of the sweep's ink. A round cap on radius
 * R clears the sweep by R sin(d) - 2, so the ring stops d = asin(4 / R) short of
 * it: 23.58 degrees on the outer ring, 41.81 on the inner. Sharp stops each ring
 * where its butt cap's nearer corner lands on the same 2, the `message-dot`
 * rule, with the corner-rule stub on the end.
 *
 * Cut open, nothing in the drawing closes, so it owes no fill and ships stroke
 * and duotone the way `wifi` and `signal` do. The duotone mutes the inner ring:
 * the rim, the sweep and the bead are the reading, the range ring is context.
 */
SETS.radar = () => {
  const C = [12, 12];
  const A = -45;                                   // the sweep's angle
  const d = [Math.cos(rad(A)), Math.sin(rad(A))];
  const toward = [Math.cos(rad(A + 90)), Math.sin(rad(A + 90))];   // the clockwise side, where the cut is
  const E = add(C, mul(d, 10));
  const side = (p) => dot(sub(p, C), toward);       // perpendicular distance from the sweep's line, cut side positive
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    // where a ring stops: regular, its cap's disc 2 clear; sharp, its butt cap's nearer corner 2 clear
    const tip = (R, a) => {
      const p = on(C, R, a), t = [Math.sin(rad(a)), -Math.cos(rad(a))];   // away from the ring, at its free end
      const q = add(p, mul(t, sharpEndIn(p, t)));
      const n = [Math.cos(rad(a)), Math.sin(rad(a))];
      return { p, q, corner: Math.min(side(add(q, n)), side(sub(q, n))) };
    };
    const stop = (R) => {
      if (!sharp) return A + (Math.asin(4 / R) * 180) / Math.PI;
      let lo = A + 1, hi = A + 89;
      for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (tip(R, m).corner < 3) lo = m; else hi = m; }
      return hi;
    };
    const eo = stop(10), ei = stop(6);
    // the outer ring from its free end round into the sweep's tip, then down the sweep: one run
    const rim = new Path().M(sharp ? tip(10, eo).q : tip(10, eo).p);
    if (sharp) rim.L(tip(10, eo).p);
    rim.A(C, eo, A + 360, 1).L(C);
    // the inner ring from the sweep, where it is buried, round to its free end
    const inner = new Path().M(on(C, 6, A)).A(C, A, ei - 360, -1);
    if (sharp) inner.L(tip(6, ei).q);
    const clear = (R, e) => (sharp ? tip(R, e).corner : side(on(C, R, e)) - 1) - 1;
    if (Math.abs(clear(10, eo) - 2) > 1e-6 || Math.abs(clear(6, ei) - 2) > 1e-6) throw new Error('radar: a ring cut is not 2 clear of the sweep');
    const bead = circlePath(C, 1.5);
    out[`stroke.${key}`] = [S(String(rim) + inner), F_(bead)];
    out[`duotone.${key}`] = [{ kind: 'muted', d: String(inner) }, S(rim), F_(bead)];
  }
  assertBox('radar', out, [1, 1, 23, 23]);
  return out;
};

/* --------------------------------------------------------- flask-conical */

/**
 * The conical flask (`flask` until 13 Sep 2026): a 5-wide neck (walls 9.5 and 14.5, so the interior is 3
 * and survives 16px) from a lip at y=2 down to shoulders at y=8, flaring to a
 * base at y=22 whose corners turn on r=2 (fill 3). The base's half-width is
 * solved so the painted flare lands on x=3 and 21: 18 x 22, the vertical size.
 * Neck corners and shoulders take r=1 (the shoulders are reflex, so their
 * plate trims to a corner). The lip is a separate 8..16 bar over the neck's
 * top edge, the liquid a rule at y=18 ending on both flare centre lines.
 *
 * The fill opens the panel above the liquid, `bars-progress`'s move: the
 * neck's and flare's inner ink down to the liquid's ink at 17, with the lip
 * stroked over the top. Below the liquid the flask is solid.
 */
const FLASK_BOX = [3, 1, 21, 23];
function flaskGeom(sharp) {
  const R = sharp ? 0 : 1, RB = sharp ? 0 : 2;
  const body = (xb) => polyContour(
    [[9.5, 2], [14.5, 2], [14.5, 8], [24 - xb, 22], [xb, 22], [9.5, 8]],
    [R, R, R, RB, RB, R]);
  // each treatment solves its own base vertex onto the box: a de-filleted
  // corner reaches further than the arc it replaced, so sharp's vertex sits in
  let xb = 4, lo = 2, hi = 6;
  for (let i = 0; i < 60; i++) { xb = (lo + hi) / 2; if (strokedBBox(body(xb).d, 1, sharp ? 'butt' : 'round')[0] > FLASK_BOX[0]) hi = xb; else lo = xb; }
  const t = body(xb);
  const xAt = (y) => 9.5 + ((xb - 9.5) * (y - 8)) / 14;   // left flare centre line
  const u = unit([xb - 9.5, 14]);
  const nIn = [u[1], -u[0]];                                  // into the flask, for the left flare
  return { t, xb, xAt, u, nIn };
}
/**
 * The conical flask's panel: the neck's and flare's inner ink down to the
 * liquid's ink at 17. Where the neck meets the flare the stroke turns on a
 * reflex corner, so its inner ink is an arc, not the two inner lines' crossing:
 * the fillet's own centre at radius 2 rounded, the vertex at radius 1 sharp (the
 * round join's disc). The crossing stood 0.05 and 0.018 into the rim until
 * 13 Sep 2026, which is what `plate-flank-sweep` found.
 */
function conicalPanel(t, sharp, nIn, u) {
  const shoulder = (right) => {
    if (sharp) return { c: [right ? 14.5 : 9.5, 8], r: 1 };
    const g = t.segs.find((q) => q.type === 'A' && Math.abs(q.r - 1) < 1e-9 && Math.abs(q.c[1] - 7.8) < 0.3 && (right ? q.c[0] > 12 : q.c[0] < 12));
    if (!g) throw new Error('conical flask: no shoulder fillet');
    return { c: g.c, r: 2 };
  };
  const R = shoulder(true), L = shoulder(false);
  const nR = [-nIn[0], nIn[1]];                              // the right flare's inward normal
  const aRn = ang([0, 0], nR), aLn = ang([0, 0], nIn);
  const S0 = add([9.5, 8], nIn);                             // a point on the left inner flare line
  const xL17 = S0[0] + ((17 - S0[1]) / u[1]) * u[0];
  const onR = add(R.c, mul(nR, R.r)), onL = add(L.c, mul(nIn, L.r));
  return [
    { type: 'L', p0: [10.5, 3], p1: [13.5, 3] },
    { type: 'L', p0: [13.5, 3], p1: [13.5, R.c[1]] },
    { type: 'A', c: R.c, r: R.r, a0: 180, a1: aRn },
    { type: 'L', p0: onR, p1: [24 - xL17, 17] },
    { type: 'L', p0: [24 - xL17, 17], p1: [xL17, 17] },
    { type: 'L', p0: [xL17, 17], p1: onL },
    { type: 'A', c: L.c, r: L.r, a0: aLn, a1: 0 },
    { type: 'L', p0: [10.5, L.c[1]], p1: [10.5, 3] },
  ];
}

SETS['flask-conical'] = () => {
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    const { t, xAt, u, nIn } = flaskGeom(sharp);
    const plate = plateOf(t.segs);
    const lip = run([[8, 2], [16, 2]], sharp, [true, true], FLASK_BOX);
    const liquid = run([[xAt(18), 18], [24 - xAt(18), 18]], sharp, [false, false]);
    // the panel: inner ink of neck and flare above the liquid's ink at 17
    const panel = conicalPanel(t, sharp, nIn, u);
    const d = t.toString() + lip + liquid;
    out[`stroke.${key}`] = [S(d)];
    out[`duotone.${key}`] = [P(contourPath(plate)), S(d)];
    out[`fill.${key}`] = [F_(contourPath(plate) + hole(plate, panel)), S(lip)];
  }
  assertBox('flask-conical', out, FLASK_BOX);
  return out;
};

/* ----------------------------------------------------- flask-conical-off */

/**
 * `flask-conical` under the house slash, `M2 2L22 22`, cut the one-sided way
 * (`u = x - y`): the base runs into the slash and buries on its centre line on
 * the lower left (u = 0), and stands off 2 units of daylight on the upper right
 * (u = 4 sqrt 2). What survives is two pieces. The near piece is the flask's
 * foot, from the right flare's crossing round the base to the left flare's,
 * with the liquid running from the left flare onto the slash at (18, 18). The
 * far piece is the neck: the left wall from its cut at y = 9.5 - 4 sqrt 2 up
 * over the mouth and down the right wall and shoulder to the right flare's cut.
 * The lip clears the slash on its own (its left cap's centre sits at u = 6).
 *
 * Duotone: the near side keeps the full drawing over its plate, clipped on the
 * slash's centre line; the far side goes muted, as 40% strokes (the neck and
 * the lip), `file-off`'s choice for a far side that is an outline. Fill: the
 * near piece is the flask's fill clipped on the centre line; the far piece is
 * the neck's own band, which is all of the flask's fill that stands there, since
 * the panel opens the whole neck: round-capped where the stroke is (the plate
 * leaves the cap 1 from the cut, the `bell-dot` construction, so it traces the
 * cap exactly), and in sharp the base silhouette clipped straight on
 * u = 3 sqrt 2. Sharp's far stroke ends take the stub that puts the nearer butt
 * corner 2.586 from the slash's centre line, the value `file-off`'s walls hold.
 */
const SQ2 = Math.SQRT2;
const uOf = (p) => p[0] - p[1];
/** Where a straight seg crosses u = k, as a point, or null. */
function crossU(seg, k) {
  if (seg.type !== 'L') return null;
  const a = uOf(seg.p0) - k, b = uOf(seg.p1) - k;
  if (a * b > 0 || a === b) return null;
  const t = a / (a - b);
  return add(seg.p0, mul(sub(seg.p1, seg.p0), t));
}
/** Offsets of an open run of tangent-continuous segs, one side. */
function offsetRun(segs, side) {
  const out = [];
  for (const g of segs) {
    if (g.type === 'L') {
      const d = unit(sub(g.p1, g.p0)), n = mul([-d[1], d[0]], side);
      out.push({ type: 'L', p0: add(g.p0, n), p1: add(g.p1, n) });
    } else {
      const sw = Math.sign(g.a1 - g.a0), r = g.r - sw * side;
      if (r > 1e-9) out.push({ type: 'A', c: g.c, r, a0: g.a0, a1: g.a1 });
    }
  }
  return out;
}
const startOf = (g) => (g.type === 'L' ? g.p0 : on(g.c, g.r, g.a0));
const endOf = (g) => (g.type === 'L' ? g.p1 : on(g.c, g.r, g.a1));
const tanOf = (g, at) => {
  if (g.type === 'L') return unit(sub(g.p1, g.p0));
  const a = at === 0 ? g.a0 : g.a1, sw = Math.sign(g.a1 - g.a0);
  return mul([-Math.sin(rad(a)), Math.cos(rad(a))], sw);
};
/** The band of an open run as one closed contour, round or butt capped. */
function bandOf(segs, round) {
  const L = offsetRun(segs, 1), R = offsetRun(segs, -1).reverse().map(reverseSeg);
  const e = endOf(segs[segs.length - 1]), s0 = startOf(segs[0]);
  const te = tanOf(segs[segs.length - 1], 1), ts = tanOf(segs[0], 0);
  const out = [...L];
  const cap = (c, from, to, through) => {
    if (!round) return [{ type: 'L', p0: from, p1: to }];
    const a0 = ang(c, from), mid = (Math.atan2(through[1], through[0]) * 180) / Math.PI;
    const dir = (((mid - a0) % 360) + 360) % 360 < 180 ? 1 : -1;
    return [{ type: 'A', c, r: 1, a0, a1: a0 + 180 * dir }];
  };
  out.push(...cap(e, endOf(L[L.length - 1]), startOf(R[0]), te));
  out.push(...R);
  out.push(...cap(s0, endOf(R[R.length - 1]), startOf(L[0]), mul(ts, -1)));
  return out;
}
SETS['flask-conical-off'] = () => {
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    const { t, xAt, u, nIn } = flaskGeom(sharp);
    const segs = t.segs;
    const n = segs.length;
    const FAR = 4 * SQ2;
    // indices: the left wall runs up into the top-left corner, which is where the contour closes
    const idx = (pred) => segs.findIndex(pred);
    const leftWall = idx((g) => g.type === 'L' && Math.abs(g.p0[0] - 9.5) < 1e-9 && Math.abs(g.p1[0] - 9.5) < 1e-9);
    const rightFlare = idx((g) => g.type === 'L' && g.p0[0] > 14 && g.p1[0] > g.p0[0] + 2 && g.p1[1] > g.p0[1] + 5);
    if ([leftWall, rightFlare].includes(-1)) throw new Error('flask-conical-off: contour not as expected');
    // the first crossing of u = k walking forward from seg i, on a line or an arc: [index, point, head, tail]
    const splitAt = (g, k) => {
      const f = (q) => uOf(q) - k;
      if (g.type === 'L') {
        const a = f(g.p0), b = f(g.p1);
        if (a * b > 0 || a === b) return null;
        const q = add(g.p0, mul(sub(g.p1, g.p0), a / (a - b)));
        return { q, head: { type: 'L', p0: g.p0, p1: q }, tail: { type: 'L', p0: q, p1: g.p1 } };
      }
      const at = (tt) => on(g.c, g.r, g.a0 + (g.a1 - g.a0) * tt);
      if (f(at(0)) * f(at(1)) > 0) return null;
      let lo = 0, hi = 1;
      for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(at(lo)) * f(at(m)) <= 0) hi = m; else lo = m; }
      let am = g.a0 + (g.a1 - g.a0) * lo;
      // a crossing a hair off a cardinal would leave a sliver of arc that the emitter splits
      // there, a zero-length cubic Figma drops: take the cardinal, a thousandth inside the band
      const card = Math.round(am / 90) * 90;
      if (Math.abs(am - card) < 0.5 && Math.abs(uOf(on(g.c, g.r, card)) - k) < 0.01) am = card;
      return { q: on(g.c, g.r, am), head: { ...g, a1: am }, tail: { ...g, a0: am } };
    };
    const firstCross = (from, k) => {
      for (let j = 0; j < n; j++) { const i = (from + j) % n; const hit = splitAt(segs[i], k); if (hit) return { i, ...hit }; }
      throw new Error('no crossing of u = ' + k);
    };
    const cL = splitAt(segs[leftWall], FAR), cR = splitAt(segs[rightFlare], FAR);
    if (!cL || !cR) throw new Error('flask-conical-off: a far cut misses its wall');
    const cutL = cL.q, cutR = cR.q;
    // far run: cutL up the left wall, round the mouth, down to cutR
    const far = [cL.tail];
    for (let i = (leftWall + 1) % n; i !== rightFlare; i = (i + 1) % n) far.push(segs[i]);
    far.push(cR.head);
    // near run: from the first u = 0 crossing past the far cut, round the base, to the next one
    const nR = firstCross(rightFlare, 0), nL = firstCross((nR.i + 1) % n, 0);
    const near = [nR.tail];
    for (let i = (nR.i + 1) % n; i !== nL.i; i = (i + 1) % n) near.push(segs[i]);
    near.push(nL.head);
    // sharp: the far ends take the stub that puts the nearer butt corner 2.586 off the slash
    const TARGET = 3.6569;                                           // in u, = 2.5858 perpendicular
    const stub = (p, dir) => {
      const nrm = [-dir[1], dir[0]];
      const corner = (k) => Math.min(uOf(add(add(p, mul(dir, k)), nrm)), uOf(sub(add(p, mul(dir, k)), nrm)));
      let lo = 0, hi = 3;
      for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (corner(m) > TARGET) lo = m; else hi = m; }
      return add(p, mul(dir, lo));
    };
    const farStroke = sharp
      ? [{ type: 'L', p0: stub(cutL, [0, 1]), p1: cutL }, ...far, { type: 'L', p0: cutR, p1: stub(cutR, unit(sub(segs[rightFlare].p1, segs[rightFlare].p0))) }]
      : far;
    const farD = contourPath(farStroke, false);
    const nearD = contourPath(near, false);
    const liquid = `M${pt([xAt(18), 18])}L18 18`;
    const lip = run([[8, 2], [16, 2]], sharp, [true, true], [1, 1, 23, 23]);
    const slash = sharp ? 'M1.7071 1.7071L22.2929 22.2929' : 'M2 2L22 22';
    // standoffs, asserted: every far end's ink 2 clear of the slash's
    for (const p of [cutL, cutR]) if (Math.abs(uOf(p) / SQ2 - 4) > 1e-9) throw new Error('far cut off its standoff');
    // plates and fills
    const plate = plateOf(segs);
    const SL = unit([1, -1]);
    const nearPlate = clipContour(plate, [0, 0], SL, 0, -1)[0];
    const panel = conicalPanel(t, sharp, nIn, u);
    const nearPanel = clipContour(panel, [0, 0], SL, 0, -1)[0];
    let farFill;
    let farPanel = null;
    if (sharp) {
      // the base silhouette clipped straight on u = 3 sqrt 2, less the panel clipped the same way
      farFill = clipContour(plate, [0, 0], SL, 3, 1)[0];
      farPanel = clipContour(panel, [0, 0], SL, 3, 1)[0];
    } else {
      farFill = bandOf(far, true);
    }
    const fillD = contourPath(nearPlate) + hole(nearPlate, nearPanel) + contourPath(farFill) + (farPanel ? hole(farFill, farPanel) : '');
    out[`stroke.${key}`] = [S(nearD + liquid + farD + lip + slash)];
    out[`duotone.${key}`] = [P(contourPath(nearPlate)), { kind: 'muted', d: farD + lip }, S(nearD + liquid + slash)];
    out[`fill.${key}`] = [F_(fillD), S(lip + slash)];
  }
  assertBox('flask-conical-off', out, [1, 1, 23, 23]);
  return out;
};

/* ------------------------------------------------------ round two, 13 Sep */

// Zafar's refs fitted: see `round2.mjs`. Each maker returns { box, variants } for one treatment.
function fromRound2(name, make) {
  const a = make(false), b = make(true);
  const out = { ...a.variants, ...b.variants };
  assertBox(name, out, a.box);
  return out;
}
SETS['ear-listen'] = () => fromRound2('ear-listen', r2.earListen);
SETS['ear-waveform'] = () => fromRound2('ear-waveform', r2.earWaveform);
SETS.airpods = () => fromRound2('airpods', r2.airpods);
for (const level of ['empty', 'quarter', 'half', 'full']) SETS[`temperature-${level}`] = () => fromRound2(`temperature-${level}`, r2.temperature(level));
SETS['temperature-high'] = () => fromRound2('temperature-high', r2.temperatureHigh);
SETS['thermometer-sun'] = () => fromRound2('thermometer-sun', r2.thermometerSun);
SETS['thermometer-snowflake'] = () => fromRound2('thermometer-snowflake', r2.thermometerSnowflake);
SETS['airpods-open'] = () => fromRound2('airpods-open', r2.airpodsOpen);

/* ------------------------------------------------------ the glass family */

// flask-round, test-tube, test-tube-diagonal and test-tubes: see `glass.mjs`
const both = (fn) => ({ ...fn(false), ...fn(true) });
SETS['flask-round'] = () => { const o = both(flaskRound); assertBox('flask-round', o, FLASK_ROUND_BOX); return o; };
SETS['test-tube'] = () => { const o = both(testTube); assertBox('test-tube', o, TEST_TUBE_BOX); return o; };
SETS['test-tubes'] = () => { const o = both(testTubes); assertBox('test-tubes', o, TEST_TUBES_BOX); return o; };
SETS['test-tube-diagonal'] = () => { const o = both(testTubeDiagonal); assertBox('test-tube-diagonal', o, TEST_TUBE_DIAGONAL_BOX); return o; };

/* ----------------------------------------------------------- thermometer */

/**
 * A tube with a bulb: cap of the tube's own half-width at the top (ink 1), a
 * bulb of radius R at the bottom (ink 23), the walls meeting the bulb through
 * a concave r=1 fillet. Shipped at a tube 8 wide with the bulb r=5.5, because
 * that is the narrowest tube that holds a mercury column at the house gap: the
 * column's ink is 11..13, the walls' inner ink 9 and 15, 2 each side; and the
 * column rises from a bead (r=1.5) at the bulb's centre, 2.5 clear of the bulb's
 * inner ink. 13 x 22: a vertical, whose short axis is its own.
 *
 * The fill opens the tube above the bulb (`bars-progress`) and leaves the
 * column stroked up through the white, so the reading survives: a black bulb
 * with the mercury rising out of it. Two narrower alternates without the
 * column were rendered and rejected as bottles.
 */
function thermoSet({ w, R, bead, column, level = 9 }) {
  const yb = 22 - R, cc = [12, 2 + w];
  const box = [12 - R - 1, 1, 12 + R + 1, 23];
  const out = {};
  for (const sharp of [false, true]) {
    const key = sharp ? 'sharp' : 'regular';
    const r = sharp ? 0 : 1;
    const p = new Path().M([12 - w, cc[1]]).A(cc, 180, 360, 1);
    let fR, fL;
    if (r) {
      fR = filletLineCircleOut([12 + w, cc[1]], [0, 1], [1, 0], [12, yb], R, r);
      fL = { F: mirX(fR.F), T: mirX(fR.T), A: mirX(fR.A) };
      p.L(fR.T).A(fR.F, ang(fR.F, fR.T), ang(fR.F, fR.A), -1)
        .A([12, yb], ang([12, yb], fR.A), ang([12, yb], fL.A), 1)
        .A(fL.F, ang(fL.F, fL.A), ang(fL.F, fL.T), -1)
        .L([12 - w, cc[1]]).Z();
    } else {
      const yj = yb - Math.sqrt(R * R - w * w);
      p.L([12 + w, yj]).A([12, yb], ang([12, yb], [12 + w, yj]), ang([12, yb], [12 - w, yj]), 1).L([12 - w, cc[1]]).Z();
    }
    const plate = plateOf(p.segs);
    const col = column ? run([[12, yb], [12, level]], sharp, [false, true], box) : '';
    const beadD = bead ? circlePath([12, yb], 1.5) : '';
    // the panel: inner cap, inner walls, and a chord where the inner walls meet the bulb's inner circle
    const wi = w - 1, yIn = yb - Math.sqrt((R - 1) * (R - 1) - wi * wi);
    const panel = [
      { type: 'A', c: cc, r: wi, a0: 180, a1: 360 },
      { type: 'L', p0: [12 + wi, cc[1]], p1: [12 + wi, yIn] },
      { type: 'L', p0: [12 + wi, yIn], p1: [12 - wi, yIn] },
      { type: 'L', p0: [12 - wi, yIn], p1: [12 - wi, cc[1]] },
    ];
    const d = p.toString() + col;
    out[`stroke.${key}`] = [S(d), ...(bead ? [F_(beadD)] : [])];
    out[`duotone.${key}`] = [P(contourPath(plate)), S(d), ...(bead ? [F_(beadD)] : [])];
    out[`fill.${key}`] = [F_(contourPath(plate) + hole(plate, panel)), ...(column ? [S(col)] : [])];
  }
  assertBox('thermometer', out, box);
  return out;
}
SETS.thermometer = () => fromRound2('thermometer', r2.thermometerStick);
ALTS['thermometer-bead'] = () => thermoSet({ w: 3, R: 4.5, bead: true, column: false });
ALTS['thermometer-plain'] = () => thermoSet({ w: 2.5, R: 4, bead: false, column: false });

/* ----------------------------------------------------------------- lungs */

/**
 * A trachea splitting into two bronchi, each entering a lobe. The lobes are
 * mirror images: a medial wall at x=8 (and 16), so the 4 units of white between
 * them hold the stem's ink with 2 either side; a flat base at y=22 (ink 23); and
 * a lateral side that is one circular arc, bulging to x=2 (ink 1), through
 * the base's outer corner and the apex. Its three corners turn on r=2 at the
 * apex, r=2 inside and r=3 outside the base, and the apex vertex is solved so
 * the lobe's painted top lands on y=9. The side is an arc rather than a
 * filleted edge so that sharp, which takes only the fillets out, keeps the
 * curve: a first cut on fillets alone came out as tents. The stem runs from ink
 * 1 to the fork at (12,6) and each bronchus from the fork onto its lobe's apex
 * arc, aimed at the arc's centre so it lands square on the centre line and is
 * buried. Ink 1..23 both ways; the empty top corners keep it off the circle
 * class. Fill: the two lobes solid, the airway stroked, `gift`'s pattern.
 */
const LUNGS_BOX = [1, 1, 23, 23];
const FORK = [12, 6];
function lobe(sharp, ya) {
  const A = [8, ya], B = [8, 22], C = [3, 22];
  // the lateral circle: leftmost point on x=2, through C and A. With C a unit
  // off the tangent line, (cy-22)^2 = 2R-1 and (cy-ya)^2 = 12R-36, which is a
  // quadratic in t = 22 - cy for the lobe's height h = 22 - ya.
  const h = 22 - ya;
  const t = (-2 * h + Math.sqrt(24 * h * h + 600)) / 10;
  const R = (t * t + 1) / 2;
  const K = [2 + R, 22 - t];
  const p = new Path();
  if (sharp) {
    p.M(A).L(B).L(C).A(K, ang(K, C), ang(K, A), 1).Z();
    return p;
  }
  const rA = 2, rB = 2, rC = 3;
  // the material is left of the medial wall and above the base, inside K
  const fA = filletLineArc(A, [0, 1], [-1, 0], K, R, rA);
  const fC = filletLineArc(C, [1, 0], [0, -1], K, R, rC);
  p.M(fA.T);
  p.corner(B, C, rB);
  p.L(fC.T).A(fC.F, ang(fC.F, fC.T), ang(fC.F, fC.A), 1)
    .A(K, ang(K, fC.A), ang(K, fA.A), 1)
    .A(fA.F, ang(fA.F, fA.A), ang(fA.F, fA.T), 1)
    .Z();
  p.apex = fA.F;
  return p;
}
function lungsApex(sharp) {
  let ya = 8, lo = 4, hi = 12;
  for (let i = 0; i < 60; i++) { ya = (lo + hi) / 2; if (strokedBBox(lobe(sharp, ya).d, 1, sharp ? 'butt' : 'round')[1] > 9) hi = ya; else lo = ya; }
  return ya;
}
function mirrorPath(p) {
  const q = new Path();
  q.d = p.d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (m, x, y) => `${num(24 - Number(x))} ${y}`);
  q.segs = mirrorSegs(p.segs);
  return q;
}
SETS.lungs = () => fromRound2('lungs', r2.lungs);

/* ------------------------------------------------------------------- ear */

/**
 * An ear in profile, open, so it ships stroke only. The helix is an r=7 arc
 * about (12,9) from its left horizontal (a free end) over the top (ink 1) to
 * its right horizontal, then an arc of R=17.5 about (1.5,9), the one circle
 * tangent to the helix there and to the lobe, leaning the back of the ear in,
 * and the lobe is r=3 about (12,19) (ink 23) run round to its left horizontal,
 * a free end. Inside, the antihelix is an r=2.5 arc about the helix's own
 * centre, 2 clear of it all round, with a 2-unit tail down its right side. 16
 * by 22; every free end is on an axis, so sharp adds the full unit as a stub.
 */
SETS.ear = () => fromRound2('ear', r2.ear);

/* --------------------------------------------------------------- earbuds */

// redrawn 13 Sep 2026 on his references: see `round2.mjs`
SETS.earbuds = () => fromRound2('earbuds', r2.earbuds);

/* ---------------------------------------------------------- hand-pointer */

// `hand-point` and `hand-point-inner` are gone (13 Sep 2026): his hand-pointer replaces the first
// (see `hands.mjs`) and he dropped the palm view.
for (const pose of ['up', 'right', 'left', 'down']) {
  const name = pose === 'up' ? 'hand-pointer' : `hand-pointer-${pose}`;
  SETS[name] = () => fromRound2(name, (sharp) => handPointer(pose, sharp));
}

/* ------------------------------------------------------------------ main */

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outArg = args.find((a) => a.startsWith('--out='));
  const root = outArg ? resolve(outArg.slice(6)) : ROOT;
  const alts = args.includes('--alts');
  const want = args.filter((a) => !a.startsWith('--'));
  const table = alts ? { ...SETS, ...ALTS } : SETS;
  const names = want.length ? want : Object.keys(table);
  for (const name of names) {
    if (!table[name]) throw new Error(`no such set: ${name}`);
    const variants = table[name]();
    writeSet(root, name, variants);
    const box = inkOf(variants['stroke.regular'], 'round');
    const sbox = inkOf(variants['stroke.sharp'], 'butt');
    console.log(name.padEnd(20), 'ink', box.map((v) => v.toFixed(2).padStart(6)).join(' '),
      ` ${(box[2] - box[0]).toFixed(1)} x ${(box[3] - box[1]).toFixed(1)}`,
      ' sharp', sbox.map((v) => v.toFixed(2).padStart(6)).join(' '),
      ` ${Object.keys(variants).length} variants`);
  }
}

export { SETS, ALTS, lobe, lungsApex };
