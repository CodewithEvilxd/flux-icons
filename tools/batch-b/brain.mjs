/**
 * `brain`, fitted from Zafar's hand drawing of 13 Sep 2026 (refs/brain.svg).
 *
 * His drawing is two mirrored hemispheres, each a chain of lobes whose arcs
 * run on into the interior as folds: a top lobe tangent to the fissure, an
 * upper lobe that curls into the top lobe's pocket, a side lobe that starts
 * inside and curls back in at its foot, then a continuous run of three lower
 * lobes round the bottom and up the fissure, and a short fold beside the
 * fissure. Every lobe was a near circle of 2.3 to 3.5, so every lobe is a true
 * circle here, fitted to his centres after one scale per axis (his ink was
 * 23 x 24 on a 26 x 28 canvas; this is 22 x 22, the circle size) and put on
 * quarter units.
 *
 * What was broken, and what changed:
 *
 * - the two medial walls ran 0.41 apart and the halves 0.1 off in height; the
 *   fissure is one line on x=12 and the right hemisphere is the left mirrored.
 * - a lobe that ends on its neighbour (top on upper, upper on side, the lower
 *   run on the side lobe) ends ON the neighbour's centre line, a buried T.
 * - the notches inside one run (side, lower side, lower, bottom) turn on the
 *   r=1 concave fillet; sharp takes them to the true crossing.
 * - the free fold ends sat 0.05 (side lobe into the lower lobe's pocket) to
 *   0.6 (upper lobe into the top lobe's pocket) from the next ink. At the house
 *   2 there is no drawing: the side lobe's pocket is 3.5 across and holds a
 *   cap, so every free end was re-aimed for daylight instead, and the folds end
 *   at 0.78 (upper lobe), 1.73 (side lobe's head), 1.11 (side lobe's foot) and
 *   1.2 (the fissure fold). A search over the lobes within half a unit of his
 *   found no better minimum that still looked like his drawing.
 *
 * Duotone: the plate is the silhouette offset by 1, one contour round both
 * hemispheres, cusped where the top and bottom lobes meet on the fissure.
 * Fill: that plate with the fissure and every fold knocked out at the stroke's
 * width. A fold that runs out into the rim stops along the neighbour's inner
 * ink, so the rim stays 2 thick; the fissure stops 2 short of the notches.
 */
import { Path, circleCross, filletArcArc, add, sub, mul, unit, len } from '../v5/geom.mjs';
import { offsetContour, contourPath, verify, mirrorSegs, flatten, clipContour } from '../v5/offset.mjs';
import { sharpEndIn } from '../v5/icons.mjs';
import { outlineRun } from '../v6/outline.mjs';

const rad = (a) => (a * Math.PI) / 180;
const ang = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
const norm = (a) => ((a % 360) + 360) % 360;

export const LOBES = {
  T: { c: [9.25, 4.75], r: 2.75 },   // tangent to the fissure at (12, 4.75), ink top 1
  U: { c: [7, 5.75], r: 2.25 },
  Sa: { c: [5.5, 9.25], r: 2.5 },
  Sb: { c: [4.75, 11.5], r: 2.75 },  // ink left 1
  L4: { c: [4.75, 14.75], r: 2.75 }, // ink left 1
  L5: { c: [6.5, 18], r: 2.5 },
  B: { c: [8.5, 18.5], r: 3.5 },     // tangent to the fissure at (12, 18.5), ink bottom 23
};
const U_END = -10, SA_START = -5, SB_END = 75;
const FOLD = { p0: [8.75, 13.5], p1: [7.25, 17], bow: 0.35 };
export const FISSURE = [LOBES.T.c[1], LOBES.B.c[1]];

/** The arc through a chord that bows `h` toward +x. */
function bowArc(p0, p1, h) {
  const m = mul(add(p0, p1), 0.5), L = len(sub(p1, p0));
  const R = (L * L / 4 + h * h) / (2 * Math.abs(h));
  const u = unit(sub(p1, p0));
  let nrm = [-u[1], u[0]];
  if (nrm[0] * Math.sign(h) < 0) nrm = mul(nrm, -1);
  const c = sub(m, mul(nrm, R - Math.abs(h)));
  const a0 = ang(c, p0);
  let a1 = ang(c, p1);
  while (a1 - a0 > 180) a1 -= 360;
  while (a0 - a1 > 180) a1 += 360;
  return { c, r: R, a0, a1 };
}

/** Both crossings of two circles. */
function crossings(c1, r1, c2, r2) {
  const d = len(sub(c2, c1));
  const x = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h2 = r1 * r1 - x * x;
  if (h2 < 0) return [];
  const e = unit(sub(c2, c1)), n = [-e[1], e[0]], m = add(c1, mul(e, x)), h = Math.sqrt(h2);
  return [add(m, mul(n, h)), add(m, mul(n, -h))];
}
const startPt = (g) => (g.type === 'L' ? g.p0 : on(g.c, g.r, g.a0));
const endPt = (g) => (g.type === 'L' ? g.p1 : on(g.c, g.r, g.a1));
const nearest = (pts, q) => pts.reduce((a, b) => (len(sub(b, q)) < len(sub(a, q)) ? b : a));

/**
 * The left hemisphere: its runs, the silhouette from the top cusp round to the
 * bottom one, and the three folds that leave the silhouette as tails.
 */
export function hemisphere(sharp) {
  const { T, U, Sa, Sb, L4, L5, B } = LOBES;
  const rf = sharp ? 0 : 1;
  const XTU = circleCross(T.c, T.r, U.c, U.r, [0, 0]);
  const XUS = circleCross(U.c, U.r, Sa.c, Sa.r, [-20, 5]);
  const XSL = circleCross(Sb.c, Sb.r, L4.c, L4.r, [-20, 13]);
  const notch = (a, b, toward) => {
    if (rf) {
      const f = filletArcArc(a.c, a.r, b.c, b.r, rf, toward);
      return { F: f.F, onA: f.onB, onB: f.onT };
    }
    const x = circleCross(a.c, a.r, b.c, b.r, toward);
    return { onA: x, onB: x };
  };
  const nSab = notch(Sa, Sb, [-20, 10]);
  const n45 = notch(L4, L5, [-20, 30]);
  const n5B = notch(L5, B, [0, 40]);
  const top = [T.c[0] + T.r, T.c[1]], bottom = [B.c[0] + B.r, B.c[1]];
  const turn = (p, n) => (rf ? p.A(n.F, ang(n.F, n.onA), ang(n.F, n.onB), 1) : p);

  // silhouette, top cusp -> bottom cusp
  const sil = new Path().M(top).A(T.c, 0, ang(T.c, XTU), -1)
    .A(U.c, ang(U.c, XTU), ang(U.c, XUS), -1)
    .A(Sa.c, ang(Sa.c, XUS), ang(Sa.c, nSab.onA), -1);
  turn(sil, nSab).A(Sb.c, ang(Sb.c, nSab.onB), ang(Sb.c, XSL), -1)
    .A(L4.c, ang(L4.c, XSL), ang(L4.c, n45.onA), -1);
  turn(sil, n45).A(L5.c, ang(L5.c, n45.onB), ang(L5.c, n5B.onA), -1);
  turn(sil, n5B).A(B.c, ang(B.c, n5B.onB), 0, -1);

  // free ends: a point, the unit direction the stroke leaves it in
  const stub = (p, dir) => (sharp ? add(p, mul(dir, sharpEndIn(p, dir))) : null);
  const tanDown = (a) => [Math.sin(rad(a)), -Math.cos(rad(a))];   // travel direction of a dir -1 arc at `a`

  const uStart = on(U.c, U.r, U_END), uOut = mul(tanDown(U_END), -1);
  const u = new Path().M(stub(uStart, uOut) ?? uStart);
  if (sharp) u.L(uStart);
  u.A(U.c, U_END, ang(U.c, XTU), -1);                      // ends ON the silhouette at XTU

  const sStart = on(Sa.c, Sa.r, SA_START), sOut = mul(tanDown(SA_START), -1);
  const sa = new Path().M(stub(sStart, sOut) ?? sStart);
  if (sharp) sa.L(sStart);
  sa.A(Sa.c, SA_START, ang(Sa.c, XUS), -1);                // ends ON the silhouette at XUS

  const sEnd = on(Sb.c, Sb.r, SB_END), sEndOut = tanDown(SB_END);
  const sb = new Path().M(XSL).A(Sb.c, ang(Sb.c, XSL), SB_END, -1);   // leaves the silhouette at XSL
  if (sharp) sb.L(stub(sEnd, sEndOut));

  const fa = bowArc(FOLD.p0, FOLD.p1, FOLD.bow);
  const fs = Math.sign(fa.a1 - fa.a0);
  const f0 = on(fa.c, fa.r, fa.a0), f1 = on(fa.c, fa.r, fa.a1);
  const fOut0 = mul([-Math.sin(rad(fa.a0)), Math.cos(rad(fa.a0))], -fs), fOut1 = mul([-Math.sin(rad(fa.a1)), Math.cos(rad(fa.a1))], fs);
  const fold = new Path().M(stub(f0, fOut0) ?? f0);
  if (sharp) fold.L(f0);
  fold.A(fa.c, fa.a0, fa.a1, fs);
  if (sharp) fold.L(stub(f1, fOut1));

  // the folds as tails: the arc from the free end back to where it joins the silhouette
  const tails = [
    { c: U.c, r: U.r, aEnd: U_END, J: XTU, nb: T, nbFrom: 0, nbSide: 1, out: uOut },
    { c: Sa.c, r: Sa.r, aEnd: SA_START, J: XUS, nb: U, nbFrom: ang(U.c, XTU), nbSide: 1, out: sOut },
    { c: Sb.c, r: Sb.r, aEnd: SB_END, J: XSL, nb: L4, nbFrom: ang(L4.c, n45.onA), nbSide: -1, out: sEndOut },
  ];
  return { sil, free: [u, sa, sb, fold], fold, tails, top, bottom, pts: { XTU, XUS, XSL } };
}

/** Reverse a seg. */
const rev = (g) => (g.type === 'L' ? { type: 'L', p0: g.p1, p1: g.p0 } : { type: 'A', c: g.c, r: g.r, a0: g.a1, a1: g.a0 });
const windingOf = (segs) => {
  const pts = flatten(segs, 24);
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return Math.sign(a);
};
const holeOf = (plate, segs) => contourPath(windingOf(plate) === windingOf(segs) ? [...segs].reverse().map(rev) : segs);
const mirrorD = (d) => d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (m, x, y) => `${Math.round((24 - Number(x)) * 1e4) / 1e4} ${y}`);

/**
 * A fold's knockout: the stroke's band from the free end back to where the
 * neighbour lobe's inner ink crosses it. `sharp` squares the free end on the
 * same stub the stroke has.
 */
function tailSlot(t, sharp) {
  const E = on(t.c, t.r, t.aEnd);
  const nbIn = t.nb.r - 1;
  const aJ = ang(t.c, t.J);
  const sgn = norm(aJ - t.aEnd) < 180 ? 1 : -1;
  const span = norm((aJ - t.aEnd) * sgn);
  const along = (a) => sgn * norm((a - t.aEnd) * sgn);          // signed sweep from aEnd
  const inTail = (a) => Math.abs(along(a)) > 1e-9 && Math.abs(along(a)) < span - 1e-9;
  // the neighbour's drawn arc runs from nbFrom to the junction
  const nbJ = ang(t.nb.c, t.J);
  const inNb = (p) => norm((ang(t.nb.c, p) - nbJ) * t.nbSide) < norm((t.nbFrom - nbJ) * t.nbSide);
  // the edge facing the neighbour meets its inner ink; which edge that is, is asked of the geometry
  const hit = (off) => crossings(t.c, t.r + off, t.nb.c, nbIn).filter((q) => inTail(ang(t.c, q)) && inNb(q));
  const near = hit(1).length ? 1 : -1, far = -near;
  const QA = nearest(hit(near), t.J);
  const qb = hit(far);
  const segs = [];
  const Enear = on(t.c, t.r + near, t.aEnd), Efar = on(t.c, t.r + far, t.aEnd);
  // near edge from the neighbour back to the free end
  segs.push({ type: 'A', c: t.c, r: t.r + near, a0: t.aEnd + along(ang(t.c, QA)), a1: t.aEnd });
  if (sharp) {
    const k = sharpEndIn(E, t.out);
    segs.push({ type: 'L', p0: Enear, p1: add(Enear, mul(t.out, k)) },
      { type: 'L', p0: add(Enear, mul(t.out, k)), p1: add(Efar, mul(t.out, k)) },
      { type: 'L', p0: add(Efar, mul(t.out, k)), p1: Efar });
  } else {
    const a0 = ang(E, Enear), aMid = (Math.atan2(t.out[1], t.out[0]) * 180) / Math.PI;
    segs.push({ type: 'A', c: E, r: 1, a0, a1: a0 + 180 * (norm(aMid - a0) < 180 ? 1 : -1) });
  }
  const short = (c, p, q) => { const a0 = ang(c, p); let a1 = ang(c, q); while (a1 - a0 > 180) a1 -= 360; while (a0 - a1 > 180) a1 += 360; return { a0, a1 }; };
  if (qb.length) {
    // the far edge meets the neighbour's inner ink too: close along that ink
    const QB = nearest(qb, t.J);
    segs.push({ type: 'A', c: t.c, r: t.r + far, a0: t.aEnd, a1: t.aEnd + along(ang(t.c, QB)) });
    segs.push({ type: 'A', c: t.nb.c, r: nbIn, ...short(t.nb.c, QB, QA) });
  } else {
    // it does not: the far edge runs to the junction, where the neighbour's cap
    // (a disc of 1 on J, tangent to that edge) takes over, then its inner ink
    const Jfar = on(t.c, t.r + far, aJ);
    const Jnb = add(t.J, mul(unit(sub(t.nb.c, t.J)), 1));
    segs.push({ type: 'A', c: t.c, r: t.r + far, a0: t.aEnd, a1: t.aEnd + sgn * span });
    const cap = short(t.J, Jfar, Jnb);
    segs.push({ type: 'A', c: t.J, r: 1, ...cap });
    segs.push({ type: 'A', c: t.nb.c, r: nbIn, ...short(t.nb.c, Jnb, QA) });
  }
  return segs;
}

/** The fissure fold's knockout: its band, exact, because the stubs are tangent to the arc. */
function foldSlot(sharp) {
  const fa = bowArc(FOLD.p0, FOLD.p1, FOLD.bow);
  const fs = Math.sign(fa.a1 - fa.a0);
  const rOf = (a, off) => on(fa.c, fa.r + off, a);
  const tan = (a) => mul([-Math.sin(rad(a)), Math.cos(rad(a))], fs);   // travel direction
  const k0 = sharp ? sharpEndIn(on(fa.c, fa.r, fa.a0), mul(tan(fa.a0), -1)) : 0;
  const k1 = sharp ? sharpEndIn(on(fa.c, fa.r, fa.a1), tan(fa.a1)) : 0;
  const segs = [];
  const P0o = rOf(fa.a0, 1), P0i = rOf(fa.a0, -1), P1o = rOf(fa.a1, 1), P1i = rOf(fa.a1, -1);
  if (sharp) {
    const back = mul(tan(fa.a0), -k0), fwd = mul(tan(fa.a1), k1);
    segs.push({ type: 'L', p0: add(P0o, back), p1: P0o });
    segs.push({ type: 'A', c: fa.c, r: fa.r + 1, a0: fa.a0, a1: fa.a1 });
    segs.push({ type: 'L', p0: P1o, p1: add(P1o, fwd) }, { type: 'L', p0: add(P1o, fwd), p1: add(P1i, fwd) }, { type: 'L', p0: add(P1i, fwd), p1: P1i });
    segs.push({ type: 'A', c: fa.c, r: fa.r - 1, a0: fa.a1, a1: fa.a0 });
    segs.push({ type: 'L', p0: P0i, p1: add(P0i, back) }, { type: 'L', p0: add(P0i, back), p1: add(P0o, back) });
  } else {
    const E0 = on(fa.c, fa.r, fa.a0), E1 = on(fa.c, fa.r, fa.a1);
    segs.push({ type: 'A', c: fa.c, r: fa.r + 1, a0: fa.a0, a1: fa.a1 });
    const c1 = ang(E1, P1o); segs.push({ type: 'A', c: E1, r: 1, a0: c1, a1: c1 + 180 * fs });
    segs.push({ type: 'A', c: fa.c, r: fa.r - 1, a0: fa.a1, a1: fa.a0 });
    const c0 = ang(E0, P0i); segs.push({ type: 'A', c: E0, r: 1, a0: c0, a1: c0 + 180 * fs });
  }
  return segs;
}

/** Every layer of `brain` for one treatment. */
export function brainVariants(sharp) {
  const h = hemisphere(sharp);
  const free = h.free.map(String).join('');
  const silSegs = [...h.sil.segs, ...mirrorSegs(h.sil.segs).reverse().map(rev)];
  // the silhouette closed round both hemispheres, the fissure, then the folds
  const d = contourPath(silSegs) + `M${h.bottom[0]} ${h.bottom[1]}L${h.top[0]} ${h.top[1]}` + free + mirrorD(free);
  const plate = offsetContour(silSegs, 1);
  verify(silSegs, plate, 1);
  // fill: the two hemispheres as separate solids, a stroke's width apart. Each is
  // its half of the silhouette cut down the line x = 10 and offset by 1, so its
  // medial edge lands on 11, the fissure's own inner ink, and the corners where
  // that edge meets the top and bottom lobes round on the offset's r=1. Of the
  // folds only the one beside the fissure is knocked out of each half, at the
  // stroke's width: all of them read as holes, none left the halves blank, and
  // on 13 Sep he picked this one (the three lobe tails stay solid).
  const closed = [...h.sil.segs, { type: 'L', p0: h.bottom, p1: h.top }];
  const cut = clipContour(closed, [10, 0], [1, 0], 0, -1)[0];
  const half = [...cut, { type: 'L', p0: endPt(cut[cut.length - 1]), p1: startPt(cut[0]) }];
  const leftFill = offsetContour(half, 1);
  verify(half, leftFill, 1);
  const rightFill = mirrorSegs(leftFill).reverse().map(rev);
  const holes = [foldSlot(sharp)];
  const fill = contourPath(leftFill) + holes.map((s) => holeOf(leftFill, s)).join('')
    + contourPath(rightFill) + holes.map((s) => holeOf(rightFill, mirrorSegs(s).reverse().map(rev))).join('');
  return { h, d, plate, silSegs, fill, holes, leftFill };
}

export { tailSlot, holeOf, mirrorD, bowArc, rev, windingOf };
